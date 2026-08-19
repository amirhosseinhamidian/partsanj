import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from '../auth/auth.module.js';

import { BlogInteractionController } from './blog/blog-interaction.controller.js';
import { BlogInteractionService } from './blog/blog-interaction.service.js';

import { ProductInteractionController } from './product/product-interaction.controller.js';
import { ProductInteractionService } from './product/product-interaction.service.js';

import { ContentReportController } from './report/content-report.controller.js';
import { ContentReportService } from './report/content-report.service.js';

@Module({
  imports: [
    AuthModule,

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 100,
        },
      ],
    }),
  ],

  controllers: [ProductInteractionController, BlogInteractionController, ContentReportController],

  providers: [ProductInteractionService, BlogInteractionService, ContentReportService],

  exports: [ProductInteractionService, BlogInteractionService, ContentReportService],
})
export class InteractionModule {}
