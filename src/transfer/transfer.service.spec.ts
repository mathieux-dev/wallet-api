import { Test, TestingModule } from '@nestjs/testing';
import { TransferService } from './transfer.service';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('TransferService', () => {
  let service: TransferService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            transaction: {
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('deve criar uma transferência com sucesso', async () => {
    const createTransferDto: CreateTransferDto = {
      senderCpf: '12345678901',
      receiverCpf: '09876543210',
      amount: new Decimal(100),
      type: 'transfer',
    };

    prisma.user.findUnique = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({ id: 1, cpf: '12345678901', balance: 200 }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({ id: 2, cpf: '09876543210', balance: 100 }),
      );
    prisma.transaction.create = jest.fn().mockResolvedValue({ id: 1 });
    prisma.transaction.update = jest
      .fn()
      .mockResolvedValue({ id: 1, status: 'completed' });

    const result = await service.createTransfer(createTransferDto);

    expect(result).toEqual({ id: 1, status: 'completed' });
    expect(prisma.transaction.create).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledTimes(2);
    expect(prisma.transaction.update).toHaveBeenCalledTimes(2);
  });

  it('deve lançar exceção se o remetente não for encontrado', async () => {
    const createTransferDto: CreateTransferDto = {
      senderCpf: '12345678901',
      receiverCpf: '09876543210',
      amount: new Decimal(100),
      type: 'transfer',
    };

    prisma.user.findUnique = jest.fn().mockResolvedValueOnce(null);

    await expect(service.createTransfer(createTransferDto)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it('deve lançar exceção se o destinatário não for encontrado', async () => {
    const createTransferDto: CreateTransferDto = {
      senderCpf: '12345678901',
      receiverCpf: '09876543210',
      amount: new Decimal(100),
      type: 'transfer',
    };

    prisma.user.findUnique = jest
      .fn()
      .mockResolvedValueOnce({ id: 1, cpf: '12345678901', balance: 200 })
      .mockResolvedValueOnce(null);

    await expect(service.createTransfer(createTransferDto)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it('deve lançar exceção se o saldo do remetente for insuficiente', async () => {
    const createTransferDto: CreateTransferDto = {
      senderCpf: '12345678901',
      receiverCpf: '09876543210',
      amount: new Decimal(100),
      type: 'transfer',
    };

    prisma.user.findUnique = jest
      .fn()
      .mockResolvedValueOnce({ id: 1, cpf: '12345678901', balance: 50 })
      .mockResolvedValueOnce({ id: 2, cpf: '09876543210', balance: 100 });

    await expect(service.createTransfer(createTransferDto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it('deve registrar um erro e atualizar o status da transação para "error" em caso de falha', async () => {
    const createTransferDto: CreateTransferDto = {
      senderCpf: '12345678901',
      receiverCpf: '09876543210',
      amount: new Decimal(100),
      type: 'transfer',
    };

    prisma.user.findUnique = jest
      .fn()
      .mockResolvedValueOnce({ id: 1, cpf: '12345678901', balance: 100 })
      .mockResolvedValueOnce({ id: 2, cpf: '09876543210', balance: 100 });
    prisma.transaction.create = jest.fn().mockResolvedValue({ id: 1 });

    prisma.user.update = jest
      .fn()
      .mockRejectedValue(new Error('Falha na atualização de saldo'));

    prisma.transaction.update = jest
      .fn()
      .mockResolvedValue({ id: 1, status: 'error' });

    await expect(service.createTransfer(createTransferDto)).rejects.toThrow(
      'Falha na atualização de saldo',
    );

    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'error' },
    });
  });

  it('deve reverter uma transferência com sucesso', async () => {
    const transactionId = 1;

    prisma.transaction.findUnique = jest.fn().mockResolvedValue({
      id: transactionId,
      senderCpf: '12345678901',
      receiverCpf: '09876543210',
      amount: new Decimal(100),
      status: 'completed',
    });
    prisma.transaction.update = jest
      .fn()
      .mockResolvedValue({ id: transactionId, status: 'reverted' });

    const result = await service.revertTransfer(transactionId);

    expect(result.status).toBe('reverted');
    expect(prisma.transaction.update).toHaveBeenCalledTimes(1);
  });

  it('deve lançar exceção se a transação não for encontrada', async () => {
    const transactionId = 1;

    prisma.transaction.findUnique = jest.fn().mockResolvedValue(null);

    await expect(service.revertTransfer(transactionId)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.transaction.update).not.toHaveBeenCalled();
  });

  it('deve lançar exceção se a transação não estiver concluída', async () => {
    const transactionId = 1;

    prisma.transaction.findUnique = jest.fn().mockResolvedValue({
      id: transactionId,
      senderCpf: '12345678901',
      receiverCpf: '09876543210',
      amount: new Decimal(100),
      status: 'created',
    });

    await expect(service.revertTransfer(transactionId)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.transaction.update).not.toHaveBeenCalled();
  });
});
