import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { RequestOtpDto } from './dto/request-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from './types/authenticated-user.type.js';

@ApiTags('Auth')
@UseGuards(ThrottlerGuard)
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: 3,
      ttl: 60_000,
    },
  })
  @ApiOperation({
    summary: 'درخواست کد تأیید شماره موبایل',
  })
  @ApiOkResponse({
    description: 'کد تأیید با موفقیت ارسال شد.',
  })
  @ApiTooManyRequestsResponse({
    description: 'محدودیت تعداد درخواست یا زمان انتظار ارسال مجدد فعال است.',
  })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: 10,
      ttl: 300_000,
    },
  })
  @ApiOperation({
    summary: 'تأیید کد و دریافت توکن ورود',
  })
  @ApiOkResponse({
    description: 'احراز هویت با موفقیت انجام شد.',
  })
  @ApiUnauthorizedResponse({
    description: 'کد تایید نامعتبر یا منقضی شده است',
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'دریافت اطلاعات کاربر واردشده',
  })
  @ApiOkResponse({
    description: 'اطلاعات کاربر با موفقیت دریافت شد.',
  })
  @ApiUnauthorizedResponse({
    description: 'اطلاعات ورود موجود نیست، نامعتبر است یا منقضی شده است.',
  })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: await this.authService.getAuthenticatedUser(user.id),
    };
  }
}
