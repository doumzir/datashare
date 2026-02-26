import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { StorageService } from './storage.service';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [FilesController],
  providers: [FilesService, StorageService, SchedulerService],
})
export class FilesModule {}
