import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  @Cron('0 0 * * *')
  async purgeExpiredFiles() {
    this.logger.log('Running daily purge of expired files...');

    const expired = await this.prisma.file.findMany({
      where: { expiresAt: { lt: new Date() } },
    });

    let count = 0;
    for (const file of expired) {
      await this.storage.deleteFile(file.storedName);
      await this.prisma.file.delete({ where: { id: file.id } });
      count++;
    }

    this.logger.log(`Purged ${count} expired file(s).`);
  }
}
