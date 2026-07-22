import { NextRequest, NextResponse } from 'next/server'
import { CAR_PARTS_BY_ID, TIPOS_SERVICO } from '@/lib/car-parts'
import { PAINT_COLORS_BY_ID } from '@/lib/colors'

interface SuggestPriceRequest {
  partId: string
  tipoServico: string
  corId: string
  veiculo?: string
  observacoes?: string
}

interface AIResult {
  preco_sugerido: number
  justificativa: string
  faixa_minima: number
  faixa_maxima: number
  confianca: string
}

/**
 * Chama a IA. Suporta dois modos:
 * 1. Sandbox Z.ai — usa o pacote `z-ai-web-dev-sdk` (instalado apenas no sandbox)
 * 2. Produção — usa OpenAI-compatible API via variáveis OPENAI_API_BASE + OPENAI_API_KEY
 *    Funciona na Vercel, Netlify, Cloudflare, etc.
 */
async function callAI(prompt: string, systemPrompt: string): Promise<AIResult | null> {
  // Modo 1: Sandbox Z.ai (apenas se o pacote estiver instalado)
  if (process.env.NODE_ENV !== 'production') {
    try {
      // dynamic import para evitar erro de build na Vercel
      const ZAIModule: any = await import('z-ai-web-dev-sdk')
      const ZAI = ZAIModule.default
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        thinking: { type: 'disabled' },
      })
      const content = completion.choices?.[0]?.message?.content ?? ''
      const match = content.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
    } catch (err) {
      console.error('Z.ai SDK failed, falling back to OpenAI:', err)
    }
  }

  // Modo 2: OpenAI-compatible API (Vercel/produção)
  const apiBase = process.env.OPENAI_API_BASE || process.env.OPENAI_BASE_URL
  const apiKey = process.env.OPENAI_API_KEY
  if (apiBase && apiKey) {
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
      const res = await fetch(`${apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
        }),
      })
      if (!res.ok) {
        console.error('OpenAI API error:', res.status, await res.text())
        return null
      }
      const data = await res.json()
      const content = data.choices?.[0]?.message?.content ?? ''
      const match = content.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
    } catch (err) {
      console.error('OpenAI API failed:', err)
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SuggestPriceRequest
    const part = CAR_PARTS_BY_ID[body.partId]
    const color = PAINT_COLORS_BY_ID[body.corId]
    const servico = TIPOS_SERVICO.find((s) => s.id === body.tipoServico)
    if (!part || !color || !servico) {
      return NextResponse.json(
        { ok: false, error: 'Parâmetros inválidos.' },
        { status: 400 }
      )
    }

    // Preço simulado de referência (calculado localmente) — usado como fallback
    const referencia = Math.round(
      part.precoBase * servico.fatorMultiplicador * color.fatorPreco
    )

    const prompt = `Você é um orçamentista experiente em funilaria e pintura automotiva no Brasil.
Analise o cenário abaixo e sugestione um valor justo em reais (BRL) para o serviço.

Peça: ${part.nome}
Zona do veículo: ${part.zona}
Área relativa: ${part.area}/5
Complexidade: ${part.complexidade}/5
Serviço: ${servico.nome} — ${servico.descricao}
Cor: ${color.nome} (${color.acabamento}) — ${color.descricao}
Veículo: ${body.veiculo || 'Genérico popular'}
Observações do cliente: ${body.observacoes || 'Nenhuma'}

Considerando:
- Mão de obra (preparação, fundo, base colorida, verniz, polimento final)
- Materiais (lixa, massa, primer, tinta base, verniz, thinner)
- Dificuldade da peça (curvas, bordas, áreas de difícil acesso)
- Tipo de acabamento (sólida é mais barata; perolizada e efeito são mais caras)
- Mercado brasileiro (valores 2024/2025, em R$)

Responda SOMENTE em JSON válido no formato:
{
  "preco_sugerido": <número inteiro em R$>,
  "justificativa": "<explicação curta, 1-2 frases, em português>",
  "faixa_minima": <número>,
  "faixa_maxima": <número>,
  "confianca": "alta" | "media" | "baixa"
}
Não inclua nenhum texto fora do JSON. Não use markdown.`

    const systemPrompt =
      'Você é um orçamentista sênior de funilaria e pintura automotiva. Responde SOMENTE JSON válido.'

    const aiResult = await callAI(prompt, systemPrompt)

    if (aiResult && typeof aiResult.preco_sugerido === 'number') {
      return NextResponse.json({
        ok: true,
        source: 'ai',
        preco: Math.max(50, Math.round(aiResult.preco_sugerido)),
        justificativa: aiResult.justificativa || '',
        faixa: {
          minima: aiResult.faixa_minima ?? Math.round(aiResult.preco_sugerido * 0.9),
          maxima: aiResult.faixa_maxima ?? Math.round(aiResult.preco_sugerido * 1.1),
        },
        confianca: aiResult.confianca || 'media',
        referencia,
      })
    }

    // Fallback: simulação local
    const variacao = 0.92 + Math.random() * 0.18 // ±8%
    const preco = Math.round(referencia * variacao)
    return NextResponse.json({
      ok: true,
      source: 'simulado',
      preco,
      justificativa: `${servico.nome} em ${color.nome} (${color.acabamento}) para ${part.nome}. Preço de mercado baseado em área e complexidade da peça.`,
      faixa: {
        minima: Math.round(preco * 0.9),
        maxima: Math.round(preco * 1.1),
      },
      confianca: 'media',
      referencia,
    })
  } catch (err) {
    console.error('suggest-price error:', err)
    return NextResponse.json(
      { ok: false, error: 'Erro ao processar sugestão de preço.' },
      { status: 500 }
    )
  }
}
