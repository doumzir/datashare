import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const mockUsersService = {
  create: jest.fn(),
  findByEmail: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should return an access_token on success', async () => {
      mockUsersService.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        createdAt: new Date(),
      });

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ access_token: 'signed-token' });
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
      });
    });
  });

  describe('login', () => {
    it('should return an access_token with valid credentials', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashed,
        createdAt: new Date(),
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ access_token: 'signed-token' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashed,
        createdAt: new Date(),
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
