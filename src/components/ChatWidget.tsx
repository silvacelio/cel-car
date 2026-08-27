'use client'

import * as React from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function ChatWidget() {
  const [open, setOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Bem-vindo à Cel-Car — Funilaria e Pintura! 🚗\n\nComo posso ajudar? Você pode:\n• Pedir um orçamento\n• Enviar fotos do veículo\n• Tirar dúvidas sobre nossos serviços',
    },
  ])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

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
                    'rounded-lg px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap',
                    msg.role === 'assistant'
                      ? 'bg-muted text-foreground'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  {msg.content}
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
          </div>

          {/* Input */}
          <div className="p-2 border-t border-border bg-card flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              disabled={loading}
              className="h-9 text-sm"
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
            Agente IA Cel-Car • Para atendente humano: WhatsApp (21) 97708-6841
          </div>
        </div>
      )}
    </>
  )
}
