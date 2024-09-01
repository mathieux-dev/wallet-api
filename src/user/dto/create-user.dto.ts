import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Min, IsNumber } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome do usuário', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'CPF do usuário', example: '123.456.789-00' })
  @IsString()
  @IsNotEmpty()
  cpf: string;

  @ApiProperty({ description: 'Saldo da conta do usuário', example: 50.0 })
  @IsNumber()
  @Min(50.0, { message: 'O saldo deve ser pelo menos 50.00' })
  @IsNotEmpty()
  balance: number;
}
