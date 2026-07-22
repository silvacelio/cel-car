// Catálogo de peças do carro para repintura
// Cada peça tem: id, nome, zona (para o SVG), área relativa, complexidade, preço base simulado

export type CarZone = 'frente' | 'lateral-esq' | 'lateral-dir' | 'traseira' | 'teto'

export interface CarPart {
  id: string
  nome: string
  zona: CarZone
  // Área relativa da peça (1 = pequena, 5 = grande) — afeta o preço
  area: number
  // Complexidade de pintura (1 = simples, 5 = complexa, ex: com múltiplas curvas)
  complexidade: number
  // Preço base em R$ (pintura completa, cor sólida) — simulado
  precoBase: number
  // ID do elemento SVG correspondente na vista lateral
  svgId?: string
}

export const CAR_PARTS: CarPart[] = [
  // Frente
  { id: 'capo', nome: 'Capô', zona: 'frente', area: 5, complexidade: 3, precoBase: 650, svgId: 'part-capo' },
  { id: 'para-choque-dianteiro', nome: 'Para-choque dianteiro', zona: 'frente', area: 3, complexidade: 4, precoBase: 480, svgId: 'part-pcd' },
  { id: 'grade-frontal', nome: 'Grade frontal', zona: 'frente', area: 1, complexidade: 3, precoBase: 180, svgId: 'part-grade' },
  { id: 'para-lama-dianteiro-esq', nome: 'Para-lama dianteiro esquerdo', zona: 'lateral-esq', area: 2, complexidade: 3, precoBase: 320, svgId: 'part-plde' },
  { id: 'para-lama-dianteiro-dir', nome: 'Para-lama dianteiro direito', zona: 'lateral-dir', area: 2, complexidade: 3, precoBase: 320, svgId: 'part-pldd' },

  // Lateral esquerda
  { id: 'porta-dianteira-esq', nome: 'Porta dianteira esquerda', zona: 'lateral-esq', area: 4, complexidade: 3, precoBase: 520, svgId: 'part-pdde' },
  { id: 'porta-traseira-esq', nome: 'Porta traseira esquerda', zona: 'lateral-esq', area: 4, complexidade: 3, precoBase: 520, svgId: 'part-pte' },
  { id: 'para-lama-traseiro-esq', nome: 'Para-lama traseiro esquerdo', zona: 'lateral-esq', area: 2, complexidade: 3, precoBase: 320, svgId: 'part-plte' },
  { id: 'espelho-esq', nome: 'Retrovisor esquerdo', zona: 'lateral-esq', area: 1, complexidade: 4, precoBase: 140, svgId: 'part-esp-e' },
  { id: 'maçaneta-esq', nome: 'Maçanetas esquerda', zona: 'lateral-esq', area: 1, complexidade: 2, precoBase: 90, svgId: 'part-mac-e' },

  // Lateral direita (mesmas peças espelhadas)
  { id: 'porta-dianteira-dir', nome: 'Porta dianteira direita', zona: 'lateral-dir', area: 4, complexidade: 3, precoBase: 520 },
  { id: 'porta-traseira-dir', nome: 'Porta traseira direita', zona: 'lateral-dir', area: 4, complexidade: 3, precoBase: 520 },
  { id: 'para-lama-traseiro-dir', nome: 'Para-lama traseiro direito', zona: 'lateral-dir', area: 2, complexidade: 3, precoBase: 320 },
  { id: 'espelho-dir', nome: 'Retrovisor direito', zona: 'lateral-dir', area: 1, complexidade: 4, precoBase: 140 },
  { id: 'maçaneta-dir', nome: 'Maçanetas direita', zona: 'lateral-dir', area: 1, complexidade: 2, precoBase: 90 },

  // Teto
  { id: 'teto', nome: 'Teto', zona: 'teto', area: 5, complexidade: 2, precoBase: 720, svgId: 'part-teto' },

  // Traseira
  { id: 'tampa-malas', nome: 'Tampa do porta-malas', zona: 'traseira', area: 3, complexidade: 3, precoBase: 460, svgId: 'part-tampa' },
  { id: 'para-choque-traseiro', nome: 'Para-choque traseiro', zona: 'traseira', area: 3, complexidade: 4, precoBase: 480, svgId: 'part-pct' },
  { id: 'coluna-c-esq', nome: 'Coluna C esquerda', zona: 'traseira', area: 1, complexidade: 3, precoBase: 220 },
  { id: 'coluna-c-dir', nome: 'Coluna C direita', zona: 'traseira', area: 1, complexidade: 3, precoBase: 220 },
  { id: 'tampa-traseira-lateral-esq', nome: 'Quarto traseiro esquerdo', zona: 'traseira', area: 2, complexidade: 3, precoBase: 280 },
  { id: 'tampa-traseira-lateral-dir', nome: 'Quarto traseiro direito', zona: 'traseira', area: 2, complexidade: 3, precoBase: 280 },
]

export const CAR_PARTS_BY_ID: Record<string, CarPart> = Object.fromEntries(
  CAR_PARTS.map((p) => [p.id, p])
)

// Serviços adicionais por peça
export type TipoServico = 'pintura-completa' | 'retoque' | 'polimento' | 'tratamento-ferrugem'

export const TIPOS_SERVICO: { id: TipoServico; nome: string; fatorMultiplicador: number; descricao: string }[] = [
  { id: 'pintura-completa', nome: 'Pintura completa', fatorMultiplicador: 1.0, descricao: 'Pintura completa da peça com preparação, fundo, base e verniz.' },
  { id: 'retoque', nome: 'Retoque localizado', fatorMultiplicador: 0.45, descricao: 'Reparo pontual em área específica da peça.' },
  { id: 'polimento', nome: 'Polimento técnico', fatorMultiplicador: 0.25, descricao: 'Polimento para remover riscos e revitalizar a cor original.' },
  { id: 'tratamento-ferrugem', nome: 'Tratamento de ferrugem', fatorMultiplicador: 0.65, descricao: 'Remoção de ferrugem, tratamento e pintura da área afetada.' },
]
