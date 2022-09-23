import { CreateTagDto } from './dto';
import { TagsService } from './tags.service';
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
import { Role } from '@prisma/client';
import { RequireRole } from '../../common/decorators';
import { RoleGuard } from '../../common/guards';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Tags')
@Controller('tags')
@UseGuards(RoleGuard)
@RequireRole(Role.Admin)
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @ApiBearerAuth()
  @Get()
  @RequireRole(Role.User)
  getAllTags() {
    return this.tagsService.getAllTags();
  }

  @ApiBearerAuth()
  @Post()
  async createTag(@Body() body: CreateTagDto) {
    try {
      const tag = await this.tagsService.createTag(body.tagName);
      return tag;
    } catch (error) {
      throw error;
    }
  }

  @ApiBearerAuth()
  @Put(':id')
  async updateTagName(
    @Body() body: CreateTagDto,
    @Param('id', ParseIntPipe) tagId: number,
  ) {
    try {
      const tag = await this.tagsService.updateName(tagId, body.tagName);
      return tag;
    } catch (error) {
      throw error;
    }
  }

  @ApiBearerAuth()
  @Delete(':id')
  async deleteTag(@Param('id', ParseIntPipe) tagId: number) {
    try {
      return this.tagsService.deleteTag(tagId);
    } catch (error) {
      throw error;
    }
  }

  @ApiBearerAuth()
  @RequireRole(Role.User)
  @Get(':identifier/products')
  async getProdctsByTag(@Param('identifier') tagIdentifier: string) {
    try {
      const tagId = parseInt(tagIdentifier);
      if (isNaN(tagId))
        return this.tagsService.getProductsOfTagName(tagIdentifier);
      return this.tagsService.getProductsOfTagId(tagId);
    } catch (error) {
      throw error;
    }
  }

  @ApiBearerAuth()
  @RequireRole(Role.User)
  @Get(':identifier/blogs')
  async getBlogsByTag(@Param('identifier') tagIdentifier: string) {
    try {
      const tagId = parseInt(tagIdentifier);
      if (isNaN(tagId))
        return this.tagsService.getBlogsOfTagName(tagIdentifier);
      return this.tagsService.getBlogsOfTagId(tagId);
    } catch (error) {
      throw error;
    }
  }
}
