import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IsValidCpf } from '../shared/validators/cpfValidator';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    if (!createUserDto.cpf || !IsValidCpf(createUserDto.cpf)) {
      throw new BadRequestException('CPF inválido.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Este e-mail já está em uso.');
    }

    if (createUserDto.balance < 50.0) {
      throw new BadRequestException(
        'O saldo inicial deve ser pelo menos 50.00.',
      );
    }

    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  async update(cpf: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { cpf: cpf },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (updateUserDto.email) {
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUserByEmail && existingUserByEmail.cpf !== cpf) {
        throw new BadRequestException('Este e-mail já está em uso.');
      }
    }

    return this.prisma.user.update({
      where: { cpf: cpf },
      data: updateUserDto,
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(cpf: string) {
    const user = await this.prisma.user.findUnique({
      where: { cpf: cpf },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async remove(cpf: string) {
    const user = await this.prisma.user.findUnique({
      where: { cpf: cpf },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return this.prisma.user.delete({
      where: { cpf: cpf },
    });
  }
}
