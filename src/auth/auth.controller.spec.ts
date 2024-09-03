import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('deve realizar o login de um usuário', async () => {
    const loginDto = { email: 'john.doe@example.com', password: 'password123' };

    jest
      .spyOn(service, 'login')
      .mockResolvedValue({ access_token: 'jwt_token' });

    const result = await controller.login(loginDto);

    expect(result).toEqual({ access_token: 'jwt_token' });
    expect(service.login).toHaveBeenCalledWith(loginDto);
  });
});
