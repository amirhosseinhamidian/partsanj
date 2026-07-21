import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto.js';

@Injectable()
export class CustomerProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(customerUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: customerUserId,
      },
      select: {
        id: true,
        mobile: true,
        firstName: true,
        lastName: true,
        mobileVerifiedAt: true,
        createdAt: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'اعتبار ورود شما به پایان رسیده است. لطفاً دوباره وارد شوید.',
      );
    }

    return {
      data: {
        id: user.id,
        mobile: user.mobile,
        firstName: user.firstName,
        lastName: user.lastName,
        mobileVerifiedAt: user.mobileVerifiedAt,
        createdAt: user.createdAt,
      },
    };
  }

  async updateProfile(customerUserId: string, dto: UpdateCustomerProfileDto) {
    const result = await this.prisma.user.updateMany({
      where: {
        id: customerUserId,
        isActive: true,
      },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    if (result.count !== 1) {
      throw new UnauthorizedException(
        'اعتبار ورود شما به پایان رسیده است. لطفاً دوباره وارد شوید.',
      );
    }

    return this.getProfile(customerUserId);
  }
}
