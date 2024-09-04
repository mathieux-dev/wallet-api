/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hash } from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('deve criar um novo usuário com sucesso', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        cpf: '123.456.789-00',
        password: 'password123',
        balance: 100.0,
      };

      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);
      prismaService.user.create = jest.fn().mockResolvedValue({
        id: 1,
        ...createUserDto,
        password: await hash(createUserDto.password, 10),
      });

      const user = await service.create(createUserDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createUserDto,
          password: expect.any(String),
        },
      });
      expect(user).toEqual({
        id: 1,
        name: createUserDto.name,
        email: createUserDto.email,
        cpf: createUserDto.cpf,
        balance: createUserDto.balance,
      });
    });

    it('deve lançar uma exceção se o e-mail já estiver em uso', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        cpf: '123.456.789-00',
        password: 'password123',
        balance: 100.0,
      };

      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        id: 1,
        ...createUserDto,
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('deve lançar uma exceção se o CPF já estiver em uso', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        cpf: '123.456.789-00',
        password: 'password123',
        balance: 100.0,
      };

      prismaService.user.findUnique = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 1, ...createUserDto });

      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('deve lançar uma exceção se o saldo inicial for menor que 50.00', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        cpf: '123.456.789-00',
        password: 'password123',
        balance: 49.0,
      };

      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.user.findUnique).not.toHaveBeenCalled();
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deve atualizar um usuário com sucesso', async () => {
      const cpf = '123.456.789-00';
      const updateUserDto: UpdateUserDto = {
        name: 'John Doe Updated',
        email: 'john.doe.updated@example.com',
      };

      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        id: 1,
        cpf,
        email: 'john.doe@example.com',
      });

      prismaService.user.update = jest.fn().mockResolvedValue({
        id: 1,
        ...updateUserDto,
        cpf,
      });

      const result = await service.update(cpf, updateUserDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { cpf },
        data: updateUserDto,
      });
      expect(result).toEqual({
        id: 1,
        ...updateUserDto,
        cpf,
      });
    });

    it('deve lançar uma exceção se o usuário não for encontrado', async () => {
      const cpf = '123.456.789-00';
      const updateUserDto: UpdateUserDto = {
        name: 'John Doe Updated',
        email: 'john.doe.updated@example.com',
      };

      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.update(cpf, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('deve lançar uma exceção se o novo e-mail já estiver em uso', async () => {
      const cpf = '123.456.789-00';
      const updateUserDto: UpdateUserDto = {
        name: 'John Doe Updated',
        email: 'john.doe.updated@example.com',
      };

      prismaService.user.findUnique = jest
        .fn()
        .mockResolvedValueOnce({ id: 1, cpf, email: 'john.doe@example.com' })
        .mockResolvedValueOnce({
          id: 2,
          cpf: '987.654.321-00',
          email: 'john.doe.updated@example.com',
        });

      await expect(service.update(cpf, updateUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os usuários', async () => {
      prismaService.user.findMany = jest.fn().mockResolvedValue([
        {
          id: 1,
          name: 'John Doe',
          cpf: '123.456.789-00',
          email: 'john.doe@example.com',
        },
      ]);

      const result = await service.findAll();

      expect(prismaService.user.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          id: 1,
          name: 'John Doe',
          cpf: '123.456.789-00',
          email: 'john.doe@example.com',
        },
      ]);
    });
  });

  describe('findOne', () => {
    it('deve retornar um usuário pelo CPF', async () => {
      const cpf = '123.456.789-00';

      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        id: 1,
        cpf,
        name: 'John Doe',
      });

      const result = await service.findOne(cpf);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { cpf },
      });
      expect(result).toEqual({
        id: 1,
        cpf,
        name: 'John Doe',
      });
    });

    it('deve lançar uma exceção se o usuário não for encontrado', async () => {
      const cpf = '123.456.789-00';

      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.findOne(cpf)).rejects.toThrow(NotFoundException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { cpf },
      });
    });
  });

  describe('findOneByEmail', () => {
    it('deve retornar um usuário pelo e-mail', async () => {
      const email = 'john.doe@example.com';

      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        id: 1,
        email,
        name: 'John Doe',
      });

      const result = await service.findOneByEmail(email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual({
        id: 1,
        email,
        name: 'John Doe',
      });
    });

    it('deve lançar uma exceção se o usuário não for encontrado', async () => {
      const email = 'john.doe@example.com';

      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.findOneByEmail(email)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });
  });

  describe('remove', () => {
    it('deve remover um usuário com sucesso', async () => {
      const cpf = '123.456.789-00';

      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        id: 1,
        cpf,
        name: 'John Doe',
      });

      prismaService.user.delete = jest.fn().mockResolvedValue(undefined);

      await expect(service.remove(cpf)).resolves.toBeUndefined();

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { cpf },
      });
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { cpf },
      });
    });

    it('deve lançar uma exceção NotFoundException se o usuário não for encontrado', async () => {
      const cpf = '123.456.789-00';

      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.remove(cpf)).rejects.toThrow(NotFoundException);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { cpf },
      });
      expect(prismaService.user.delete).not.toHaveBeenCalled();
    });

    it('deve lançar uma exceção se ocorrer um erro ao tentar remover o usuário', async () => {
      const cpf = '123.456.789-00';

      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        id: 1,
        cpf,
        name: 'John Doe',
      });

      prismaService.user.delete = jest
        .fn()
        .mockRejectedValue(new Error('Erro ao deletar'));

      await expect(service.remove(cpf)).rejects.toThrow('Erro ao deletar');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { cpf },
      });
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { cpf },
      });
    });
  });

  describe('validatePassword', () => {
    it('deve retornar verdadeiro se a senha estiver correta', async () => {
      const password = 'password123';
      const hashedPassword = await hash(password, 10);
      const cpf = '123.456.789-00';

      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        id: 1,
        cpf,
        password: hashedPassword,
      });

      const result = await service.validatePassword(
        password,
        hashedPassword,
        cpf,
      );

      expect(result).toBe(true);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { cpf },
      });
    });

    it('deve lançar NotFoundException se o usuário não for encontrado', async () => {
      const cpf = '123.456.789-00';
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.validatePassword('password123', 'hashedPassword', cpf),
      ).rejects.toThrow(NotFoundException);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { cpf },
      });
    });

    it('deve lançar BadRequestException se a senha estiver incorreta', async () => {
      const password = 'password123';
      const hashedPassword = await hash(password, 10);
      const cpf = '123.456.789-00';

      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        id: 1,
        cpf,
        password: hashedPassword,
      });

      await expect(
        service.validatePassword('wrongpassword', hashedPassword, cpf),
      ).rejects.toThrow(BadRequestException);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { cpf },
      });
    });
  });
});
