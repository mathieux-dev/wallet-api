import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos.' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso.',
  })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor.' })
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':cpf')
  @ApiOperation({ summary: 'Buscar um usuário por CPF' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async findOne(@Param('cpf') cpf: string) {
    return this.userService.findOne(cpf);
  }

  @Patch(':cpf')
  @ApiOperation({ summary: 'Atualizar um usuário existente' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async update(
    @Param('cpf') cpf: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(cpf, updateUserDto);
  }

  @Delete(':cpf')
  @ApiOperation({ summary: 'Excluir um usuário por CPF' })
  @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async remove(@Param('cpf') cpf: string) {
    return this.userService.remove(cpf);
  }
}
