import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { GUEST_CART_TOKEN_HEADER } from './cart.constants.js';
import { CartService } from './cart.service.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { CartItemIdParamDto } from './dto/cart-item-id-param.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';

@ApiTags('Cart')
@ApiBearerAuth('access-token')
@UseGuards(OptionalJwtAuthGuard)
@Controller({
  path: 'cart',
  version: '1',
})
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Headers(GUEST_CART_TOKEN_HEADER)
    guestToken: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.cartService.getCart(user, guestToken);

    this.writeNoCacheHeaders(response);

    return {
      data: result.cart,
    };
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  async addItem(
    @Body() dto: AddCartItemDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Headers(GUEST_CART_TOKEN_HEADER)
    guestToken: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.cartService.addItem(user, guestToken, dto);

    this.writeCartHeaders(response, result.issuedGuestToken);

    return {
      data: result.cart,
    };
  }

  @Patch('items/:itemId')
  async updateItemQuantity(
    @Param() params: CartItemIdParamDto,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Headers(GUEST_CART_TOKEN_HEADER)
    guestToken: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.cartService.updateItemQuantity(user, guestToken, params.itemId, dto);

    this.writeNoCacheHeaders(response);

    return {
      data: result.cart,
    };
  }

  @Delete('items/:itemId')
  async removeItem(
    @Param() params: CartItemIdParamDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Headers(GUEST_CART_TOKEN_HEADER)
    guestToken: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.cartService.removeItem(user, guestToken, params.itemId);

    this.writeNoCacheHeaders(response);

    return {
      data: result.cart,
    };
  }

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  async mergeGuestCart(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Headers(GUEST_CART_TOKEN_HEADER)
    guestToken: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.cartService.mergeGuestCart(user, guestToken);

    this.writeNoCacheHeaders(response);

    return {
      data: result.cart,
      meta: {
        merged: result.merged,
      },
    };
  }

  private writeCartHeaders(response: Response, issuedGuestToken?: string) {
    this.writeNoCacheHeaders(response);

    if (issuedGuestToken) {
      response.setHeader(GUEST_CART_TOKEN_HEADER, issuedGuestToken);
    }
  }

  private writeNoCacheHeaders(response: Response) {
    response.setHeader('Cache-Control', 'no-store');
  }
}
