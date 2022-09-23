import { VouchersService } from './vouchers.service';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserInRequest } from '../../common/decorators';
import { User } from '@prisma/client';

@ApiTags('Vouchers')
@ApiBearerAuth()
@Controller('vouchers')
export class VouchersController {
  constructor(private vouchersService: VouchersService) {}

  @Get('available')
  getAvailableVouchers(@UserInRequest() user: User) {
    return this.vouchersService.getAvailableVouchersOfUser(user.id);
  }
}
