// Dados da empresa (fornecidos pelo usuário)
export const COMPANY = {
  nome: 'Cel-Car — Funilaria e Pintura',
  cnpj: '35.497.152/0001-26',
  cnpjRaw: '35497152000126',
  telefone: '(21) 97708-6841',
  telefoneRaw: '21977086841',
  email: 'celio_e-v@hotmail.com',
  cep: '20760-245',
  endereco: 'Rua José dos Reis, 2047 — Inhaúma',
  cidade: 'Rio de Janeiro',
  estado: 'RJ',
  whatsappLink: 'https://wa.me/5521977086841',
} as const

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoDate
  }
}
