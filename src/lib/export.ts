// Funções de exportação: PDF (jsPDF), Word (.doc HTML), JSON, WhatsApp, Email, Print
import { jsPDF } from 'jspdf'
import { COMPANY, formatBRL, formatDate } from './company'
import { PAINT_COLORS_BY_ID } from './colors'
import { CAR_PARTS_BY_ID, TIPOS_SERVICO } from './car-parts'

export interface BudgetItem {
  partId: string
  tipoServico: string
  corId: string
  preco: number
  observacao?: string
}

// Peça de reposição (ex: para-choque traseiro novo)
export interface ReplacementPart {
  id: string
  nome: string // ex: "Para-choque traseiro"
  veiculo: string // ex: "Volkswagen Kombi 2010"
  marca?: string // ex: "Original VW", "Paralelo"
  fornecedor?: string // ex: "Mercado Livre", "WebMotors"
  link?: string // URL onde encontrou
  preco: number
  quantidade: number
  observacao?: string
}

// Serviço de mão de obra (ex: "Troca de para-choque", "Tratamento de ferrugem")
export interface LaborService {
  id: string
  descricao: string // ex: "Remoção e instalação de para-choque traseiro"
  tempoEstimado?: string // ex: "2h", "1 dia útil", "3 dias úteis"
  preco: number
  observacao?: string
}

export interface ClientData {
  nome: string
  telefone: string
  email: string
  placa: string
  modelo: string
  ano: string
}

export interface Budget {
  id: string
  numero: string
  createdAt: string
  cliente: ClientData
  itens: BudgetItem[] // serviços de pintura
  pecasReposicao: ReplacementPart[] // peças que serão substituídas
  maodeObra: LaborService[] // serviços de mão de obra
  desconto: number // percentual
  observacoes: string
  garantia: string
  validade: string
  total: number
  assinatura?: string // data URL PNG (assinatura digital do cliente)
  assinaturaEmpresa?: string // data URL PNG (assinatura da empresa)
  logo?: string // data URL PNG (logo da empresa)
  fotosAntes?: string[] // data URLs das fotos antes do serviço
  fotosDepois?: string[] // data URLs das fotos depois do serviço
}

export function calculateItemPrice(
  partId: string,
  tipoServico: string,
  corId: string
): number {
  const part = CAR_PARTS_BY_ID[partId]
  const color = PAINT_COLORS_BY_ID[corId]
  const servico = TIPOS_SERVICO.find((s) => s.id === tipoServico)
  if (!part || !color || !servico) return 0
  return Math.round(part.precoBase * servico.fatorMultiplicador * color.fatorPreco)
}

// Soma de pintura + peças de reposição + mão de obra (antes do desconto)
export function subtotal(budget: Budget): number {
  const pintura = budget.itens.reduce((s, i) => s + i.preco, 0)
  const pecas = (budget.pecasReposicao || []).reduce((s, p) => s + p.preco * p.quantidade, 0)
  const maodeObra = (budget.maodeObra || []).reduce((s, m) => s + m.preco, 0)
  return pintura + pecas + maodeObra
}

export function buildWhatsAppMessage(budget: Budget): string {
  const lines: string[] = []
  lines.push(`*ORÇAMENTO ${budget.numero}*`)
  lines.push(`${COMPANY.nome}`)
  lines.push(`CNPJ: ${COMPANY.cnpj} | Tel: ${COMPANY.telefone}`)
  lines.push(`${COMPANY.endereco} — ${COMPANY.cidade}/${COMPANY.estado} — CEP ${COMPANY.cep}`)
  lines.push('')
  lines.push(`*Cliente:* ${budget.cliente.nome || '-'}`)
  if (budget.cliente.telefone) lines.push(`*Telefone:* ${budget.cliente.telefone}`)
  if (budget.cliente.modelo) lines.push(`*Veículo:* ${budget.cliente.modelo}${budget.cliente.ano ? ' — ' + budget.cliente.ano : ''}`)
  if (budget.cliente.placa) lines.push(`*Placa:* ${budget.cliente.placa}`)
  lines.push('')
  lines.push('*Serviços de Pintura:*')
  if (budget.itens.length === 0) {
    lines.push('(nenhum)')
  } else {
    budget.itens.forEach((item, idx) => {
      const part = CAR_PARTS_BY_ID[item.partId]
      const color = PAINT_COLORS_BY_ID[item.corId]
      const servico = TIPOS_SERVICO.find((s) => s.id === item.tipoServico)
      lines.push(
        `${idx + 1}. ${part?.nome ?? item.partId} — ${servico?.nome ?? item.tipoServico} — ${color?.nome ?? item.corId} — ${formatBRL(item.preco)}`
      )
    })
  }

  if (budget.pecasReposicao && budget.pecasReposicao.length > 0) {
    lines.push('')
    lines.push('*Peças de Reposição:*')
    budget.pecasReposicao.forEach((p, idx) => {
      const qtd = p.quantidade > 1 ? ` x${p.quantidade}` : ''
      const sub = p.preco * p.quantidade
      const marca = p.marca ? ` (${p.marca})` : ''
      const forn = p.fornecedor ? ` — ${p.fornecedor}` : ''
      lines.push(`${idx + 1}. ${p.nome}${marca} — ${p.veiculo}${forn}${qtd} — ${formatBRL(sub)}`)
    })
  }

  if (budget.maodeObra && budget.maodeObra.length > 0) {
    lines.push('')
    lines.push('*Mão de Obra:*')
    budget.maodeObra.forEach((m, idx) => {
      const horas = m.tempoEstimado ? ` (${m.tempoEstimado})` : ''
      lines.push(`${idx + 1}. ${m.descricao}${horas} — ${formatBRL(m.preco)}`)
    })
  }

  if (budget.desconto > 0) {
    const sub = subtotal(budget)
    lines.push('')
    lines.push(`Subtotal: ${formatBRL(sub)}`)
    lines.push(`Desconto: ${budget.desconto}%`)
  }
  lines.push('')
  lines.push(`*TOTAL: ${formatBRL(budget.total)}*`)
  lines.push('')
  lines.push(`Validade: ${budget.validade}`)
  lines.push(`Garantia: ${budget.garantia}`)
  if (budget.observacoes) {
    lines.push('')
    lines.push(`Obs: ${budget.observacoes}`)
  }
  if (budget.assinatura) {
    lines.push('')
    lines.push('✓ Orçamento assinado digitalmente pelo cliente')
  }
  lines.push('')
  lines.push(`Gerado em ${formatDate(budget.createdAt)}`)
  return lines.join('\n')
}

export function shareOnWhatsApp(budget: Budget) {
  const msg = buildWhatsAppMessage(budget)
  const url = `${COMPANY.whatsappLink}?text=${encodeURIComponent(msg)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function shareOnEmail(budget: Budget) {
  const subject = `Orçamento de Repintura ${budget.numero} — ${budget.cliente.nome || 'Cliente'}`
  const body = buildWhatsAppMessage(budget)
  const mailto = `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.href = mailto
}

export function saveJSON(budget: Budget) {
  const blob = new Blob([JSON.stringify(budget, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orcamento-${budget.numero}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportPDF(budget: Budget) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  let y = margin

  // Header bar
  doc.setFillColor(200, 16, 46)
  doc.rect(0, 0, pageWidth, 28, 'F')
  // Logo (se houver)
  if (budget.logo) {
    try {
      doc.addImage(budget.logo, 'PNG', margin, 4, 20, 20)
    } catch (e) {
      console.error('Erro ao adicionar logo ao PDF:', e)
    }
  }
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(COMPANY.nome, budget.logo ? margin + 24 : margin, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`CNPJ: ${COMPANY.cnpj}  |  Tel: ${COMPANY.telefone}  |  ${COMPANY.email}`, budget.logo ? margin + 24 : margin, 18)
  doc.text(`${COMPANY.endereco} — ${COMPANY.cidade}/${COMPANY.estado} — CEP ${COMPANY.cep}`, budget.logo ? margin + 24 : margin, 23)

  y = 36
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(`ORÇAMENTO ${budget.numero}`, margin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Emissão: ${formatDate(budget.createdAt)}`, margin, y)
  doc.text(`Validade: ${budget.validade}`, pageWidth - margin, y, { align: 'right' })
  y += 8

  // Client info box
  doc.setDrawColor(200, 16, 46)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, pageWidth - margin * 2, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('DADOS DO CLIENTE', margin + 3, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const c = budget.cliente
  doc.text(`Nome: ${c.nome || '-'}`, margin + 3, y + 11)
  doc.text(`Telefone: ${c.telefone || '-'}`, margin + 3, y + 16)
  doc.text(`E-mail: ${c.email || '-'}`, margin + 3, y + 21)
  doc.text(`Veículo: ${c.modelo || '-'} ${c.ano ? '/ ' + c.ano : ''}`, pageWidth / 2 + 5, y + 11)
  doc.text(`Placa: ${c.placa || '-'}`, pageWidth / 2 + 5, y + 16)
  doc.text(`Ano: ${c.ano || '-'}`, pageWidth / 2 + 5, y + 21)
  y += 36

  // Items table header
  doc.setFillColor(30, 64, 175)
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('#', margin + 2, y + 5)
  doc.text('Peça', margin + 8, y + 5)
  doc.text('Serviço', margin + 70, y + 5)
  doc.text('Cor', margin + 110, y + 5)
  doc.text('Valor', pageWidth - margin - 2, y + 5, { align: 'right' })
  y += 9

  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  budget.itens.forEach((item, idx) => {
    if (y > pageHeight - 30) {
      doc.addPage()
      y = margin
    }
    const part = CAR_PARTS_BY_ID[item.partId]
    const color = PAINT_COLORS_BY_ID[item.corId]
    const servico = TIPOS_SERVICO.find((s) => s.id === item.tipoServico)
    if (idx % 2 === 0) {
      doc.setFillColor(245, 245, 245)
      doc.rect(margin, y - 4, pageWidth - margin * 2, 6, 'F')
    }
    doc.text(String(idx + 1), margin + 2, y)
    doc.text((part?.nome ?? item.partId).slice(0, 38), margin + 8, y)
    doc.text((servico?.nome ?? item.tipoServico).slice(0, 22), margin + 70, y)
    doc.text((color?.nome ?? item.corId).slice(0, 22), margin + 110, y)
    doc.text(formatBRL(item.preco), pageWidth - margin - 2, y, { align: 'right' })
    y += 6
  })

  // Peças de reposição
  if (budget.pecasReposicao && budget.pecasReposicao.length > 0) {
    y += 8
    if (y > pageHeight - 30) { doc.addPage(); y = margin }
    doc.setFillColor(200, 16, 46)
    doc.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('PEÇAS DE REPOSIÇÃO', margin + 2, y + 1)
    y += 8
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    budget.pecasReposicao.forEach((p, idx) => {
      if (y > pageHeight - 20) { doc.addPage(); y = margin }
      const sub = p.preco * p.quantidade
      const label = `${p.nome}${p.marca ? ' — ' + p.marca : ''} — ${p.veiculo}${p.fornecedor ? ' (' + p.fornecedor + ')' : ''}${p.quantidade > 1 ? ' x' + p.quantidade : ''}`
      if (idx % 2 === 0) {
        doc.setFillColor(245, 245, 245)
        doc.rect(margin, y - 4, pageWidth - margin * 2, 6, 'F')
      }
      doc.text(String(idx + 1), margin + 2, y)
      const labelLines = doc.splitTextToSize(label, pageWidth - margin * 2 - 50)
      doc.text(labelLines, margin + 8, y)
      doc.text(formatBRL(sub), pageWidth - margin - 2, y, { align: 'right' })
      y += Math.max(6, labelLines.length * 5)
    })
  }

  // Mão de obra
  if (budget.maodeObra && budget.maodeObra.length > 0) {
    y += 8
    if (y > pageHeight - 30) { doc.addPage(); y = margin }
    doc.setFillColor(30, 64, 175)
    doc.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('MÃO DE OBRA', margin + 2, y + 1)
    y += 8
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    budget.maodeObra.forEach((m, idx) => {
      if (y > pageHeight - 20) { doc.addPage(); y = margin }
      const label = `${m.descricao}${m.tempoEstimado ? ' (' + m.tempoEstimado + ')' : ''}`
      if (idx % 2 === 0) {
        doc.setFillColor(245, 245, 245)
        doc.rect(margin, y - 4, pageWidth - margin * 2, 6, 'F')
      }
      doc.text(String(idx + 1), margin + 2, y)
      const labelLines = doc.splitTextToSize(label, pageWidth - margin * 2 - 50)
      doc.text(labelLines, margin + 8, y)
      doc.text(formatBRL(m.preco), pageWidth - margin - 2, y, { align: 'right' })
      y += Math.max(6, labelLines.length * 5)
    })
  }

  // Totals
  y += 4
  doc.setDrawColor(150, 150, 150)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6
  const sub = subtotal(budget)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal:', pageWidth - margin - 50, y)
  doc.text(formatBRL(sub), pageWidth - margin - 2, y, { align: 'right' })
  y += 6
  if (budget.desconto > 0) {
    doc.text(`Desconto (${budget.desconto}%):`, pageWidth - margin - 50, y)
    doc.text(`- ${formatBRL((sub * budget.desconto) / 100)}`, pageWidth - margin - 2, y, { align: 'right' })
    y += 6
  }
  doc.setFillColor(200, 16, 46)
  doc.rect(pageWidth - margin - 60, y - 4, 60, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL:', pageWidth - margin - 58, y + 1)
  doc.text(formatBRL(budget.total), pageWidth - margin - 2, y + 1, { align: 'right' })
  y += 14

  // Footer
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (budget.garantia) {
    doc.text(`Garantia: ${budget.garantia}`, margin, y)
    y += 5
  }
  if (budget.observacoes) {
    doc.text('Observações:', margin, y)
    y += 5
    const obsLines = doc.splitTextToSize(budget.observacoes, pageWidth - margin * 2)
    doc.text(obsLines, margin, y)
    y += obsLines.length * 5
  }

  // Fotos antes/depois
  if ((budget.fotosAntes?.length || 0) > 0 || (budget.fotosDepois?.length || 0) > 0) {
    y += 8
    if (y > pageHeight - 80) { doc.addPage(); y = margin }
    doc.setFillColor(30, 64, 175)
    doc.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('FOTOS DO VEÍCULO', margin + 2, y + 1)
    y += 9
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')

    const drawPhotos = (photos: string[] | undefined, title: string) => {
      if (!photos || photos.length === 0) return
      if (y > pageHeight - 60) { doc.addPage(); y = margin }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(title, margin, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      const photoW = 50
      const photoH = 35
      const gap = 4
      const maxPerRow = Math.floor((pageWidth - margin * 2 + gap) / (photoW + gap))
      photos.slice(0, 6).forEach((p, i) => {
        const col = i % maxPerRow
        const row = Math.floor(i / maxPerRow)
        const x = margin + col * (photoW + gap)
        const py = y + row * (photoH + gap)
        if (py + photoH > pageHeight - 10) {
          doc.addPage()
          y = margin
        }
        try {
          doc.addImage(p, 'PNG', x, py, photoW, photoH)
          doc.setDrawColor(150, 150, 150)
          doc.rect(x, py, photoW, photoH)
        } catch (e) {
          console.error('Erro ao adicionar foto ao PDF:', e)
        }
      })
      const rows = Math.ceil(Math.min(photos.length, 6) / maxPerRow)
      y += rows * (photoH + gap) + 4
    }

    drawPhotos(budget.fotosAntes, 'ANTES:')
    drawPhotos(budget.fotosDepois, 'DEPOIS:')
  }

  // Assinaturas
  y += 8
  if (y > pageHeight - 60) {
    doc.addPage()
    y = margin
  }
  const sigBoxW = (pageWidth - margin * 2 - 10) / 2
  const sigBoxH = 28
  // Linha do cliente
  doc.setDrawColor(80, 80, 80)
  doc.setLineWidth(0.3)
  doc.line(margin, y + sigBoxH, margin + sigBoxW, y + sigBoxH)
  // Linha da empresa
  doc.line(margin + sigBoxW + 10, y + sigBoxH, pageWidth - margin, y + sigBoxH)

  // Imagens das assinaturas (se houver)
  if (budget.assinatura) {
    try {
      doc.addImage(budget.assinatura, 'PNG', margin + 5, y, sigBoxW - 10, sigBoxH - 2)
    } catch (e) {
      console.error('Erro ao adicionar assinatura do cliente ao PDF:', e)
    }
  }
  if (budget.assinaturaEmpresa) {
    try {
      doc.addImage(
        budget.assinaturaEmpresa,
        'PNG',
        margin + sigBoxW + 15,
        y,
        sigBoxW - 10,
        sigBoxH - 2
      )
    } catch (e) {
      console.error('Erro ao adicionar assinatura da empresa ao PDF:', e)
    }
  }

  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Assinatura do Cliente: ${budget.cliente.nome || ''}`, margin, y + sigBoxH + 4)
  doc.text(`Assinatura da Empresa: ${COMPANY.nome}`, margin + sigBoxW + 10, y + sigBoxH + 4)
  if (budget.assinatura || budget.assinaturaEmpresa) {
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text(
      'Documento assinado digitalmente. A assinatura digital tem validade jurídica conforme MP 2.200-2/2001 e Lei 14.063/2020.',
      margin,
      y + sigBoxH + 8
    )
  }

  y += sigBoxH + 14

  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text(
    `Orçamento gerado automaticamente com sugestão de preços por IA. Em caso de dúvida, contate ${COMPANY.telefone} ou ${COMPANY.email}.`,
    margin,
    pageHeight - 10
  )

  doc.save(`orcamento-${budget.numero}.pdf`)
}

export function exportWord(budget: Budget) {
  const rows = budget.itens
    .map((item, idx) => {
      const part = CAR_PARTS_BY_ID[item.partId]
      const color = PAINT_COLORS_BY_ID[item.corId]
      const servico = TIPOS_SERVICO.find((s) => s.id === item.tipoServico)
      return `<tr>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${idx + 1}</td>
        <td style="border:1px solid #ccc;padding:6px">${part?.nome ?? item.partId}</td>
        <td style="border:1px solid #ccc;padding:6px">${servico?.nome ?? item.tipoServico}</td>
        <td style="border:1px solid #ccc;padding:6px">${color?.nome ?? item.corId}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right">${formatBRL(item.preco)}</td>
      </tr>`
    })
    .join('')

  const pecasRows = (budget.pecasReposicao || [])
    .map((p, idx) => {
      const sub = p.preco * p.quantidade
      return `<tr>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${idx + 1}</td>
        <td style="border:1px solid #ccc;padding:6px">${p.nome}${p.marca ? ' — ' + p.marca : ''}</td>
        <td style="border:1px solid #ccc;padding:6px">${p.veiculo}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${p.quantidade}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right">${formatBRL(sub)}</td>
      </tr>`
    })
    .join('')

  const maoRows = (budget.maodeObra || [])
    .map((m, idx) => {
      return `<tr>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${idx + 1}</td>
        <td style="border:1px solid #ccc;padding:6px">${m.descricao}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${m.tempoEstimado || '-'}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right">${formatBRL(m.preco)}</td>
      </tr>`
    })
    .join('')

  const sub = subtotal(budget)
  const descontoValor = (sub * budget.desconto) / 100

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Orçamento ${budget.numero}</title></head>
<body style="font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#111">
  <div style="background:#C8102E;color:#fff;padding:12px;border-radius:6px;display:flex;align-items:center;gap:12px">
    ${budget.logo ? `<img src="${budget.logo}" style="height:60px;width:60px;object-fit:contain;background:#fff;border-radius:4px;padding:2px" alt="Logo" />` : ''}
    <div style="flex:1">
      <div style="font-size:18pt;font-weight:bold">${COMPANY.nome}</div>
      <div style="font-size:9pt;margin-top:4px">CNPJ: ${COMPANY.cnpj} &nbsp;|&nbsp; Tel: ${COMPANY.telefone} &nbsp;|&nbsp; ${COMPANY.email}</div>
      <div style="font-size:9pt">${COMPANY.endereco} — ${COMPANY.cidade}/${COMPANY.estado} — CEP ${COMPANY.cep}</div>
    </div>
  </div>

  <h2 style="color:#C8102E;margin-top:18px">ORÇAMENTO ${budget.numero}</h2>
  <p style="font-size:10pt">Emissão: ${formatDate(budget.createdAt)} &nbsp;&nbsp; Validade: ${budget.validade}</p>

  <h3 style="color:#1E40AF">Dados do Cliente</h3>
  <table style="border-collapse:collapse;width:100%;font-size:10pt">
    <tr><td style="border:1px solid #ccc;padding:6px"><b>Nome:</b> ${budget.cliente.nome || '-'}</td>
        <td style="border:1px solid #ccc;padding:6px"><b>Veículo:</b> ${budget.cliente.modelo || '-'} ${budget.cliente.ano ? '/ ' + budget.cliente.ano : ''}</td></tr>
    <tr><td style="border:1px solid #ccc;padding:6px"><b>Telefone:</b> ${budget.cliente.telefone || '-'}</td>
        <td style="border:1px solid #ccc;padding:6px"><b>Placa:</b> ${budget.cliente.placa || '-'}</td></tr>
    <tr><td style="border:1px solid #ccc;padding:6px"><b>E-mail:</b> ${budget.cliente.email || '-'}</td>
        <td style="border:1px solid #ccc;padding:6px">&nbsp;</td></tr>
  </table>

  <h3 style="color:#1E40AF">Serviços de Pintura</h3>
  <table style="border-collapse:collapse;width:100%;font-size:10pt">
    <thead>
      <tr style="background:#1E40AF;color:#fff">
        <th style="border:1px solid #1E40AF;padding:6px;width:30px">#</th>
        <th style="border:1px solid #1E40AF;padding:6px;text-align:left">Peça</th>
        <th style="border:1px solid #1E40AF;padding:6px;text-align:left">Serviço</th>
        <th style="border:1px solid #1E40AF;padding:6px;text-align:left">Cor</th>
        <th style="border:1px solid #1E40AF;padding:6px;text-align:right">Valor</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="5" style="border:1px solid #ccc;padding:6px;text-align:center;color:#777">(nenhum)</td></tr>'}</tbody>
  </table>

  ${pecasRows ? `
  <h3 style="color:#C8102E;margin-top:18px">Peças de Reposição</h3>
  <table style="border-collapse:collapse;width:100%;font-size:10pt">
    <thead>
      <tr style="background:#C8102E;color:#fff">
        <th style="border:1px solid #C8102E;padding:6px;width:30px">#</th>
        <th style="border:1px solid #C8102E;padding:6px;text-align:left">Peça</th>
        <th style="border:1px solid #C8102E;padding:6px;text-align:left">Veículo</th>
        <th style="border:1px solid #C8102E;padding:6px;text-align:center">Qtd</th>
        <th style="border:1px solid #C8102E;padding:6px;text-align:right">Valor</th>
      </tr>
    </thead>
    <tbody>${pecasRows}</tbody>
  </table>` : ''}

  ${maoRows ? `
  <h3 style="color:#1E40AF;margin-top:18px">Mão de Obra</h3>
  <table style="border-collapse:collapse;width:100%;font-size:10pt">
    <thead>
      <tr style="background:#1E40AF;color:#fff">
        <th style="border:1px solid #1E40AF;padding:6px;width:30px">#</th>
        <th style="border:1px solid #1E40AF;padding:6px;text-align:left">Descrição</th>
        <th style="border:1px solid #1E40AF;padding:6px;text-align:center">Horas/Dias</th>
        <th style="border:1px solid #1E40AF;padding:6px;text-align:right">Valor</th>
      </tr>
    </thead>
    <tbody>${maoRows}</tbody>
  </table>` : ''}

  <table style="border-collapse:collapse;margin-top:8px;margin-left:auto;width:300px;font-size:11pt">
    <tr><td style="padding:4px">Subtotal:</td><td style="padding:4px;text-align:right">${formatBRL(sub)}</td></tr>
    ${budget.desconto > 0 ? `<tr><td style="padding:4px">Desconto (${budget.desconto}%):</td><td style="padding:4px;text-align:right">- ${formatBRL(descontoValor)}</td></tr>` : ''}
    <tr style="background:#C8102E;color:#fff;font-weight:bold">
      <td style="padding:6px">TOTAL:</td><td style="padding:6px;text-align:right">${formatBRL(budget.total)}</td>
    </tr>
  </table>

  ${budget.garantia ? `<p style="margin-top:14px"><b>Garantia:</b> ${budget.garantia}</p>` : ''}
  ${budget.observacoes ? `<p><b>Observações:</b> ${budget.observacoes}</p>` : ''}

  ${(budget.fotosAntes?.length || budget.fotosDepois?.length) ? `
  <h3 style="color:#1E40AF;margin-top:24px">Fotos do Veículo</h3>
  ${budget.fotosAntes && budget.fotosAntes.length > 0 ? `
    <p style="margin:8px 0 4px;font-weight:bold">ANTES:</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
      ${budget.fotosAntes.map(p => `<img src="${p}" style="width:120px;height:90px;object-fit:cover;border:1px solid #ccc;border-radius:4px" alt="Antes" />`).join('')}
    </div>
  ` : ''}
  ${budget.fotosDepois && budget.fotosDepois.length > 0 ? `
    <p style="margin:8px 0 4px;font-weight:bold">DEPOIS:</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
      ${budget.fotosDepois.map(p => `<img src="${p}" style="width:120px;height:90px;object-fit:cover;border:1px solid #ccc;border-radius:4px" alt="Depois" />`).join('')}
    </div>
  ` : ''}
  ` : ''}

  <div style="margin-top:30px;display:flex;justify-content:space-between;gap:30px">
    <div style="flex:1;text-align:center">
      ${budget.assinatura ? `<img src="${budget.assinatura}" style="height:60px;margin-bottom:4px" alt="Assinatura do cliente" />` : '<div style="height:60px"></div>'}
      <div style="border-top:1px solid #555;padding-top:4px;font-size:9pt">Assinatura do Cliente: ${budget.cliente.nome || ''}</div>
    </div>
    <div style="flex:1;text-align:center">
      ${budget.assinaturaEmpresa ? `<img src="${budget.assinaturaEmpresa}" style="height:60px;margin-bottom:4px" alt="Assinatura da empresa" />` : '<div style="height:60px"></div>'}
      <div style="border-top:1px solid #555;padding-top:4px;font-size:9pt">Assinatura da Empresa: ${COMPANY.nome}</div>
    </div>
  </div>
  ${(budget.assinatura || budget.assinaturaEmpresa) ? `<p style="font-size:7pt;color:#777;margin-top:6px;text-align:center">Documento assinado digitalmente. A assinatura digital tem validade jurídica conforme MP 2.200-2/2001 e Lei 14.063/2020.</p>` : ''}

  <hr style="margin-top:20px;border:none;border-top:1px solid #ccc">
  <p style="font-size:8pt;color:#777">Orçamento gerado automaticamente com sugestão de preços por IA. Em caso de dúvida, contate ${COMPANY.telefone} ou ${COMPANY.email}.</p>
</body>
</html>`

  const blob = new Blob([html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orcamento-${budget.numero}.doc`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function printBudget(budget: Budget) {
  const rows = budget.itens
    .map((item, idx) => {
      const part = CAR_PARTS_BY_ID[item.partId]
      const color = PAINT_COLORS_BY_ID[item.corId]
      const servico = TIPOS_SERVICO.find((s) => s.id === item.tipoServico)
      return `<tr>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${idx + 1}</td>
        <td style="border:1px solid #ccc;padding:6px">${part?.nome ?? item.partId}</td>
        <td style="border:1px solid #ccc;padding:6px">${servico?.nome ?? item.tipoServico}</td>
        <td style="border:1px solid #ccc;padding:6px">${color?.nome ?? item.corId}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right">${formatBRL(item.preco)}</td>
      </tr>`
    })
    .join('')
  const pecasRows = (budget.pecasReposicao || [])
    .map((p, idx) => {
      const sub = p.preco * p.quantidade
      return `<tr>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${idx + 1}</td>
        <td style="border:1px solid #ccc;padding:6px">${p.nome}${p.marca ? ' — ' + p.marca : ''}</td>
        <td style="border:1px solid #ccc;padding:6px">${p.veiculo}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${p.quantidade}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right">${formatBRL(sub)}</td>
      </tr>`
    })
    .join('')
  const maoRows = (budget.maodeObra || [])
    .map((m, idx) => {
      return `<tr>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${idx + 1}</td>
        <td style="border:1px solid #ccc;padding:6px">${m.descricao}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${m.tempoEstimado || '-'}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right">${formatBRL(m.preco)}</td>
      </tr>`
    })
    .join('')
  const sub = subtotal(budget)
  const descontoValor = (sub * budget.desconto) / 100

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
  <title>Orçamento ${budget.numero}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:24px;font-size:11pt}
    .header{background:#C8102E;color:#fff;padding:12px;border-radius:6px;display:flex;align-items:center;gap:12px}
    .header h1{margin:0;font-size:18pt}
    .header p{margin:2px 0;font-size:9pt}
    h2{color:#C8102E}
    h3{color:#1E40AF}
    table{border-collapse:collapse;width:100%;margin-top:8px;font-size:10pt}
    th,td{border:1px solid #ccc;padding:6px}
    th{background:#1E40AF;color:#fff;text-align:left}
    .totals{margin-top:8px;margin-left:auto;width:300px}
    .totals td{border:none;padding:4px}
    .total-row{background:#C8102E;color:#fff;font-weight:bold}
    .footer{margin-top:20px;border-top:1px solid #ccc;padding-top:8px;font-size:8pt;color:#777}
    @media print{body{margin:8mm}}
  </style></head><body>
    <div class="header">
      ${budget.logo ? `<img src="${budget.logo}" style="height:60px;width:60px;object-fit:contain;background:#fff;border-radius:4px;padding:2px" alt="Logo" />` : ''}
      <div style="flex:1">
        <h1>${COMPANY.nome}</h1>
        <p>CNPJ: ${COMPANY.cnpj} &nbsp;|&nbsp; Tel: ${COMPANY.telefone} &nbsp;|&nbsp; ${COMPANY.email}</p>
        <p>${COMPANY.endereco} — ${COMPANY.cidade}/${COMPANY.estado} — CEP ${COMPANY.cep}</p>
      </div>
    </div>
    <h2>ORÇAMENTO ${budget.numero}</h2>
    <p>Emissão: ${formatDate(budget.createdAt)} &nbsp;&nbsp; Validade: ${budget.validade}</p>
    <h3>Dados do Cliente</h3>
    <table>
      <tr><td><b>Nome:</b> ${budget.cliente.nome || '-'}</td><td><b>Veículo:</b> ${budget.cliente.modelo || '-'} ${budget.cliente.ano ? '/ ' + budget.cliente.ano : ''}</td></tr>
      <tr><td><b>Telefone:</b> ${budget.cliente.telefone || '-'}</td><td><b>Placa:</b> ${budget.cliente.placa || '-'}</td></tr>
      <tr><td><b>E-mail:</b> ${budget.cliente.email || '-'}</td><td>&nbsp;</td></tr>
    </table>
    <h3>Serviços de Pintura</h3>
    <table>
      <thead><tr><th>#</th><th>Peça</th><th>Serviço</th><th>Cor</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#777">(nenhum)</td></tr>'}</tbody>
    </table>
    ${pecasRows ? `
    <h3 style="color:#C8102E">Peças de Reposição</h3>
    <table>
      <thead><tr style="background:#C8102E"><th>#</th><th>Peça</th><th>Veículo</th><th>Qtd</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>${pecasRows}</tbody>
    </table>` : ''}
    ${maoRows ? `
    <h3>Mão de Obra</h3>
    <table>
      <thead><tr><th>#</th><th>Descrição</th><th>Horas/Dias</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>${maoRows}</tbody>
    </table>` : ''}
    <table class="totals">
      <tr><td>Subtotal:</td><td style="text-align:right">${formatBRL(sub)}</td></tr>
      ${budget.desconto > 0 ? `<tr><td>Desconto (${budget.desconto}%):</td><td style="text-align:right">- ${formatBRL(descontoValor)}</td></tr>` : ''}
      <tr class="total-row"><td>TOTAL:</td><td style="text-align:right">${formatBRL(budget.total)}</td></tr>
    </table>
    ${budget.garantia ? `<p><b>Garantia:</b> ${budget.garantia}</p>` : ''}
    ${budget.observacoes ? `<p><b>Observações:</b> ${budget.observacoes}</p>` : ''}

    ${(budget.fotosAntes?.length || budget.fotosDepois?.length) ? `
    <h3 style="color:#1E40AF">Fotos do Veículo</h3>
    ${budget.fotosAntes && budget.fotosAntes.length > 0 ? `
      <p style="margin:8px 0 4px;font-weight:bold">ANTES:</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
        ${budget.fotosAntes.map(p => `<img src="${p}" style="width:120px;height:90px;object-fit:cover;border:1px solid #ccc;border-radius:4px" alt="Antes" />`).join('')}
      </div>
    ` : ''}
    ${budget.fotosDepois && budget.fotosDepois.length > 0 ? `
      <p style="margin:8px 0 4px;font-weight:bold">DEPOIS:</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
        ${budget.fotosDepois.map(p => `<img src="${p}" style="width:120px;height:90px;object-fit:cover;border:1px solid #ccc;border-radius:4px" alt="Depois" />`).join('')}
      </div>
    ` : ''}
    ` : ''}

    <div style="margin-top:30px;display:flex;justify-content:space-between;gap:30px">
      <div style="flex:1;text-align:center">
        ${budget.assinatura ? `<img src="${budget.assinatura}" style="height:60px;margin-bottom:4px" alt="Assinatura do cliente" />` : '<div style="height:60px"></div>'}
        <div style="border-top:1px solid #555;padding-top:4px;font-size:9pt">Assinatura do Cliente: ${budget.cliente.nome || ''}</div>
      </div>
      <div style="flex:1;text-align:center">
        ${budget.assinaturaEmpresa ? `<img src="${budget.assinaturaEmpresa}" style="height:60px;margin-bottom:4px" alt="Assinatura da empresa" />` : '<div style="height:60px"></div>'}
        <div style="border-top:1px solid #555;padding-top:4px;font-size:9pt">Assinatura da Empresa: ${COMPANY.nome}</div>
      </div>
    </div>
    ${(budget.assinatura || budget.assinaturaEmpresa) ? `<p style="font-size:7pt;color:#777;margin-top:6px;text-align:center">Documento assinado digitalmente. A assinatura digital tem validade jurídica conforme MP 2.200-2/2001 e Lei 14.063/2020.</p>` : ''}
    <div class="footer">Orçamento gerado automaticamente com sugestão de preços por IA. Em caso de dúvida, contate ${COMPANY.telefone} ou ${COMPANY.email}.</div>
    <script>
      window.onload = function(){
        setTimeout(function(){
          try { window.print(); } catch(e) { console.error('print error', e); }
        }, 500);
      };
      window.onafterprint = function(){
        try { window.close(); } catch(e) {}
      };
    </script>
  </body></html>`

  // Use a Blob URL — far more reliable than document.write into about:blank,
  // works with modern popup blockers and avoids the about:blank issue.
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const win = window.open(url, '_blank')
  if (!win) {
    // Popup blocked — fall back to opening the same content in current tab via data URL
    alert('Não foi possível abrir a janela de impressão (pop-up bloqueado). Tente novamente permitindo pop-ups para este site.')
    URL.revokeObjectURL(url)
    return
  }

  // Clean up the blob URL after a delay to let the new window load
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 30000)
}
