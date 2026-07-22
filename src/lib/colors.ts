// Catálogo de cores de pintura automotiva

export interface PaintColor {
  id: string
  nome: string
  hex: string
  // Tipo de acabamento — afeta o preço (perolizada/metalica são mais caras)
  acabamento: 'sólida' | 'metálica' | 'perolizada' | 'efeito'
  // Fator multiplicador sobre o preço base da peça
  fatorPreco: number
  descricao: string
}

export const PAINT_COLORS: PaintColor[] = [
  {
    id: 'vermelho-cintilante',
    nome: 'Vermelho Cintilante',
    hex: '#C8102E',
    acabamento: 'efeito',
    fatorPreco: 1.35,
    descricao: 'Vermelho metálico cintilante com partículas que refletem a luz, criando brilho intenso.',
  },
  {
    id: 'preto',
    nome: 'Preto Profundo',
    hex: '#0A0A0A',
    acabamento: 'metálica',
    fatorPreco: 1.15,
    descricao: 'Preto metálico profundo com reflexos sutis em luz intensa.',
  },
  {
    id: 'azul',
    nome: 'Azul Elétrico',
    hex: '#1E40AF',
    acabamento: 'metálica',
    fatorPreco: 1.20,
    descricao: 'Azul metálico vibrante com alta cobertura e durabilidade.',
  },
  {
    id: 'branco',
    nome: 'Branco Ártico',
    hex: '#F5F5F5',
    acabamento: 'sólida',
    fatorPreco: 1.0,
    descricao: 'Branco sólido clássico de alta cobertura.',
  },
  {
    id: 'prata',
    nome: 'Prata Satin',
    hex: '#C0C0C8',
    acabamento: 'metálica',
    fatorPreco: 1.10,
    descricao: 'Prata metálico com acabamento satinado discreto.',
  },
  {
    id: 'cinza',
    nome: 'Cinza Graphite',
    hex: '#4A4A52',
    acabamento: 'metálica',
    fatorPreco: 1.12,
    descricao: 'Cinza metálico escuro com aspecto sofisticado.',
  },
  {
    id: 'verde',
    nome: 'Verde British',
    hex: '#1B3B2F',
    acabamento: 'perolizada',
    fatorPreco: 1.40,
    descricao: 'Verde perolizado profundo com efeito de profundidade.',
  },
  {
    id: 'champanhe',
    nome: 'Champanhe',
    hex: '#D4B888',
    acabamento: 'perolizada',
    fatorPreco: 1.40,
    descricao: 'Bege perolizado com reflexos dourados.',
  },
]

export const PAINT_COLORS_BY_ID: Record<string, PaintColor> = Object.fromEntries(
  PAINT_COLORS.map((c) => [c.id, c])
)
