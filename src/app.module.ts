import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TransferService } from './transfer/transfer.service';
import { TransferController } from './transfer/transfer.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [UserModule, AuthModule, PrismaModule],
  controllers: [TransferController],
  providers: [TransferService],
})
export class AppModule {}
