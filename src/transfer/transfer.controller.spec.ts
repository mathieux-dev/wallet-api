import { Test, TestingModule } from '@nestjs/testing';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('TransferController', () => {
  let controller: TransferController;
  let service: TransferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferController],
      providers: [
        {
          provide: TransferService,
          useValue: {
            createTransfer: jest.fn(),
            revertTransfer: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TransferController>(TransferController);
    service = module.get<TransferService>(TransferService);
  });

  it('deve criar uma transferência', async () => {
    const createTransferDto: CreateTransferDto = {
      senderCpf: '12345678901',
      receiverCpf: '09876543210',
      amount: new Decimal(100),
      type: 'transfer',
    };

    const transfer = {
      id: 1,
      senderCpf: '12345678901',
      receiverCpf: '09876543210',
      amount: new Decimal(100),
      type: 'transfer',
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(service, 'createTransfer').mockResolvedValue(transfer);

    const result = await controller.createTransfer(createTransferDto);

    expect(result).toEqual(transfer);
    expect(service.createTransfer).toHaveBeenCalledWith(createTransferDto);
  });

  it('deve reverter uma transferência', async () => {
    const transfer = {
      id: 1,
      senderCpf: '12345678901',
      receiverCpf: '09876543210',
      amount: new Decimal(100),
      type: 'transfer',
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(service, 'revertTransfer').mockResolvedValue(transfer);

    const result = await controller.revertTransfer('1');

    expect(result).toEqual(transfer);
    expect(service.revertTransfer).toHaveBeenCalledWith(1);
  });

  it('deve retornar 404 ao tentar reverter uma transferência inexistente', async () => {
    jest
      .spyOn(service, 'revertTransfer')
      .mockRejectedValue(new NotFoundException('Transferência não encontrada'));

    try {
      await controller.revertTransfer('999');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe('Transferência não encontrada');
    }
  });
});
