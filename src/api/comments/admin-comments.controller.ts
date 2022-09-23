import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RequireRole } from 'src/common/decorators';
import { RoleGuard } from '../../common/guards';
import { CommentsService } from './comments.service';

@ApiTags('Product Comments', 'Admin')
@ApiBearerAuth()
@Controller('admin/comments')
@UseGuards(RoleGuard)
@RequireRole(Role.Admin)
export class AdminCommentsController {
  constructor(private commentsService: CommentsService) {}

  @Delete(':id')
  deleteProductComment(@Param('id', ParseIntPipe) commentId: number) {
    return this.commentsService.adminDeleteComment(commentId);
  }
}
