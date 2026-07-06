import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminUserController } from './admin-user.controller.js';
import { AdminUserService } from './admin-user.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminUserController],
  providers: [AdminUserService],
})
export class AdminUserModule {}
