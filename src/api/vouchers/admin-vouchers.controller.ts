import { RequireRole } from './../../common/decorators/require-role.decorator';
import { RoleGuard } from './../../common/guards/role.guard';
import { VouchersService } from './vouchers.service';
import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CreateGeneralVoucherDto, CreatePersonalVoucherDto } from './dto';

@ApiTags('Vouchers', 'Admin')
@ApiBearerAuth()
@Controller('admin/vouchers')
@UseGuards(RoleGuard)
@RequireRole(Role.Admin)
export class AdminVouchersController {
  constructor(private vouchersService: VouchersService) {}

  @Post('general')
  createVoucherForAllUsers(@Body() body: CreateGeneralVoucherDto) {
    return this.vouchersService.createGeneralVoucher(body);
  }

  @Post('personal')
  createVoucherForSpecificUsers(@Body() body: CreatePersonalVoucherDto) {
    return this.vouchersService.createPersonalVoucher(body);
  }

  @Delete(':id')
  deleteVoucher(@Param('id', ParseIntPipe) voucherId: number) {
    return this.vouchersService.deleteVoucher(voucherId);
  }
}
