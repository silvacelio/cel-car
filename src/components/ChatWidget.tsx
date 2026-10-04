'use client'

import * as React from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2, Paperclip, Camera, ImageIcon, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  photo?: string // data URL
}

interface CollectedData {
  nome?: string
  telefone?: string
  veiculo?: string
  placa?: string
  hasPhotos: boolean
  photoCount: number
}

const WHATSAPP_NUMBER = '5521977086841'

export function ChatWidget() {
  const [open, setOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Bem-vindo à Cel-Car — Funilaria e Pintura! 🚗\n\nComo posso ajudar? Você pode:\n• Pedir um orçamento\n• Enviar fotos do veículo 📸 (clipe ao lado)\n• Tirar dúvidas sobre nossos serviços',
    },
  ])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [photos, setPhotos] = React.useState<string[]>([]) // fotos coletadas para o orçamento
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Detecta dados coletados nas mensagens do usuário
  const collectedData: CollectedData = React.useMemo(() => {
    const userText = messages
      .filter((m) => m.role === 'user' && !m.photo)
      .map((m) => m.content)
      .join(' ')

    const data: CollectedData = {
      hasPhotos: photos.length > 0,
      photoCount: photos.length,
    }

    // Nome — procura por "meu nome é X" ou "sou o X" ou "sou a X"
    const nomeMatch = userText.match(/(?:meu nome é|me chamo|sou o|sou a|nome:?\s*)([a-záàâãéêíóôõúç]+\s*[a-záàâãéêíóôõúç]+)/i)
    if (nomeMatch) data.nome = nomeMatch[1].trim()

    // Telefone — procura por números com 8+ dígitos
    const telMatch = userText.match(/(?:telefone|tel|whatsapp|wpp|celular|contato)[:\s]*([0-9()\-\s]{8,})/i)
    if (telMatch) {
      const cleaned = telMatch[1].replace(/\D/g, '')
      if (cleaned.length >= 8) data.telefone = cleaned
    }
    // Também procura por padrão (21) 9XXXX-XXXX
    if (!data.telefone) {
      const telMatch2 = userText.match(/\(?(\d{2})\)?\s?9?(\d{4})-?(\d{4})/)
      if (telMatch2) data.telefone = `${telMatch2[1]}9${telMatch2[2]}${telMatch2[3]}`.replace(/\D/g, '')
    }

    // Placa — Mercosul ou antiga
    const placaMatch = userText.match(/\b([a-z]{3}[\s\-]?0-9][a-z0-9]{2}|[a-z]{3}[\s\-]?\d{4})\b/i)
    if (placaMatch) data.placa = placaMatch[1].toUpperCase().replace(/\s/g, '')

    // Veículo — procura por "tenho um X" ou "carro X" ou marcas conhecidas
    const veiculoMatch = userText.match(/(?:tenho um|tenho uma|meu carro é|minha moto é|carro:?\s*)([a-z0-9áàâãéêíóôõúç\s\-]{3,40})/i)
    if (veiculoMatch) {
      const v = veiculoMatch[1].trim()
      // Filtra pra não pegar frases longas demais
      if (v.length < 50 && !v.includes('foto') && !v.includes('danificado')) {
        data.veiculo = v
      }
    }
    // Marcas conhecidas
    if (!data.veiculo) {
      const marcas = ['honda', 'toyota', 'volkswagen', 'vw', 'chevrolet', 'fiat', 'ford', 'hyundai', 'kia', 'renault', 'nissan', 'citroen', 'peugeot', 'kombi', 'civic', 'corolla', 'gol', 'onix', 'palio', 'ka', 'hb20']
      for (const marca of marcas) {
        if (userText.toLowerCase().includes(marca)) {
          // Pega 30 chars ao redor da marca
          const idx = userText.toLowerCase().indexOf(marca)
          const start = Math.max(0, idx - 5)
          const end = Math.min(userText.length, idx + 35)
          data.veiculo = userText.substring(start, end).trim()
          break
        }
      }
    }

    return data
  }, [messages, photos])

  // Dados completos?
  const allDataCollected = collectedData.nome && collectedData.veiculo && collectedData.hasPhotos

  const resizeImage = (file: File, maxSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Canvas context not available'))
            return
          }
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }
        img.onerror = reject
        img.src = reader.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newPhotos: string[] = []
    for (const file of Array.from(files).slice(0, 5 - photos.length)) {
      if (!file.type.startsWith('image/')) continue
      try {
        const resized = await resizeImage(file, 800)
        newPhotos.push(resized)
      } catch (e) {
        console.error('Erro ao processar foto:', e)
      }
    }
    if (newPhotos.length === 0) return

    const updatedPhotos = [...photos, ...newPhotos]
    setPhotos(updatedPhotos)

    // Adiciona cada foto como mensagem do usuário
    for (const p of newPhotos) {
      setMessages((prev) => [...prev, { role: 'user', content: '', photo: p }])
    }

    // Bot responde confirmando
    await new Promise((r) => setTimeout(r, 500))
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content:
          updatedPhotos.length === 1
            ? 'Foto recebida! 📸 Consegui ver o dano. Pra complementar o orçamento, me conta:\n✅ Seu nome\n✅ Telefone (WhatsApp)\n✅ Modelo e ano do veículo\n✅ Placa\n\nPode mandar mais fotos também se precisar (clipe ao lado)! 👊'
            : `Mais ${newPhotos.length} foto(s) recebida(s)! 📸 Total: ${updatedPhotos.length} foto(s). Continua mandando se precisar, ou me passa seus dados (nome, telefone, veículo, placa) pra fechar o orçamento! 👊`,
      },
    ])
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.content },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Desculpe, tive um problema técnico. Chame no WhatsApp (21) 97708-6841.',
          },
        ])
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Não consegui responder agora. Para atendimento imediato, WhatsApp: (21) 97708-6841.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Envia o resumo completo pro WhatsApp da Cel-Car
  const sendToWhatsApp = () => {
    const lines: string[] = []
    lines.push('Olá Cel-Car! Peguei os dados do cliente pelo Agente Virtual:')
    lines.push('')
    lines.push(`👤 Nome: ${collectedData.nome || '-'}`)
    lines.push(`📞 Telefone: ${collectedData.telefone || '-'}`)
    lines.push(`🚗 Veículo: ${collectedData.veiculo || '-'}`)
    lines.push(`🏷️ Placa: ${collectedData.placa || '-'}`)
    lines.push(`📸 Fotos enviadas: ${collectedData.photoCount}`)
    lines.push('')
    // Adiciona trecho da conversa
    const conversa = messages
      .filter((m) => m.role === 'user' && !m.photo && m.content)
      .map((m) => m.content)
      .join(' | ')
    if (conversa) {
      lines.push(`📝 Descrição do cliente: ${conversa.substring(0, 300)}`)
    }
    lines.push('')
    lines.push('Por favor, entrem em contato comigo pra agendar!')

    const msg = lines.join('\n')
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform no-print',
          open && 'rotate-90'
        )}
        aria-label={open ? 'Fechar chat' : 'Abrir chat'}
        title="Fale com o Agente Virtual Cel-Car"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
          </span>
        )}
      </button>

      {/* Janela do chat */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[28rem] sm:h-[32rem] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden no-print">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">Agente Virtual Cel-Car</div>
              <div className="text-[10px] opacity-90 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                Online agora
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-primary-foreground/20"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mensagens */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto fancy-scroll p-3 space-y-3 bg-background"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex gap-2',
                  msg.role === 'user' && 'flex-row-reverse'
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    msg.role === 'assistant'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm max-w-[80%] space-y-2',
                    msg.role === 'assistant'
                      ? 'bg-muted text-foreground'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  {msg.photo && (
                    <img
                      src={msg.photo}
                      alt="Foto enviada"
                      className="rounded-md max-w-full max-h-48 object-cover border border-border/30"
                    />
                  )}
                  {msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-lg px-3 py-2 text-sm bg-muted flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs text-muted-foreground">digitando...</span>
                </div>
              </div>
            )}

            {/* Card de dados coletados */}
            {(collectedData.nome || collectedData.veiculo || collectedData.hasPhotos) && (
              <div className="rounded-md border border-primary/30 bg-primary/5 p-2 space-y-1">
                <div className="text-[10px] uppercase text-muted-foreground tracking-wide flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" /> Dados do orçamento
                </div>
                <div className="text-[11px] space-y-0.5 text-foreground/80">
                  {collectedData.nome && <div>👤 {collectedData.nome}</div>}
                  {collectedData.telefone && <div>📞 {collectedData.telefone}</div>}
                  {collectedData.veiculo && <div>🚗 {collectedData.veiculo}</div>}
                  {collectedData.placa && <div>🏷️ {collectedData.placa}</div>}
                  {collectedData.hasPhotos && <div>📸 {collectedData.photoCount} foto(s)</div>}
                </div>
                {allDataCollected && (
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs mt-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={sendToWhatsApp}
                  >
                    <Send className="h-3 w-3 mr-1" /> Enviar pro WhatsApp da Cel-Car
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-2 border-t border-border bg-card flex gap-1 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={(e) => handlePhotoUpload(e.target.files)}
              className="hidden"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || photos.length >= 5}
              title={photos.length >= 5 ? 'Máximo de 5 fotos' : 'Enviar fotos do veículo'}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              disabled={loading}
              className="h-9 text-sm flex-1"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="h-9 w-9 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Rodapé */}
          <div className="px-3 py-1 bg-muted/50 text-[9px] text-center text-muted-foreground border-t border-border">
            {photos.length > 0 ? (
              <span className="flex items-center justify-center gap-1">
                <Camera className="h-2.5 w-2.5" /> {photos.length}/5 fotos • Agente IA Cel-Car
              </span>
            ) : (
              <span>📎 Anexe fotos pelo clipe • Atendente humano: (21) 97708-6841</span>
            )}
          </div>
        </div>
      )}
    </>
  )
}
