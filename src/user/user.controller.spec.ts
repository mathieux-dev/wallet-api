import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const expectedUser = {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    cpf: '12345678901',
    password: 'password123',
    balance: new Decimal(100),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const otherExpectedUser = {
    id: 2,
    name: 'Alice Chains',
    email: 'alice.chains@example.com',
    cpf: '12345678900',
    password: 'password123',
    balance: new Decimal(100),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('deve criar um novo usuário', async () => {
    const createUserDto: CreateUserDto = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      cpf: '12345678901',
      password: 'password123',
      balance: 100,
    };

    jest.spyOn(service, 'create').mockResolvedValue(expectedUser);

    const result = await controller.create(createUserDto);

    expect(result).toEqual(expectedUser);
    expect(service.create).toHaveBeenCalledWith(createUserDto);
  });

  it('deve listar todos os usuários', async () => {
    jest
      .spyOn(service, 'findAll')
      .mockResolvedValue([expectedUser, otherExpectedUser]);

    const result = await controller.findAll();

    expect(result).toEqual([expectedUser, otherExpectedUser]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('deve buscar um usuário por CPF', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue(expectedUser);

    const result = await controller.findOne('12345678901');

    expect(result).toEqual(expectedUser);
    expect(service.findOne).toHaveBeenCalledWith('12345678901');
  });

  it('deve atualizar um usuário existente', async () => {
    const updateUserDto: UpdateUserDto = { name: 'John Doe' };

    const updatedUser = {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      cpf: '12345678901',
      password: 'password123',
      balance: new Decimal(100),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(service, 'update').mockResolvedValue(updatedUser);

    const result = await controller.update('12345678901', updateUserDto);

    expect(result).toEqual(updatedUser);
    expect(service.update).toHaveBeenCalledWith('12345678901', updateUserDto);
  });

  it('deve excluir um usuário por CPF', async () => {
    const removedUser = {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      cpf: '12345678901',
      password: 'password123',
      balance: new Decimal(100),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(service, 'remove').mockResolvedValue(removedUser);

    const result = await controller.remove('12345678901');

    expect(result).toEqual(removedUser);
    expect(service.remove).toHaveBeenCalledWith('12345678901');
  });

  it('deve retornar 404 ao tentar buscar um usuário inexistente por CPF', async () => {
    jest
      .spyOn(service, 'findOne')
      .mockRejectedValue(new NotFoundException('Usuário não encontrado'));

    try {
      await controller.findOne('00000000000');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe('Usuário não encontrado');
    }
  });
});
