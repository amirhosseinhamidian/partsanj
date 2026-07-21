import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OtpPurpose, UserRole } from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { generateNumericOtp, hashOtp, otpHashesMatch, parseJwtTtlToSeconds } from './auth.utils.js';
import { KavenegarService } from './kavenegar.service.js';
import { RequestOtpDto } from './dto/request-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly kavenegarService: KavenegarService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    const mobile = dto.mobile;
    const now = new Date();

    const otpLength = this.getPositiveInteger('OTP_LENGTH', 6);
    const ttlSeconds = this.getPositiveInteger('OTP_TTL_SECONDS', 120);
    const resendCooldownSeconds = this.getPositiveInteger('OTP_RESEND_COOLDOWN_SECONDS', 90);
    const maxAttempts = this.getPositiveInteger('OTP_MAX_ATTEMPTS', 5);

    const cooldownStartedAt = new Date(now.getTime() - resendCooldownSeconds * 1000);

    const latestChallenge = await this.prisma.otpChallenge.findFirst({
      where: {
        mobile,
        purpose: OtpPurpose.AUTHENTICATION,
        sentAt: {
          gt: cooldownStartedAt,
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    if (latestChallenge) {
      const resendAvailableAt = new Date(
        latestChallenge.sentAt.getTime() + resendCooldownSeconds * 1000,
      );

      throw new HttpException(
        {
          message: 'لطفاً برای درخواست مجدد کد کمی صبر کنید.',
          resendAvailableAt,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = generateNumericOtp(otpLength);
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    const otpHashSecret = this.configService.getOrThrow<string>('OTP_HASH_SECRET');

    const challenge = await this.prisma.$transaction(async (transaction) => {
      await transaction.otpChallenge.updateMany({
        where: {
          mobile,
          purpose: OtpPurpose.AUTHENTICATION,
          consumedAt: null,
          invalidatedAt: null,
        },
        data: {
          invalidatedAt: now,
        },
      });

      return transaction.otpChallenge.create({
        data: {
          mobile,
          purpose: OtpPurpose.AUTHENTICATION,
          codeHash: hashOtp(mobile, OtpPurpose.AUTHENTICATION, code, otpHashSecret),
          expiresAt,
          maxAttempts,
        },
      });
    });

    try {
      const result = await this.kavenegarService.sendVerificationCode(mobile, code);

      if (result.providerMessageId) {
        await this.prisma.otpChallenge.update({
          where: {
            id: challenge.id,
          },
          data: {
            providerMessageId: result.providerMessageId,
          },
        });
      }
    } catch (error) {
      await this.prisma.otpChallenge.update({
        where: {
          id: challenge.id,
        },
        data: {
          invalidatedAt: new Date(),
        },
      });

      throw error;
    }

    return {
      message: 'کد تأیید با موفقیت ارسال شد.',
      expiresAt,
      resendAvailableAt: new Date(now.getTime() + resendCooldownSeconds * 1000),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const mobile = dto.mobile;
    const now = new Date();

    const challenge = await this.prisma.otpChallenge.findFirst({
      where: {
        mobile,
        purpose: OtpPurpose.AUTHENTICATION,
        consumedAt: null,
        invalidatedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!challenge || challenge.attempts >= challenge.maxAttempts) {
      throw new UnauthorizedException('کد تأیید نامعتبر است یا منقضی شده است.');
    }

    const otpHashSecret = this.configService.getOrThrow<string>('OTP_HASH_SECRET');

    const receivedCodeHash = hashOtp(mobile, OtpPurpose.AUTHENTICATION, dto.code, otpHashSecret);

    const isCodeValid = otpHashesMatch(challenge.codeHash, receivedCodeHash);

    if (!isCodeValid) {
      const updatedChallenge = await this.prisma.otpChallenge.update({
        where: {
          id: challenge.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
        select: {
          attempts: true,
          maxAttempts: true,
        },
      });

      if (updatedChallenge.attempts >= updatedChallenge.maxAttempts) {
        await this.prisma.otpChallenge.update({
          where: {
            id: challenge.id,
          },
          data: {
            invalidatedAt: new Date(),
          },
        });
      }

      throw new UnauthorizedException('کد تأیید نامعتبر است یا منقضی شده است.');
    }

    const user = await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.otpChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          invalidatedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          consumedAt: now,
        },
      });

      if (consumed.count !== 1) {
        throw new UnauthorizedException('کد تأیید نامعتبر است یا منقضی شده است.');
      }

      const existingUser = await transaction.user.findUnique({
        where: {
          mobile,
        },
      });

      if (existingUser && !existingUser.isActive) {
        throw new ForbiddenException('این حساب کاربری غیرفعال است.');
      }

      if (existingUser) {
        return transaction.user.update({
          where: {
            id: existingUser.id,
          },
          data: {
            mobileVerifiedAt: existingUser.mobileVerifiedAt ?? now,
            lastLoginAt: now,
          },
        });
      }

      return transaction.user.create({
        data: {
          mobile,
          role: UserRole.CUSTOMER,
          mobileVerifiedAt: now,
          lastLoginAt: now,
        },
      });
    });

    const expiresInSeconds = parseJwtTtlToSeconds(
      this.configService.getOrThrow<string>('JWT_ACCESS_TTL'),
    );

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      mobile: user.mobile,
      role: user.role,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: expiresInSeconds,
      user: {
        id: user.id,
        mobile: user.mobile,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async getAuthenticatedUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        mobile: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('اعتبار ورود شما به پایان رسیده است. لطفاً دوباره وارد شوید');
    }

    return {
      id: user.id,
      mobile: user.mobile,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  private getPositiveInteger(key: string, fallbackValue: number): number {
    const rawValue = this.configService.get<string>(key);
    const parsedValue = Number(rawValue ?? fallbackValue);

    if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
      throw new InternalServerErrorException(`مقدار تنظیمات ${key} باید یک عدد صحیح مثبت باشد.`);
    }

    return parsedValue;
  }
}
