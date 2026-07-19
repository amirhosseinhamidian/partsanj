import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { UploadImageDto } from './dto/upload-image.dto.js';
import { UploadPurpose } from './upload-purpose.enum.js';
import { UploadsService } from './uploads.service.js';
import type { UploadedImageResponse } from './uploads.service.js';

@ApiTags('Admin Uploads')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/uploads',
  version: '1',
})
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'purpose'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        purpose: {
          type: 'string',
          enum: Object.values(UploadPurpose),
          example: UploadPurpose.PRODUCT,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Image uploaded and converted to WebP',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid image or multipart request',
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiResponse({
    status: 413,
    description: 'Image exceeds the configured size limit',
  })
  @ApiResponse({
    status: 415,
    description: 'Unsupported or spoofed image format',
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadImageDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: UploadedImageResponse }> {
    const uploadedImage = await this.uploadsService.uploadImage(file, dto.purpose, user.id);

    return {
      data: uploadedImage,
    };
  }
}
