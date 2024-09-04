/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hash, compare } from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly saltRounds = 10;

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    this.logger.log(`Tentando criar usuário com CPF: ${createUserDto.cpf}`);

    try {
      if (createUserDto.balance < 50) {
        this.logger.warn(
          `Tentativa de criação falhou: saldo inicial ${createUserDto.balance} menor que 50.00.`,
        );
        throw new BadRequestException(
          'O saldo inicial deve ser pelo menos 50.00.',
        );
      }

      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUserByEmail) {
        this.logger.warn(
          `Tentativa de criação falhou: email ${createUserDto.email} já está em uso.`,
        );
        throw new BadRequestException('Este e-mail já está em uso.');
      }

      const existingUserByCpf = await this.prisma.user.findUnique({
        where: { cpf: createUserDto.cpf },
      });

      if (existingUserByCpf) {
        this.logger.warn(
          `Tentativa de criação falhou: CPF ${createUserDto.cpf} já está em uso.`,
        );
        throw new BadRequestException('Este CPF já está em uso.');
      }

      const hashedPassword = await hash(
        createUserDto.password,
        this.saltRounds,
      );

      this.logger.log(
        `Usuário com CPF: ${createUserDto.cpf} criado com sucesso.`,
      );

      const result = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
      });

      const { password, ...safeUser } = result;

      return safeUser;
    } catch (error) {
      this.logger.error(
        `Erro ao tentar criar usuário com CPF: ${createUserDto.cpf} - ${error.message}`,
      );
      throw error;
    }
  }

  async update(cpf: string, updateUserDto: UpdateUserDto) {
    this.logger.log(`Tentando atualizar usuário com CPF: ${cpf}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { cpf: cpf },
      });

      if (!user) {
        this.logger.warn(
          `Usuário com CPF: ${cpf} não encontrado para atualização.`,
        );
        throw new NotFoundException('Usuário não encontrado.');
      }

      if (updateUserDto.email) {
        const existingUserByEmail = await this.prisma.user.findUnique({
          where: { email: updateUserDto.email },
        });

        if (existingUserByEmail && existingUserByEmail.cpf !== cpf) {
          this.logger.warn(
            `Tentativa de atualização falhou: email ${updateUserDto.email} já está em uso.`,
          );
          throw new BadRequestException('Este e-mail já está em uso.');
        }
      }

      const result = await this.prisma.user.update({
        where: { cpf: cpf },
        data: updateUserDto,
      });

      this.logger.log(`Usuário com CPF: ${cpf} atualizado com sucesso.`);
      const { password, ...safeUser } = result;

      return safeUser;
    } catch (error) {
      this.logger.error(
        `Erro ao tentar atualizar usuário com CPF: ${cpf} - ${error.message}`,
      );
      throw error;
    }
  }

  async findAll() {
    this.logger.log(`Buscando todos os usuários.`);
    try {
      const users = await this.prisma.user.findMany();

      return users.map(({ password, ...user }) => user);
    } catch (error) {
      this.logger.error(`Erro ao buscar todos os usuários: ${error.message}`);
      throw error;
    }
  }

  async findOne(cpf: string) {
    this.logger.log(`Buscando usuário com CPF: ${cpf}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { cpf: cpf },
      });

      if (!user) {
        this.logger.warn(`Usuário com CPF: ${cpf} não encontrado.`);
        throw new NotFoundException('Usuário não encontrado.');
      }

      const { password, ...safeUser } = user;

      return safeUser;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuário com CPF: ${cpf} - ${error.message}`,
      );
      throw error;
    }
  }

  async findOneByEmail(email: string) {
    this.logger.log(`Buscando usuário com email: ${email}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email },
      });

      if (!user) {
        this.logger.warn(`Usuário com email: ${email} não encontrado.`);
        throw new NotFoundException('Usuário não encontrado.');
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuário com email: ${email} - ${error.message}`,
      );
      throw error;
    }
  }

  async remove(cpf: string) {
    this.logger.log(`Removendo usuário com CPF: ${cpf}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { cpf: cpf },
      });

      if (!user) {
        this.logger.warn(
          `Usuário com CPF: ${cpf} não encontrado para remoção.`,
        );
        throw new NotFoundException('Usuário não encontrado.');
      }

      await this.prisma.user.delete({
        where: { cpf: cpf },
      });

      this.logger.log(`Usuário com CPF: ${cpf} removido com sucesso.`);
    } catch (error) {
      this.logger.error(
        `Erro ao remover usuário com CPF: ${cpf} - ${error.message}`,
      );
      throw error;
    }
  }

  async validatePassword(
    plainTextPassword: string,
    hashedPassword: string,
    cpf: string,
  ) {
    this.logger.log(`Validando senha para usuário com CPF: ${cpf}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { cpf: cpf },
      });

      if (!user) {
        this.logger.warn(
          `Tentativa de validação de senha falhou: usuário com CPF ${cpf} não encontrado.`,
        );
        throw new NotFoundException('Usuário não encontrado.');
      }

      const isPasswordValid = await compare(plainTextPassword, hashedPassword);

      if (!isPasswordValid) {
        this.logger.warn(`Senha inválida para usuário com CPF ${cpf}.`);
        throw new BadRequestException('Senha inválida.');
      }

      return isPasswordValid;
    } catch (error) {
      this.logger.error(
        `Erro ao validar senha para usuário com CPF: ${cpf} - ${error.message}`,
      );
      throw error;
    }
  }
}
