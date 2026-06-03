import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class IngressoDto {
  posicao!: string;
  tipo!: string;
}

export class LanchePedidoDto {
  lancheId!: number | string;
  quantidade!: number;
}

export class CreatePedidoDto {
  @IsNumber()
  sessaoId!: number;

  @IsArray()
  ingressos!: IngressoDto[];

  @IsArray()
  @IsOptional()
  lanches?: LanchePedidoDto[];

  @IsNumber()
  valorTotal!: number;
}