import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TransferService } from './transfer/transfer.service';
import { TransferController } from './transfer/transfer.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [
    UserModule,
    AuthModule,
    PrismaModule,
    PrometheusModule.register(),
    TerminusModule,
  ],
  controllers: [TransferController],
  providers: [TransferService],
})
export class AppModule {}
