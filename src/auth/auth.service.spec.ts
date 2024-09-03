import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findOneByEmail: jest.fn(),
            validatePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        Logger,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('deve validar e retornar o usuário quando o email e senha estão corretos', async () => {
      const user = {
        email: 'test@example.com',
        password: 'hashedPassword',
        cpf: '12345678901',
      };
      (userService.findOneByEmail as jest.Mock).mockResolvedValue(user);
      (userService.validatePassword as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(user);
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(userService.validatePassword).toHaveBeenCalledWith(
        'password',
        'hashedPassword',
        '12345678901',
      );
    });

    it('deve retornar null quando o email não existe', async () => {
      (userService.findOneByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('deve retornar null quando a senha é inválida', async () => {
      const user = {
        email: 'test@example.com',
        password: 'hashedPassword',
        cpf: '12345678901',
      };
      (userService.findOneByEmail as jest.Mock).mockResolvedValue(user);
      (userService.validatePassword as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(userService.validatePassword).toHaveBeenCalledWith(
        'password',
        'hashedPassword',
        '12345678901',
      );
    });
  });

  describe('login', () => {
    it('deve gerar e retornar um token JWT válido', async () => {
      const user = { email: 'test@example.com' };
      const token = 'generatedJwtToken';
      (jwtService.sign as jest.Mock).mockReturnValue(token);

      const result = await service.login(user);

      expect(result).toEqual({ access_token: token });
      expect(jwtService.sign).toHaveBeenCalledWith({ email: user.email });
    });
  });
});
