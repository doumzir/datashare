import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { extname } from 'path';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { UploadFileDto } from './dto/upload-file.dto';

const FORBIDDEN_EXTENSIONS = ['.exe', '.bat', '.sh', '.ps1', '.cmd', '.msi'];

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(
    file: Express.Multer.File,
    dto: UploadFileDto,
    userId: string | null,
  ) {
    const ext = extname(file.originalname).toLowerCase();
    if (FORBIDDEN_EXTENSIONS.includes(ext)) {
      await this.storage.deleteFile(file.filename);
      throw new UnprocessableEntityException('File type not allowed');
    }

    const token = randomBytes(16).toString('base64url');
    const days = Math.min(Math.max(parseInt(dto.expiresIn ?? '7') || 7, 1), 7);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const hashedPassword = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : null;

    const tagList = dto.tags
      ? [...new Set(
          dto.tags
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0 && t.length <= 30),
        )]
      : [];

    return this.prisma.file.create({
      data: {
        token,
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        expiresAt,
        password: hashedPassword,
        userId,
        tags: { create: tagList.map((name) => ({ name })) },
      },
      include: { tags: true },
    });
  }

  async getByToken(token: string) {
    const file = await this.prisma.file.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
      include: { tags: true },
    });
    if (!file) throw new NotFoundException('File not found or expired');
    return file;
  }

  async getMyFiles(userId: string, tag?: string) {
    return this.prisma.file.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
        ...(tag ? { tags: { some: { name: tag } } } : {}),
      },
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteById(id: string, userId: string) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    if (file.userId !== userId) throw new ForbiddenException('Forbidden');

    await this.storage.deleteFile(file.storedName);
    await this.prisma.file.delete({ where: { id } });
    return { message: 'File deleted' };
  }

  async verifyPassword(token: string, password: string) {
    const file = await this.getByToken(token);
    if (!file.password) return { valid: true };
    const valid = await bcrypt.compare(password, file.password);
    if (!valid) throw new UnauthorizedException('Wrong password');
    return { valid: true };
  }

  async incrementDownloadCount(id: string) {
    await this.prisma.file.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
  }
}
