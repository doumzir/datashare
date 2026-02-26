import 'dotenv/config';
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, FilesModule],
})
export class AppModule {}
