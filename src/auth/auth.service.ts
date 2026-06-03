import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    const token = this.signToken(user.id, user.email);
    return { user, accessToken: token };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const senhaOk = await bcrypt.compare(dto.password, user.password);
    if (!senhaOk) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const token = this.signToken(user.id, user.email);
    const { password, resetToken, resetTokenExpires, ...safe } = user as any;
    return { user: safe, accessToken: token };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Para não vazar quais e-mails existem, devolvemos sucesso "neutro"
      return {
        message: 'Se este e-mail estiver cadastrado, um token foi gerado.',
      };
    }

    const token = randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min

    await this.usersService.setResetToken(user.email, token, expires);

    // Em produção: enviar por e-mail. Aqui devolvemos o token na resposta
    // para uso direto no app mobile (já que não temos serviço de e-mail).
    return {
      message: 'Token de recuperação gerado. Use-o em /auth/reset-password.',
      resetToken: token,
      expiresAt: expires,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(dto.token);
    if (!user) {
      throw new BadRequestException('Token inválido ou expirado.');
    }
    await this.usersService.resetPassword(user.id, dto.newPassword);
    return { message: 'Senha alterada com sucesso.' };
  }

  private signToken(userId: number, email: string) {
    return this.jwtService.sign(
      { sub: userId, email },
      {
        secret: process.env.JWT_SECRET || 'cineweb-fallback-secret',
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
      },
    );
  }
}
