import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PedidosService {
  constructor(private prisma: PrismaService) {}

  async create(createPedidoDto: CreatePedidoDto) {
    const { sessaoId, ingressos, lanches, valorTotal } = createPedidoDto;

    // 1. Validação: O pedido não pode estar vazio
    if ((!ingressos || ingressos.length === 0) && (!lanches || lanches.length === 0)) {
      throw new BadRequestException('O pedido precisa ter pelo menos um ingresso ou lanche.');
    }

    // 2. Busca a Sessão no banco para confirmar que existe e pegar o valor do ingresso
    const sessao = await this.prisma.sessao.findUnique({
      where: { id: sessaoId }
    });

    if (!sessao) throw new NotFoundException('Sessão não encontrada.');

    // 3. Prepara os lanches para salvar (caso o usuário tenha comprado)
    const lanchesParaConectar = lanches && lanches.length > 0
      ? lanches.map(l => ({ id: Number(l.lancheId) }))
      : [];

    // 4. A TRANSAÇÃO ATÔMICA
    // Salva o Pedido e os Ingressos de uma vez só!
    return this.prisma.pedido.create({
      data: {
        valorTotal: valorTotal,
        ingressos: {
          create: ingressos.map(ing => ({
            sessaoId: sessaoId,
            posicao: ing.posicao,
            tipo: ing.tipo,
            // Calcula o valor: MEIA paga metade, INTEIRA paga inteiro
            valorPago: ing.tipo === 'MEIA' ? (sessao.valorIngresso / 2) : sessao.valorIngresso
          }))
        },
        lanches: {
          connect: lanchesParaConectar
        }
      },
      include: { ingressos: true, lanches: true }, 
    });
  }

  // ============== MÉTODOS DE BUSCA ==============

  findAll() {
    return this.prisma.pedido.findMany({
      include: {
        ingressos: { include: { sessao: { include: { filme: true, sala: true } } } },
        lanches: true,
      },
      orderBy: { dataHora: 'desc' },
    });
  }

  async findOne(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: { 
        ingressos: { include: { sessao: { include: { filme: true } } } }, 
        lanches: true 
      },
    });

    if (!pedido) throw new NotFoundException(`Pedido com ID ${id} não encontrado.`);
    return pedido;
  }

  update(id: number, updatePedidoDto: UpdatePedidoDto) {
    throw new BadRequestException('Não é permitido alterar um pedido fechado. Por favor, cancele e crie um novo.');
  }

  remove(id: number) {
    return this.prisma.pedido.delete({
      where: { id },
    });
  }
}