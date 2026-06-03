import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'

export class CreateUserDto {
    @ApiProperty({ example: 'joao@email.com', description: 'O email do usuário' })
    @IsEmail({}, { message: 'E-mail inválido' })
    email: string;

    @ApiProperty({ example: 'João Silva', description: 'Nome completo', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 'senha123', description: 'Senha com no mínimo 6 caracteres', minLength: 6 })
    @IsString()
    @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
    password: string;
}
