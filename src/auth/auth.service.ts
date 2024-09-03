import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    this.logger.log(`Validando usuário com email: ${email}`);

    const user = await this.usersService.findOneByEmail(email);

    if (
      user &&
      (await this.usersService.validatePassword(
        password,
        user.password,
        user.cpf,
      ))
    ) {
      this.logger.log(`Usuário validado com sucesso: ${email}`);
      const { ...result } = user;
      return result;
    } else {
      this.logger.warn(`Falha na validação para o usuário com email: ${email}`);
      return null;
    }
  }

  async login(user: any) {
    const payload = { email: user.email };
    this.logger.log(`Gerando token JWT para o usuário: ${user.email}`);

    const accessToken = this.jwtService.sign(payload);
    this.logger.log(
      `Token JWT gerado com sucesso para o usuário: ${user.email}`,
    );

    return {
      access_token: accessToken,
    };
  }
}
