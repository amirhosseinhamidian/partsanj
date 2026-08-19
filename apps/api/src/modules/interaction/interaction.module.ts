import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module.js';
import { ProductInteractionController } from './product/product-interaction.controller.js';
import { ProductInteractionService } from './product/product-interaction.service.js';

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

  controllers: [ProductInteractionController],

  providers: [ProductInteractionService],

  exports: [ProductInteractionService],
})
export class InteractionModule {}
