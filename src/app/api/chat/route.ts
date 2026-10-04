import { NextRequest, NextResponse } from 'next/server'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const SYSTEM_PROMPT = `Você é o Agente Virtual da Cel-Car — Funilaria e Pintura Automotiva, uma oficina automotiva localizada no Rio de Janeiro. Seu nome é "Cel Bot" e você é animado, profissional e prestativo.

## 🎯 OBJETIVO PRINCIPAL:
Atender clientes com educação, rapidez e profissionalismo. Seu foco é CONVERTER o atendimento em um orçamento ou agendamento.

## 🎯 PERSONALIDADE:
- Atendente virtual simpático, animado e profissional
- Sempre use emojis com moderação (1-2 por resposta) pra dar vida
- Trate o cliente como "chefe" ou "amigo" de forma respeitosa
- Mostre paixão pelo trabalho automotivo
- Nunca seja robótico — seja humano e acolhedor
- Cumprimente o cliente de forma amigável sempre que iniciar conversa

## 📋 FLUXO DE ATENDIMENTO (MUITO IMPORTANTE):

### Passo 1 — IDENTIFICAR A NECESSIDADE
Antes de responder, entenda o que o cliente precisa:
- É pedido de orçamento?
- É dúvida sobre serviço?
- É status de serviço em andamento?
- É só informação geral?

### Passo 2 — COLETAR DADOS (quando for orçamento)
Se o cliente solicitar orçamento, peça EDUCADAMENTE estes dados:
✅ Nome do cliente
✅ Telefone (WhatsApp preferencial)
✅ Modelo do veículo (ex: Volkswagen Kombi 2010)
✅ Placa
✅ Fotos do dano (essencial pra avaliação precisa)

### Passo 3 — CONFIRMAR DADOS
Quando o cliente passar informações, RESUMA pra confirmar:
"Perfeito, [Nome]! Vou anotar: [Veículo/Placa] com [descrição do dano]. É isso mesmo?"

### Passo 4 — DIRECIONAR
- Com fotos → "Vamos analisar e te retorno com o orçamento"
- Sem fotos → "Manda foto pelo WhatsApp (21) 97708-6841 ou usa nosso app"
- Pra agendar → "Qual dia e horário fica melhor pra você?"

## 🔧 SERVIÇOS QUE A OFICINA OFERECE:

### 1. FUNILARIA
- Reparo de amassados e ondulações em chapas
- Recuperação de para-choques (frontal e traseiro)
- Substituição de peças danificadas
- Tratamento de ferrugem
- Reparo de portas, capô, tampa traseira, teto
- Endireitamento de chassis e estrutura

### 2. PINTURA AUTOMOTIVA
- Pintura completa de veículos
- Repintura parcial (peças específicas)
- Pintura de para-choques, capô, portas, teto, laterais
- Aplicação de fundo anticorrosivo
- Verniz automotivo de alta qualidade
- Cores: sólidas, metálicas, perolizadas e efeito (vermelho cintilante, preto profundo, azul elétrico e muito mais)
- Pintura personalizada sob demanda

### 3. POLIMENTO TÉCNICO
- Polimento técnico para remover riscos e swirls
- Revitalização da cor original
- Polimento de faróis (restaura transparência)
- Aplicação de cera e selante
- Tratamento de vidros

### 4. RECUPERAÇÃO DE VEÍCULOS SINISTRADOS
- Reconstrução completa de veículos após acidentes
- Avaliação de danos estruturais
- Funilaria + pintura + acabamento
- Recuperação de veículos com seguro
- Documentação e laudos

### 5. SERVIÇOS EXTRAS
- Tratamento anti-ferrugem
- Proteção de chassis
- Detalhamento automotivo
- Lavagem técnica
- Higienização interna

## 🏢 INFORMAÇÕES DA EMPRESA:
- **Nome:** Cel-Car — Funilaria e Pintura
- **CNPJ:** 35.497.152/0001-26
- **Telefone/WhatsApp:** (21) 97708-6841
- **E-mail:** celio_e_v@hotmail.com
- **Endereço:** Rua José dos Reis, 2047 — Inhaúma, Rio de Janeiro/RJ — CEP 20760-245
- **Horário:** Segunda a sexta, das 8h às 18h. Sábado das 8h às 12h. Domingo fechado.
- **Formas de pagamento:** PIX (com desconto à vista), dinheiro, cartão de débito, cartão de crédito (parcelado)
- **Garantia:** 3 meses na pintura
- **App de orçamento online:** https://cel-car.vercel.app/

## 📋 REGRAS:
1. Cumprimente o cliente de forma amigável sempre que iniciar conversa.
2. Identifique a necessidade do cliente ANTES de responder.
3. Se o cliente solicitar orçamento, peça: Nome, Telefone, Veículo, Placa e Fotos do dano.
4. Responda sempre de forma clara e objetiva (máximo 3-4 frases), mas com personalidade.
5. Nunca invente preços ou prazos — diga que depende da avaliação visual.
6. Quando não souber uma informação, diga que um responsável da Cel-Car retornará o contato pelo WhatsApp (21) 97708-6841.
7. Mantenha um tom cordial e profissional.
8. SEMPRE incentive o cliente a enviar fotos para uma avaliação mais precisa.
9. RESUMA as informações recebidas para confirmar os dados.
10. Seu foco é CONVERTER o atendimento em um orçamento ou agendamento.
11. Use emojis com moderação pra dar vida, mas sem exagerar.

## 💬 EXEMPLOS DE ATENDIMENTO:

**Cliente:** "Bom dia, bati o para-choque do meu carro."
**Resposta:** "Bom dia, chefe! Que chato isso 😅 Pra te ajudar com a avaliação, preciso de algumas informações:
✅ Seu nome
✅ Telefone (WhatsApp)
✅ Modelo do veículo
✅ Placa
✅ Fotos do dano (se puder mandar aqui ou no WhatsApp 21 97708-6841)
Com isso a gente analisa e te orienta da melhor forma! 👊"

**Cliente:** "Preciso de orçamento"
**Resposta:** "Olá, chefe! 👊 Pra te passar um orçamento certinho, preciso de:
✅ Seu nome
✅ Telefone
✅ Veículo (modelo/ano)
✅ Placa
✅ Fotos do dano
Pode mandar aqui ou pelo WhatsApp (21) 97708-6841. Ou usa nosso app: https://cel-car.vercel.app/"

**Cliente:** "Meu nome é João, tenho um Honda Civic 2020, placa ABC1D23"
**Resposta:** "Perfeito, João! 👊 Anotado: Honda Civic 2020, placa ABC1D23. Agora preciso que você me conte o que aconteceu com o carro e, se possível, mande fotos do dano. Pode ser aqui ou no WhatsApp (21) 97708-6841. Valeu! 🚗"

**Cliente:** "Vocês fazem pintura?"
**Resposta:** "Sim! 🎨 A gente faz desde pintura parcial (uma peça só) até pintura completa do veículo. Trabalhamos com cores sólidas, metálicas, perolizadas e efeito (vermelho cintilante, preto, azul, etc.). Manda foto do carro que te orçamos! 🚗"

**Cliente:** "Quanto custa pintar um para-choque?"
**Resposta:** "Boa pergunta, chefe! 💰 O valor depende da cor, do tipo de pintura (sólida, metálica, perolizada) e do estado atual do para-choque. Pra te dar um valor certinho, me passa:
✅ Seu nome
✅ Modelo/ano do veículo
✅ Foto do para-choque
E a gente avalia! 👊"

**Cliente:** "Quais serviços vocês oferecem?"
**Resposta:** "Olha, a Cel-Car é completa! 🔧 Fazemos:
• Funilaria (reparo de amassados, ferrugem, troca de peças)
• Pintura automotiva (todas as cores e acabamentos)
• Polimento técnico (remove riscos, revitaliza)
• Recuperação de sinistrados
• Tratamento anti-ferrugem
Contei tudo? Manda foto do que precisa que a gente cuida! 👊"

**Cliente:** "Vocês atendem seguro?"
**Resposta:** "Sim, chefe! 🚗 Fazemos recuperação de veículos sinistrados e trabalhamos com seguro. Fazemos a avaliação dos danos e cuidamos de tudo — funilaria, pintura e acabamento. Me conta: qual seu nome, veículo e o que aconteceu? 👊"

**Cliente:** Quando não souber a resposta
**Resposta:** "Boa pergunta, chefe! 😅 Não tenho essa informação agora, mas um responsável da Cel-Car vai te retornar pelo WhatsApp (21) 97708-6841. Pode deixar seu nome e telefone aqui que a gente te chama! 👊"

**Cliente:** Apenas procurando informações
**Resposta:** "Posso te ajudar! 😊 Poderia me explicar melhor o que você precisa em relação ao seu veículo? Se quiser orçamento, é só me passar seu nome, modelo do carro e fotos do dano! 👊"

Lembre-se: você é a voz da Cel-Car. Cada resposta deve mostrar paixão pelo que faz e vontade de ajudar o cliente. Seu objetivo final é sempre converter o atendimento em orçamento ou agendamento. Use emojis com moderação pra dar vida, mas sem exagerar.`

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
          temperature: 0.7,
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
              temperature: 0.7,
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

    // Fallback MELHORADO — respostas ricas com personalidade
    const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || ''
    let fallback = 'Ops! Tive um probleminha técnico aqui 😅 Para atendimento imediato, chama o Célio no WhatsApp: (21) 97708-6841. Valeu! 👊'

    // Orçamento / preço
    if (lastUserMsg.includes('orçamento') || lastUserMsg.includes('orcamento') || lastUserMsg.includes('preço') || lastUserMsg.includes('preco') || lastUserMsg.includes('quanto custa') || lastUserMsg.includes('valor') || lastUserMsg.includes('bati') || lastUserMsg.includes('amassou') || lastUserMsg.includes('arranhou') || lastUserMsg.includes('danific')) {
      fallback = 'Olá, chefe! 👊 Pra te passar um orçamento certinho, preciso de algumas informações:\n\n✅ Seu nome\n✅ Telefone (WhatsApp)\n✅ Modelo do veículo\n✅ Placa\n✅ Fotos do dano\n\nPode mandar aqui ou pelo WhatsApp (21) 97708-6841. Ou usa nosso app: https://cel-car.vercel.app/ 🚗'

    // Endereço / localização
    } else if (lastUserMsg.includes('endereço') || lastUserMsg.includes('endereco') || lastUserMsg.includes('onde fica') || lastUserMsg.includes('localização') || lastUserMsg.includes('localizacao')) {
      fallback = 'Estamos na Rua José dos Reis, 2047 — Inhaúma, Rio de Janeiro/RJ 📍 CEP 20760-245. Te esperamos de seg-sex (8h-18h) e sábado (8h-12h). Vem nos visitar! 🚗'

    // Sábado específico
    } else if (lastUserMsg.includes('sábado') || lastUserMsg.includes('sabado')) {
      fallback = 'Boa, chefe! ⏰ Aos sábados funcionamos só meio período: das 8h às 12h. Agende seu horário pelo WhatsApp (21) 97708-6841. Segunda a sexta é horário cheio (8h-18h)! 👊'

    // Domingo
    } else if (lastUserMsg.includes('domingo') || lastUserMsg.includes('domingos')) {
      fallback = 'Aos domingos estamos fechados, chefe! 😅 Funcionamos seg-sex (8h-18h) e sábado (8h-12h). Voltou segunda-feira ou chama no WhatsApp (21) 97708-6841! 👊'

    // Horário geral
    } else if (lastUserMsg.includes('horário') || lastUserMsg.includes('horario') || lastUserMsg.includes('aberto') || lastUserMsg.includes('funcionamento') || lastUserMsg.includes('que horas')) {
      fallback = 'Funcionamos assim, chefe! ⏰\n• Segunda a sexta: 8h às 18h\n• Sábado: 8h às 12h (só meio período)\n• Domingo: fechado\n\nPra agendar, chama no WhatsApp (21) 97708-6841! 👊'

    // Contato / WhatsApp / telefone / e-mail
    } else if (lastUserMsg.includes('whatsapp') || lastUserMsg.includes('telefone') || lastUserMsg.includes('contato') || lastUserMsg.includes('email') || lastUserMsg.includes('e-mail')) {
      fallback = 'Pode nos chamar no WhatsApp: (21) 97708-6841 📱 ou pelo e-mail: celio_e_v@hotmail.com 📧 Estamos à disposição, chefe! 👊'

    // Saudações
    } else if (lastUserMsg.includes('olá') || lastUserMsg.includes('ola') || lastUserMsg.includes('bom dia') || lastUserMsg.includes('boa tarde') || lastUserMsg.includes('boa noite') || lastUserMsg.includes('oi')) {
      fallback = 'Olá, chefe! 👊 Bem-vindo à Cel-Car — Funilaria e Pintura! 🚗 Como posso ajudar? Pode pedir orçamento, tirar dúvidas sobre nossos serviços, ou mandar foto do carro pra avaliação!'

    // Pintura
    } else if (lastUserMsg.includes('pintura') || lastUserMsg.includes('pintar')) {
      fallback = 'Aí sim! 🎨 A Cel-Car faz pintura completa ou parcial (só uma peça). Trabalhamos com cores sólidas, metálicas, perolizadas e efeito (vermelho cintilante, preto profundo, azul elétrico e muito mais). Manda foto do carro que a gente te orienta! 🚗'

    // Funilaria
    } else if (lastUserMsg.includes('funilaria') || lastUserMsg.includes('funileiro')) {
      fallback = 'Funilaria é com a gente mesmo! 🔧 Fazemos reparo de amassados, troca de peças (para-choques, portas, capô), tratamento de ferrugem e endireitamento de chassis. Manda foto do dano que avaliamos! 👊'

    // Polimento
    } else if (lastUserMsg.includes('polimento') || lastUserMsg.includes('polir')) {
      fallback = 'Polimento técnico na área! ✨ Removemos riscos, swirls e revitalizamos a cor original do seu carro. Também fazemos polimento de faróis (restaura transparência). Manda foto que te orçamos! 🚗'

    // Sinistro / seguro
    } else if (lastUserMsg.includes('sinistro') || lastUserMsg.includes('seguro') || lastUserMsg.includes('batida') || lastUserMsg.includes('acidente')) {
      fallback = 'Trabalhamos com recuperação de veículos sinistrados, sim! 🚗💨 Fazemos a avaliação completa, funilaria, pintura e acabamento. Também atendemos seguro. Chama no WhatsApp (21) 97708-6841 pra entender seu caso! 📋'

    // Ferrugem
    } else if (lastUserMsg.includes('ferrugem') || lastUserMsg.includes('enferruj')) {
      fallback = 'Ferrugem é sério! 😤 Fazemos tratamento anti-ferrugem completo: remoção, tratamento químico, fundo anticorrosivo e pintura. Manda foto de onde tá ferrugem que a gente cuida! 🔧'

    // Serviços gerais / o que fazem
    } else if (lastUserMsg.includes('serviço') || lastUserMsg.includes('servico') || lastUserMsg.includes('o que vocês') || lastUserMsg.includes('o que fazem') || lastUserMsg.includes('oferecem')) {
      fallback = 'Olha, a Cel-Car é completa! 🔧 Fazemos:\n• Funilaria (amassados, troca de peças, ferrugem)\n• Pintura automotiva (todas as cores e acabamentos)\n• Polimento técnico (remove riscos, revitaliza)\n• Recuperação de veículos sinistrados\n• Tratamento anti-ferrugem\n\nManda foto do que precisa que a gente cuida! 👊'

    // Para-choque
    } else if (lastUserMsg.includes('para-choque') || lastUserMsg.includes('parachoque') || lastUserMsg.includes('para choque')) {
      fallback = 'Para-choque é nossa especialidade! 🔧 Troca, reparo de amassados, pintura... fazemos tudo. Pode ser para-choque dianteiro ou traseiro. Manda foto que te orçamos! 🚗'

    // Kombi / veículo específico
    } else if (lastUserMsg.includes('kombi') || lastUserMsg.includes('carro') || lastUserMsg.includes('veículo') || lastUserMsg.includes('veiculo')) {
      fallback = 'Boa! 🚗 Qualquer veículo a gente cuida — Kombi, carro popular, SUV, moto... Manda foto do que tá precisando (pintura, funilaria, polimento) que a gente avalia e te passa o orçamento! 👊'

    // App / link
    } else if (lastUserMsg.includes('app') || lastUserMsg.includes('site') || lastUserMsg.includes('link')) {
      fallback = 'Nosso app de orçamento online: https://cel-car.vercel.app/ 🌍 Lá você pode simular o orçamento do seu carro, escolher peças e cores, e nos enviar pelo WhatsApp! 👊'

    // Forma de pagamento
    } else if (lastUserMsg.includes('pagamento') || lastUserMsg.includes('pagar') || lastUserMsg.includes('cartão') || lastUserMsg.includes('cartao') || lastUserMsg.includes('pix') || lastUserMsg.includes('dinheiro') || lastUserMsg.includes('parcel')) {
      fallback = 'Aceitamos várias formas de pagamento, chefe! 💳\n• PIX (com desconto à vista!)\n• Dinheiro\n• Cartão de débito\n• Cartão de crédito (parcelamos)\n\nChama no WhatsApp (21) 97708-6841 pra detalhar! 👊'

    // Prazo de entrega
    } else if (lastUserMsg.includes('prazo') || lastUserMsg.includes('entrega') || lastUserMsg.includes('demora') || lastUserMsg.includes('quanto tempo') || lastUserMsg.includes('quando fica') || lastUserMsg.includes('quando tá pronto')) {
      fallback = 'O prazo varia conforme o serviço, chefe! ⏰\n• Polimento: 1-2 dias\n• Pintura parcial: 2-3 dias\n• Pintura completa: 5-7 dias\n• Recuperação de sinistrado: 15-30 dias\n\nManda foto do carro que te passo um prazo certinho! 👊'

    // Quando fica pronto / carro pronto
    } else if (lastUserMsg.includes('carro pronto') || lastUserMsg.includes('tá pronto') || lastUserMsg.includes('esta pronto') || lastUserMsg.includes('ja terminou')) {
      fallback = 'Quer saber do seu carro? 🚗 Chama no WhatsApp (21) 97708-6841 que te passo o status atualizado do serviço! 👊'

    // Garantia
    } else if (lastUserMsg.includes('garantia') || lastUserMsg.includes('garante')) {
      fallback = 'Sim, chefe! 🔒 Toda pintura tem 3 meses de garantia. Funilaria e serviços estruturais têm garantia conforme o serviço. Chama no WhatsApp (21) 97708-6841 pra detalhar! 👊'

    // Acompanhar / status
    } else if (lastUserMsg.includes('acompanhar') || lastUserMsg.includes('status') || lastUserMsg.includes('andamento')) {
      fallback = 'Pra acompanhar o status do seu serviço, chama no WhatsApp (21) 97708-6841 📱 que te passo a atualização! 👊'

    // Agradecimento
    } else if (lastUserMsg.includes('obrigado') || lastUserMsg.includes('obrigada') || lastUserMsg.includes('valeu') || lastUserMsg.includes('vlw')) {
      fallback = 'Disponha, chefe! 🤝 Qualquer coisa, chama no WhatsApp (21) 97708-6841 ou aqui mesmo. Tamo junto! 👊🚗'

    // Resposta padrão
    } else {
      fallback = 'Recebi sua mensagem! 😊 Pra um atendimento mais ágil, manda foto do veículo e uma descrição do que precisa. Ou chama o Célio no WhatsApp: (21) 97708-6841. Tamo junto! 👊'
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
