import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { FilesService } from './files.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';

const mockFile = (overrides = {}): Express.Multer.File =>
  ({
    originalname: 'document.pdf',
    filename: 'abc123.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    path: '/uploads/abc123.pdf',
    ...overrides,
  }) as Express.Multer.File;

const mockPrismaFile = (overrides = {}) => ({
  id: 'file-1',
  token: 'tok123',
  originalName: 'document.pdf',
  storedName: 'abc123.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  path: '/uploads/abc123.pdf',
  expiresAt: new Date(Date.now() + 86400000),
  createdAt: new Date(),
  password: null,
  userId: 'user-1',
  downloadCount: 0,
  tags: [],
  ...overrides,
});

const mockPrisma = {
  file: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockStorage = {
  deleteFile: jest.fn().mockResolvedValue(undefined),
};

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  describe('create', () => {
    it('should create a file and return it', async () => {
      const file = mockFile();
      const created = mockPrismaFile();
      mockPrisma.file.create.mockResolvedValue(created);

      const result = await service.create(file, { expiresIn: '7' }, 'user-1');

      expect(mockPrisma.file.create).toHaveBeenCalled();
      expect(result.token).toBeDefined();
    });

    it('should reject forbidden file extensions', async () => {
      const file = mockFile({ originalname: 'virus.exe', filename: 'virus.exe' });

      await expect(
        service.create(file, {}, null),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(mockStorage.deleteFile).toHaveBeenCalledWith('virus.exe');
    });

    it('should hash the password if provided', async () => {
      const file = mockFile();
      mockPrisma.file.create.mockResolvedValue(mockPrismaFile());

      await service.create(file, { password: 'secret123' }, 'user-1');

      const callArg = mockPrisma.file.create.mock.calls[0][0];
      expect(callArg.data.password).not.toBe('secret123');
      expect(callArg.data.password).toBeTruthy();
    });

    it('should allow anonymous upload (userId null)', async () => {
      mockPrisma.file.create.mockResolvedValue(mockPrismaFile({ userId: null }));

      const result = await service.create(mockFile(), {}, null);

      const callArg = mockPrisma.file.create.mock.calls[0][0];
      expect(callArg.data.userId).toBeNull();
      expect(result).toBeDefined();
    });
  });

  describe('getByToken', () => {
    it('should return file metadata', async () => {
      const file = mockPrismaFile();
      mockPrisma.file.findFirst.mockResolvedValue(file);

      const result = await service.getByToken('tok123');

      expect(result.token).toBe('tok123');
    });

    it('should throw NotFoundException if file not found', async () => {
      mockPrisma.file.findFirst.mockResolvedValue(null);

      await expect(service.getByToken('bad-token')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getMyFiles', () => {
    it('should return the list of user files', async () => {
      const files = [mockPrismaFile(), mockPrismaFile({ id: 'file-2' })];
      mockPrisma.file.findMany.mockResolvedValue(files);

      const result = await service.getMyFiles('user-1');

      expect(result).toHaveLength(2);
    });
  });

  describe('deleteById', () => {
    it('should delete the file if user is owner', async () => {
      mockPrisma.file.findUnique.mockResolvedValue(mockPrismaFile());
      mockPrisma.file.delete.mockResolvedValue({});

      const result = await service.deleteById('file-1', 'user-1');

      expect(mockStorage.deleteFile).toHaveBeenCalledWith('abc123.pdf');
      expect(mockPrisma.file.delete).toHaveBeenCalled();
      expect(result.message).toBe('File deleted');
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      mockPrisma.file.findUnique.mockResolvedValue(
        mockPrismaFile({ userId: 'other-user' }),
      );

      await expect(service.deleteById('file-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if file does not exist', async () => {
      mockPrisma.file.findUnique.mockResolvedValue(null);

      await expect(service.deleteById('no-file', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('verifyPassword', () => {
    it('should return { valid: true } if file has no password', async () => {
      mockPrisma.file.findFirst.mockResolvedValue(mockPrismaFile({ password: null }));

      const result = await service.verifyPassword('tok123', '');
      expect(result).toEqual({ valid: true });
    });

    it('should return { valid: true } with correct password', async () => {
      const hashed = await bcrypt.hash('secret', 10);
      mockPrisma.file.findFirst.mockResolvedValue(
        mockPrismaFile({ password: hashed }),
      );

      const result = await service.verifyPassword('tok123', 'secret');
      expect(result).toEqual({ valid: true });
    });

    it('should throw UnauthorizedException with wrong password', async () => {
      const hashed = await bcrypt.hash('secret', 10);
      mockPrisma.file.findFirst.mockResolvedValue(
        mockPrismaFile({ password: hashed }),
      );

      await expect(
        service.verifyPassword('tok123', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
