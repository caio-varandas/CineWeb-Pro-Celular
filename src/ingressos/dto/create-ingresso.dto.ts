import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateIngressoDto {
  @IsNumber()
  sessaoId!: number;

  @IsString()
  tipo!: string;

  @IsNumber()
  valorPago!: number;

  // 🔥 A POSIÇÃO AQUI SALVANDO O DIA!
  @IsString()
  posicao!: string; 

  @IsNumber()
  @IsOptional()
  pedidoId?: number;
}