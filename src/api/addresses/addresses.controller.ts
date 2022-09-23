import { AddressesService } from './addresses.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleGuard } from '../../common/guards';
import { UserInRequest } from '../../common/decorators';
import { User } from '@prisma/client';
import { CreateAddressDto, UpdateAddressDto } from './dto';

@ApiTags('Delivery Addresses')
@ApiBearerAuth()
@Controller('addresses')
@UseGuards(RoleGuard)
export class AddressesController {
  constructor(private addressesService: AddressesService) {}

  @Get()
  getAllUserAddresses(@UserInRequest() user: User) {
    return this.addressesService.getUserListAddresses(user.id);
  }

  @Get(':id')
  getUserAddress(
    @UserInRequest() user: User,
    @Param('id', ParseIntPipe) addressId: number,
  ) {
    return this.addressesService.getUserAddress(user.id, addressId);
  }

  @Post()
  createAddress(@UserInRequest() user: User, @Body() body: CreateAddressDto) {
    return this.addressesService.createAddress(user, body);
  }

  @Put(':id')
  updateAddress(
    @UserInRequest() user: User,
    @Param('id', ParseIntPipe) addressId: number,
    @Body() body: UpdateAddressDto,
  ) {
    return this.addressesService.updateAddress(user.id, addressId, body);
  }

  @Delete(':id')
  deleteAddress(
    @UserInRequest() user: User,
    @Param('id', ParseIntPipe) addressId: number,
  ) {
    return this.addressesService.deleteAddress(user.id, addressId);
  }
}
