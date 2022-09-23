import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UserInRequest } from '../../common/decorators';
import { CommentsService } from './comments.service';
import { CreateCommentDto, ReplyCommentDto } from './dto';

@ApiTags('Product Comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post('product')
  createProductComment(
    @UserInRequest() user: User,
    @Body() body: CreateCommentDto,
  ) {
    return this.commentsService.createComment(user.id, body);
  }

  @Post(':id/reply')
  replyProductComment(
    @UserInRequest() user: User,
    @Param('id', ParseIntPipe) commentId: number,
    @Body() body: ReplyCommentDto,
  ) {
    return this.commentsService.replyComment(user.id, commentId, body);
  }

  @Delete(':id')
  deleteProductComment(
    @UserInRequest() user: User,
    @Param('id', ParseIntPipe) commentId: number,
  ) {
    return this.commentsService.deleteComment(user.id, commentId);
  }
}
