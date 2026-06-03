import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existente = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existente) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    const hash = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: { ...createUserDto, password: hash },
    });

    const { password, resetToken, resetTokenExpires, ...safe } = user as any;
    return safe;
  }

  findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new NotFoundException(`Usuário ${id} não encontrado.`);
    return user;
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const data: any = { ...updateUserDto };
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const updated = await this.prisma.user.update({ where: { id }, data });
    const { password, resetToken, resetTokenExpires, ...safe } = updated as any;
    return safe;
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }

  async setResetToken(email: string, token: string, expires: Date) {
    return this.prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpires: expires },
    });
  }

  async findByResetToken(token: string) {
    return this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });
  }

  async resetPassword(userId: number, newPassword: string) {
    const hash = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hash, resetToken: null, resetTokenExpires: null },
    });
  }
}
