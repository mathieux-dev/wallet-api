import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { TransferService } from './transfer.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@ApiTags('transfers')
@Controller('transfers')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Realizar uma transferência' })
  @ApiResponse({
    status: 201,
    description: 'Transferência realizada com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos.' })
  async createTransfer(@Body() createTransferDto: CreateTransferDto) {
    return this.transferService.createTransfer(createTransferDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('revert/:id')
  @ApiOperation({ summary: 'Reverter uma transferência' })
  @ApiResponse({
    status: 200,
    description: 'Transferência revertida com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Reversão inválida.' })
  @ApiResponse({ status: 404, description: 'Transferência não encontrada.' })
  async revertTransfer(@Param('id') id: string) {
    return this.transferService.revertTransfer(+id);
  }
}
