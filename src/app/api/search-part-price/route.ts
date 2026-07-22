import { NextRequest, NextResponse } from 'next/server'

interface SearchPartPriceRequest {
  nome: string
  veiculo: string
  marca?: string
}

interface PartSearchResult {
  nome: string
  marca?: string
  fornecedor: string
  preco: number
  link?: string
}

/**
 * Pesquisa o preço de uma peça de reposição na internet.
 * Usa IA + web_search para encontrar valores reais de mercado no Brasil.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SearchPartPriceRequest
    if (!body.nome || !body.veiculo) {
      return NextResponse.json(
        { ok: false, error: 'Nome da peça e veículo são obrigatórios.' },
        { status: 400 }
      )
    }

    const prompt = `Pesquise o preço médio de mercado no Brasil (2024/2025) para a seguinte peça automotiva:

Peça: ${body.nome}
Veículo: ${body.veiculo}
${body.marca ? `Marca preferida: ${body.marca}` : ''}

Considere:
- Preços no Mercado Livre, WebMotors, lojas especializadas em autopeças
- Tanto peças originais (concessionária) quanto paralelas/nacionais
- Frete não inclusivo
- Condição nova (não usada)

Responda SOMENTE em JSON válido no formato:
{
  "resultados": [
    {
      "nome": "nome completo da peça encontrada",
      "marca": "fabricante (Original VW, Bosch, etc)",
      "fornecedor": "Mercado Livre / WebMotors / Loja X",
      "preco": <número inteiro em R$>,
      "link": "URL do anúncio (se disponível)"
    },
    ...até 3 resultados
  ],
  "preco_medio": <número inteiro em R$>,
  "recomendacao": "<1 frase curta em português>"
}
Não inclua nenhum texto fora do JSON. Não use markdown.`

    const systemPrompt =
      'Você é um especialista em autopeças no Brasil. Usa web_search quando disponível para encontrar preços reais. Responde SOMENTE JSON válido.'

    let aiResult: { resultados?: PartSearchResult[]; preco_medio?: number; recomendacao?: string } | null = null

    // Modo 1: Sandbox Z.ai (usa web_search nativo)
    if (process.env.NODE_ENV !== 'production') {
      try {
        const ZAIModule: any = await import('z-ai-web-dev-sdk')
        const ZAI = ZAIModule.default
        const zai = await ZAI.create()
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          thinking: { type: 'disabled' },
        })
        const content = completion.choices?.[0]?.message?.content ?? ''
        console.log('[search-part-price] Z.ai response content:', content.substring(0, 500))
        const match = content.match(/\{[\s\S]*\}/)
        if (match) {
          try {
            aiResult = JSON.parse(match[0])
            console.log('[search-part-price] Parsed AI result:', JSON.stringify(aiResult).substring(0, 300))
          } catch (parseErr) {
            console.error('[search-part-price] JSON parse failed:', parseErr)
          }
        }
      } catch (err) {
        console.error('Z.ai search failed:', err)
      }
    }

    // Modo 2: OpenAI-compatible (sem web_search, usa conhecimento do modelo)
    const apiBase = process.env.OPENAI_API_BASE || process.env.OPENAI_BASE_URL
    const apiKey = process.env.OPENAI_API_KEY
    if (!aiResult && apiBase && apiKey) {
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
            temperature: 0.4,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const content = data.choices?.[0]?.message?.content ?? ''
          const match = content.match(/\{[\s\S]*\}/)
          if (match) aiResult = JSON.parse(match[0])
        }
      } catch (err) {
        console.error('OpenAI search failed:', err)
      }
    }

    if (aiResult && (aiResult.resultados?.length || aiResult.preco_medio)) {
      return NextResponse.json({
        ok: true,
        source: 'ai',
        resultados: aiResult.resultados ?? [],
        precoMedio: aiResult.preco_medio ?? 0,
        recomendacao: aiResult.recomendacao ?? '',
      })
    }

    // Fallback: estimativa simulada (sem internet)
    const base = estimarPrecoBase(body.nome)
    const variacao = 0.9 + Math.random() * 0.3
    const precoSimulado = Math.round(base * variacao)
    return NextResponse.json({
      ok: true,
      source: 'simulado',
      resultados: [
        {
          nome: `${body.nome} (paralelo nacional)`,
          marca: 'Paralelo',
          fornecedor: 'Loja de autopeças',
          preco: Math.round(precoSimulado * 0.7),
        },
        {
          nome: `${body.nome} (semiariginal)`,
          marca: body.marca || 'Nacional',
          fornecedor: 'Mercado Livre (estimado)',
          preco: precoSimulado,
        },
        {
          nome: `${body.nome} (original)`,
          marca: body.marca || 'Original',
          fornecedor: 'Concessionária (estimado)',
          preco: Math.round(precoSimulado * 1.6),
        },
      ],
      precoMedio: precoSimulado,
      recomendacao: 'Valores estimados. Para pesquisa real, configure OPENAI_API_KEY na Vercel.',
    })
  } catch (err) {
    console.error('search-part-price error:', err)
    return NextResponse.json(
      { ok: false, error: 'Erro ao pesquisar preço da peça.' },
      { status: 500 }
    )
  }
}

// Estimativa base para fallback (quando não há IA configurada)
function estimarPrecoBase(nome: string): number {
  const n = nome.toLowerCase()
  if (n.includes('para-choque') || n.includes('para choque') || n.includes('parachoque')) return 850
  if (n.includes('capô') || n.includes('capo')) return 1200
  if (n.includes('porta')) return 950
  if (n.includes('retrovisor') || n.includes('espelho')) return 180
  if (n.includes('farol')) return 650
  if (n.includes('lanterna')) return 280
  if (n.includes('grade')) return 220
  if (n.includes('teto')) return 1500
  if (n.includes('vidro')) return 480
  if (n.includes('pneu') || n.includes('pneus')) return 380
  if (n.includes('roda')) return 320
  if (n.includes('parabrisa') || n.includes('para-brisa')) return 850
  return 450
}
