import { NextRequest, NextResponse } from 'next/server'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const SYSTEM_PROMPT = `Você é o Agente Virtual da Cel-Car.

Especialidades:
- Funilaria
- Pintura automotiva
- Polimento
- Recuperação de veículos sinistrados

Regras:
- Seja educado.
- Responda de forma curta.
- Incentive o cliente a enviar fotos do veículo.
- Nunca invente preços.
- Se não souber a resposta, encaminhe para um atendente humano.

Informações da empresa:
- Nome: Cel-Car — Funilaria e Pintura
- CNPJ: 35.497.152/0001-26
- Telefone/WhatsApp: (21) 97708-6841
- E-mail: celio_e_v@hotmail.com
- Endereço: Rua José dos Reis, 2047 — Inhaúma, Rio de Janeiro/RJ — CEP 20760-245

Exemplo:
Cliente: Preciso de orçamento
Resposta: Olá! Envie fotos do veículo e uma descrição dos danos para avaliarmos.`

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { messages: ChatMessage[] }
    const messages = body.messages || []
    if (messages.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Mensagem vazia.' },
        { status: 400 }
      )
    }

    // Adiciona o prompt de sistema no início
    const fullMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ]

    let assistantContent: string | null = null

    // Modo 1: Sandbox Z.ai
    if (process.env.NODE_ENV !== 'production') {
      try {
        const ZAIModule: any = await import('z-ai-web-dev-sdk')
        const ZAI = ZAIModule.default
        const zai = await ZAI.create()
        const completion = await zai.chat.completions.create({
          messages: fullMessages,
          temperature: 0.6,
          thinking: { type: 'disabled' },
        })
        assistantContent = completion.choices?.[0]?.message?.content ?? ''
      } catch (err) {
        console.error('Z.ai chat failed:', err)
      }
    }

    // Modo 2: OpenAI-compatible (produção)
    if (!assistantContent) {
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
              temperature: 0.6,
              messages: fullMessages,
            }),
          })
          if (res.ok) {
            const data = await res.json()
            assistantContent = data.choices?.[0]?.message?.content ?? ''
          }
        } catch (err) {
          console.error('OpenAI chat failed:', err)
        }
      }
    }

    if (assistantContent) {
      return NextResponse.json({
        ok: true,
        source: 'ai',
        content: assistantContent,
      })
    }

    // Fallback: respostas pré-programadas baseadas em palavras-chave
    const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || ''
    let fallback = 'Desculpe, não consegui processar sua mensagem agora. Para atendimento imediato, chame no WhatsApp: (21) 97708-6841.'

    if (lastUserMsg.includes('orçamento') || lastUserMsg.includes('orcamento') || lastUserMsg.includes('preço') || lastUserMsg.includes('preco')) {
      fallback = 'Olá! Para um orçamento preciso, envie fotos do veículo e uma descrição dos danos. Você também pode usar nosso app de orçamento em https://cel-car.vercel.app/ ou chamar no WhatsApp (21) 97708-6841.'
    } else if (lastUserMsg.includes('endereço') || lastUserMsg.includes('endereco') || lastUserMsg.includes('onde fica') || lastUserMsg.includes('localização')) {
      fallback = 'Estamos na Rua José dos Reis, 2047 — Inhaúma, Rio de Janeiro/RJ — CEP 20760-245. Te esperamos!'
    } else if (lastUserMsg.includes('horário') || lastUserMsg.includes('horario') || lastUserMsg.includes('aberto') || lastUserMsg.includes('funcionamento')) {
      fallback = 'Funcionamos de segunda a sexta, das 8h às 18h, e sábado das 8h às 12h. Para confirmar, chame no WhatsApp (21) 97708-6841.'
    } else if (lastUserMsg.includes('whatsapp') || lastUserMsg.includes('telefone') || lastUserMsg.includes('contato')) {
      fallback = 'Pode nos chamar no WhatsApp: (21) 97708-6841 ou pelo e-mail: celio_e_v@hotmail.com. Estamos à disposição!'
    } else if (lastUserMsg.includes('olá') || lastUserMsg.includes('ola') || lastUserMsg.includes('bom dia') || lastUserMsg.includes('boa tarde') || lastUserMsg.includes('boa noite')) {
      fallback = 'Olá! Bem-vindo à Cel-Car — Funilaria e Pintura! Como posso ajudar? Você pode enviar fotos do veículo e descrever os danos para um orçamento.'
    } else if (lastUserMsg.includes('pintura') || lastUserMsg.includes('funilaria') || lastUserMsg.includes('polimento')) {
      fallback = 'Trabalhamos com funilaria, pintura automotiva, polimento e recuperação de veículos sinistrados. Para avaliar seu caso, envie fotos do veículo e uma descrição dos danos.'
    } else {
      fallback = 'Recebi sua mensagem! Para um atendimento mais ágil, envie fotos do veículo e uma descrição dos danos. Ou chame um atendente humano no WhatsApp: (21) 97708-6841.'
    }

    return NextResponse.json({
      ok: true,
      source: 'fallback',
      content: fallback,
    })
  } catch (err) {
    console.error('chat error:', err)
    return NextResponse.json(
      { ok: false, error: 'Erro no processamento do chat.' },
      { status: 500 }
    )
  }
}
