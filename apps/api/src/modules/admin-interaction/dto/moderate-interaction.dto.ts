import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ContentModerationStatus } from '../../../generated/prisma/client.js';

const ADMIN_MODERATION_STATUSES = [
  ContentModerationStatus.APPROVED,
  ContentModerationStatus.REJECTED,
  ContentModerationStatus.SPAM,
  ContentModerationStatus.DELETED,
] as const;

export class ModerateInteractionDto {
  @ApiProperty({
    enum: ADMIN_MODERATION_STATUSES,
  })
  @IsIn(ADMIN_MODERATION_STATUSES)
  status!: ContentModerationStatus;
}
