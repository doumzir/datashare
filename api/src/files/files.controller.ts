import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';
import { createReadStream } from 'fs';
import type { Response } from 'express';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

const uploadDir = join(process.cwd(), process.env.UPLOAD_DIR ?? './uploads');

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          cb(null, `${randomBytes(16).toString('hex')}${ext}`);
        },
      }),
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE ?? '1073741824'),
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Req() req: any,
  ) {
    return this.filesService.create(file, dto, req.user?.id ?? null);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyFiles(@Req() req: any, @Query('tag') tag?: string) {
    return this.filesService.getMyFiles(req.user.id, tag);
  }

  @Get(':token')
  async getMetadata(@Param('token') token: string) {
    const file = await this.filesService.getByToken(token);
    return {
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      expiresAt: file.expiresAt,
      createdAt: file.createdAt,
      downloadCount: file.downloadCount,
      hasPassword: !!file.password,
      tags: file.tags.map((t) => ({ name: t.name })),
    };
  }

  @Get(':token/download')
  async download(
    @Param('token') token: string,
    @Query('password') password: string | undefined,
    @Res() res: Response,
  ) {
    const file = await this.filesService.getByToken(token);

    if (file.password) {
      await this.filesService.verifyPassword(token, password ?? '');
    }

    await this.filesService.incrementDownloadCount(file.id);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    );
    res.setHeader('Content-Length', file.size);

    createReadStream(file.path).pipe(res);
  }

  @Post(':token/verify-password')
  @HttpCode(HttpStatus.OK)
  verifyPassword(
    @Param('token') token: string,
    @Body('password') password: string,
  ) {
    return this.filesService.verifyPassword(token, password);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteFile(@Param('id') id: string, @Req() req: any) {
    return this.filesService.deleteById(id, req.user.id);
  }
}
