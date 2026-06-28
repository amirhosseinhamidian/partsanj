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
    summary: 'Request a mobile verification code',
  })
  @ApiOkResponse({
    description: 'Verification code sent successfully',
  })
  @ApiTooManyRequestsResponse({
    description: 'Request limit or resend cooldown reached',
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
    summary: 'Verify OTP and receive a JWT access token',
  })
  @ApiOkResponse({
    description: 'Verification completed successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Verification code is invalid or expired',
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get the authenticated user profile',
  })
  @ApiOkResponse({
    description: 'Authenticated user returned successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token is missing, invalid, or expired',
  })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: user,
    };
  }
}
