import { FavoritesService } from './favorites.service';
import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleGuard } from '../../common/guards';
import { UserInRequest } from '../../common/decorators';
import { User } from '@prisma/client';

@ApiTags('Favorite Products')
@ApiBearerAuth()
@Controller('favorites')
@UseGuards(RoleGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  getCartDetail(@UserInRequest() user: User) {
    return this.favoritesService.getFavoritesDetail(user.id);
  }

  @Post('add')
  addProductToCart(
    @UserInRequest() user: User,
    @Query('product') productIdentifier: string,
  ) {
    return this.favoritesService.addProductToFavorites(
      user.id,
      productIdentifier,
    );
  }

  @Delete('remove')
  removeProductInCart(
    @UserInRequest() user: User,
    @Query('product') productIdentifier: string,
  ) {
    return this.favoritesService.removeProductInFavorites(
      user.id,
      productIdentifier,
    );
  }
}
