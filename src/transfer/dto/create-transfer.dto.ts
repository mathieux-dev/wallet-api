import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateTransferDto {
  @ApiProperty({
    description: 'CPF do remetente',
    example: '12345678901',
  })
  @IsNotEmpty()
  @IsString()
  senderCpf: string;

  @ApiProperty({
    description: 'CPF do destinatário',
    example: '09876543210',
  })
  @IsNotEmpty()
  @IsString()
  receiverCpf: string;

  @ApiProperty({
    description: 'Montante a ser transferido',
    example: 100.5,
  })
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  amount: Decimal;

  @ApiProperty({
    description: 'Tipo de transação: depósito ou transferência',
    example: 'transfer',
  })
  @IsNotEmpty()
  @IsEnum(['deposit', 'transfer'])
  type: string;
}
