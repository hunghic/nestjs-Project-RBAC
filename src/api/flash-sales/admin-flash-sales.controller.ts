import { FlashSalesService } from './flash-sales.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleGuard } from '../../common/guards';
import { RequireRole } from '../../common/decorators';
import { Role } from '@prisma/client';
import { CreateFlashSaleDto } from './dto';

@ApiTags('Flash Sales', 'Admin')
@ApiBearerAuth()
@Controller('admin/flash-sales')
@UseGuards(RoleGuard)
@RequireRole(Role.Admin)
export class AdminFlashSalesController {
  constructor(private flashSalesService: FlashSalesService) {}

  @Get()
  getAllFlashSales() {
    return this.flashSalesService.getAllFlashSales();
  }

  @Get(':id')
  getFlashSaleById(@Param('id', ParseIntPipe) flashSaleId: number) {
    return this.flashSalesService.getFlashSaleById(flashSaleId);
  }

  @Post()
  createVoucherForAllUsers(@Body() body: CreateFlashSaleDto) {
    return this.flashSalesService.createFlashSale(body);
  }

  @Delete(':id')
  deleteFlashSale(@Param('id', ParseIntPipe) flashSaleId: number) {
    return this.flashSalesService.deleteFlashSale(flashSaleId);
  }
}
