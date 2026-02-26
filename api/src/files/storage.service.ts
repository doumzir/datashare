import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { unlink, existsSync } from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(unlink);

@Injectable()
export class StorageService {
  readonly uploadDir: string = join(
    process.cwd(),
    process.env.UPLOAD_DIR ?? './uploads',
  );

  getFilePath(storedName: string): string {
    return join(this.uploadDir, storedName);
  }

  async deleteFile(storedName: string): Promise<void> {
    const filepath = this.getFilePath(storedName);
    if (existsSync(filepath)) {
      await unlinkAsync(filepath);
    }
  }
}
