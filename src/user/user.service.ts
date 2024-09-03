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

    const hashedPassword = await hash(createUserDto.password, this.saltRounds);

    this.logger.log(
      `Usuário com CPF: ${createUserDto.cpf} criado com sucesso.`,
    );

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
  }

  async update(cpf: string, updateUserDto: UpdateUserDto) {
    this.logger.log(`Tentando atualizar usuário com CPF: ${cpf}`);

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

    this.logger.log(`Usuário com CPF: ${cpf} atualizado com sucesso.`);
    return this.prisma.user.update({
      where: { cpf: cpf },
      data: updateUserDto,
    });
  }

  async findAll() {
    this.logger.log(`Buscando todos os usuários.`);
    return this.prisma.user.findMany();
  }

  async findOne(cpf: string) {
    this.logger.log(`Buscando usuário com CPF: ${cpf}`);

    const user = await this.prisma.user.findUnique({
      where: { cpf: cpf },
    });

    if (!user) {
      this.logger.warn(`Usuário com CPF: ${cpf} não encontrado.`);
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async findOneByEmail(email: string) {
    this.logger.log(`Buscando usuário com email: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      this.logger.warn(`Usuário com email: ${email} não encontrado.`);
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async remove(cpf: string) {
    this.logger.log(`Tentando remover usuário com CPF: ${cpf}`);

    const user = await this.prisma.user.findUnique({
      where: { cpf: cpf },
    });

    if (!user) {
      this.logger.warn(
        `Tentativa de remoção falhou: usuário com CPF: ${cpf} não encontrado.`,
      );
      throw new NotFoundException('Usuário não encontrado.');
    }

    this.logger.log(`Usuário com CPF: ${cpf} removido com sucesso.`);
    return this.prisma.user.delete({
      where: { cpf: cpf },
    });
  }

  async validatePassword(
    plainTextPassword: string,
    hashedPassword: string,
    cpf: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { cpf },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return compare(plainTextPassword, hashedPassword);
  }
}
