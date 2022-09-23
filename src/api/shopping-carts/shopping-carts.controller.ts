import { RoleGuard } from '../../common/guards';
import { ShoppingCartsService } from './shopping-carts.service';
import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserInRequest } from '../../common/decorators';
import { User } from '@prisma/client';

@ApiTags('Shopping Cart')
@ApiBearerAuth()
@Controller('shopping-carts')
@UseGuards(RoleGuard)
export class ShoppingCartsController {
  constructor(private cartsService: ShoppingCartsService) {}

  @Get()
  getCartDetail(@UserInRequest() user: User) {
    return this.cartsService.getCartDetail(user.id);
  }

  @Post('add')
  addProductToCart(
    @UserInRequest() user: User,
    @Query('product') productIdentifier: string,
  ) {
    return this.cartsService.addProductToCart(user.id, productIdentifier);
  }

  @Delete('remove')
  removeProductInCart(
    @UserInRequest() user: User,
    @Query('product') productIdentifier: string,
  ) {
    return this.cartsService.removeProductInCart(user.id, productIdentifier);
  }
}
