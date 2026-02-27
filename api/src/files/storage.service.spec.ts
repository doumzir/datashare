import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import { StorageService } from './storage.service';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  unlink: jest.fn(),
}));

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  describe('getFilePath', () => {
    it('should return a path containing the filename', () => {
      const result = service.getFilePath('test.pdf');
      expect(result).toContain('test.pdf');
    });
  });

  describe('deleteFile', () => {
    it('should delete the file if it exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlink as unknown as jest.Mock).mockImplementation(
        (_path: string, cb: (err: null) => void) => cb(null),
      );

      await service.deleteFile('test.pdf');

      expect(fs.unlink).toHaveBeenCalled();
    });

    it('should not throw if file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(service.deleteFile('missing.pdf')).resolves.not.toThrow();
      expect(fs.unlink).not.toHaveBeenCalled();
    });
  });
});
