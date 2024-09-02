import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTransfer(createTransferDto: CreateTransferDto) {
    const { senderCpf, receiverCpf, amount, type } = createTransferDto;

    this.logger.log(
      `Iniciando transferência de ${senderCpf} para ${receiverCpf} no valor de ${amount}.`,
    );

    const sender = await this.prisma.user.findUnique({
      where: { cpf: senderCpf },
    });

    const receiver = await this.prisma.user.findUnique({
      where: { cpf: receiverCpf },
    });

    if (!sender) {
      this.logger.warn(
        `Transferência falhou: remetente com CPF ${senderCpf} não encontrado.`,
      );
      throw new NotFoundException('Remetente não encontrado');
    }
    if (!receiver) {
      this.logger.warn(
        `Transferência falhou: destinatário com CPF ${receiverCpf} não encontrado.`,
      );
      throw new NotFoundException('Destinatário não encontrado');
    }
    if (sender.balance < amount) {
      this.logger.warn(
        `Transferência falhou: saldo insuficiente do remetente ${senderCpf}.`,
      );
      throw new BadRequestException('Saldo insuficiente');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        senderCpf: sender.cpf,
        receiverCpf: receiver.cpf,
        amount,
        type,
        status: 'created',
      },
    });

    try {
      this.logger.log(
        `Transferência de ${senderCpf} para ${receiverCpf} em processamento.`,
      );

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'processing' },
      });

      await this.prisma.user.update({
        where: { id: sender.id },
        data: { balance: { decrement: amount } },
      });

      await this.prisma.user.update({
        where: { id: receiver.id },
        data: { balance: { increment: amount } },
      });

      this.logger.log(
        `Transferência de ${senderCpf} para ${receiverCpf} concluída com sucesso.`,
      );

      return this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'completed' },
      });
    } catch (error) {
      this.logger.error(
        `Erro durante a transferência de ${senderCpf} para ${receiverCpf}: ${error.message}`,
      );

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'error' },
      });
      throw error;
    }
  }

  async revertTransfer(transactionId: number) {
    this.logger.log(
      `Iniciando reversão da transação com ID: ${transactionId}.`,
    );

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      this.logger.warn(
        `Reversão falhou: transação com ID ${transactionId} não encontrada.`,
      );
      throw new NotFoundException('Transação não encontrada');
    }
    if (transaction.status !== 'completed') {
      this.logger.warn(
        `Reversão falhou: transação com ID ${transactionId} não foi completada.`,
      );
      throw new BadRequestException(
        'Não é possível reverter uma transação não concluída',
      );
    }

    await this.prisma.user.update({
      where: { cpf: transaction.senderCpf },
      data: { balance: { increment: transaction.amount } },
    });

    await this.prisma.user.update({
      where: { cpf: transaction.receiverCpf },
      data: { balance: { decrement: transaction.amount } },
    });

    this.logger.log(`Transação com ID ${transactionId} revertida com sucesso.`);

    return this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'reverted' },
    });
  }
}
