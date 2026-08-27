'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Car, Plus, Trash2, Sparkles, Send, Mail, FileText, FileType2, Save, Printer, History, X, Trash, Eraser, AlertTriangle, ShieldCheck, Share2, Copy, QrCode, RotateCcw, Package, Wrench, Search, ExternalLink, Camera, ImageIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

import { CarSVG } from '@/components/CarSVG'
import { SignaturePad } from '@/components/SignaturePad'
import { CurrencyInput } from '@/components/CurrencyInput'
import { LogoUploader } from '@/components/LogoUploader'
import { PhotoUploader } from '@/components/PhotoUploader'
import { ChatWidget } from '@/components/ChatWidget'
import { CAR_PARTS, CAR_PARTS_BY_ID, TIPOS_SERVICO, type TipoServico } from '@/lib/car-parts'
import { PAINT_COLORS, PAINT_COLORS_BY_ID } from '@/lib/colors'
import { COMPANY, formatBRL, formatDate } from '@/lib/company'
import {
  calculateItemPrice,
  exportPDF,
  exportWord,
  printBudget,
  saveJSON,
  shareOnEmail,
  shareOnWhatsApp,
  subtotal,
  type Budget,
  type BudgetItem,
  type ClientData,
  type ReplacementPart,
  type LaborService,
} from '@/lib/export'

type HistoryEntry = Budget

const STORAGE_KEY = 'celcar:historico'

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as HistoryEntry[]
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch (e) {
    console.error('Failed to save history', e)
  }
}

function generateBudgetNumber(): string {
  const d = new Date()
  const y = d.getFullYear().toString().slice(-2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `${y}${m}${day}-${rand}`
}

export default function Home() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [mounted, setMounted] = React.useState(false)
  const [carColorId, setCarColorId] = React.useState('vermelho-cintilante')
  const [selectedPartIds, setSelectedPartIds] = React.useState<string[]>([])
  const [items, setItems] = React.useState<BudgetItem[]>([])
  const [desconto, setDesconto] = React.useState(0)
  const [observacoes, setObservacoes] = React.useState('')
  const [garantia, setGarantia] = React.useState('3 meses de garantia na pintura')
  const [validade, setValidade] = React.useState('15 dias a partir da data de emissão')
  const [client, setClient] = React.useState<ClientData>({
    nome: '',
    telefone: '',
    email: '',
    placa: '',
    modelo: '',
    ano: '',
  })
  const [history, setHistory] = React.useState<HistoryEntry[]>([])
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [aiLoading, setAiLoading] = React.useState<string | null>(null)
  const [assinaturaCliente, setAssinaturaCliente] = React.useState<string | undefined>(undefined)
  const [assinaturaEmpresa, setAssinaturaEmpresa] = React.useState<string | undefined>(undefined)
  const [shareOpen, setShareOpen] = React.useState(false)
  const [appUrl, setAppUrl] = React.useState('')
  const [logo, setLogo] = React.useState<string | undefined>(undefined)
  const [fotosAntes, setFotosAntes] = React.useState<string[]>([])
  const [fotosDepois, setFotosDepois] = React.useState<string[]>([])

  // Peças de reposição
  const [pecas, setPecas] = React.useState<ReplacementPart[]>([])
  const [buscaPeca, setBuscaPeca] = React.useState({ nome: '', veiculo: '', marca: '' })
  const [buscandoPeca, setBuscandoPeca] = React.useState(false)
  const [resultadosBusca, setResultadosBusca] = React.useState<Array<ReplacementPart & { link?: string }>>([])

  // Mão de obra
  const [maoObra, setMaoObra] = React.useState<LaborService[]>([])
  const [novoServicoMO, setNovoServicoMO] = React.useState({ descricao: '', tempoEstimado: '', preco: 0 })

  React.useEffect(() => {
    setMounted(true)
    setHistory(loadHistory())
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.href)
    }
  }, [])

  const handleShareApp = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const shareText = `Olá! Acesse o app Cel-Car — Orçamento de Repintura Automotiva: ${url}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cel-Car — Orçamento de Repintura',
          text: 'Faça seu orçamento de repintura automotiva com a Cel-Car',
          url,
        })
        return
      } catch (e) {
        // user cancelled, fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(shareText)
      toast({ title: 'Link copiado!', description: 'Cole no WhatsApp ou onde quiser compartilhar.' })
    } catch {
      setShareOpen(true)
    }
  }

  const handleCopyLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link copiado!', description: url })
    } catch {
      toast({ title: 'Não foi possível copiar', description: 'Copie manualmente: ' + url, variant: 'destructive' })
    }
  }

  const handleShareWhatsApp = () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const text = `Olá! Acesse o app Cel-Car para orçamento de repintura automotiva: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  const carColor = PAINT_COLORS_BY_ID[carColorId]

  const handlePartClick = (partId: string) => {
    const part = CAR_PARTS_BY_ID[partId]
    if (!part) return
    setSelectedPartIds((prev) =>
      prev.includes(partId) ? prev.filter((id) => id !== partId) : [...prev, partId]
    )
    // Auto-add to budget if not already there
    setItems((prev) => {
      if (prev.some((it) => it.partId === partId)) return prev
      const novo: BudgetItem = {
        partId,
        tipoServico: 'pintura-completa',
        corId: carColorId,
        preco: calculateItemPrice(partId, 'pintura-completa', carColorId),
      }
      return [...prev, novo]
    })
    toast({
      title: `${part.nome} adicionada`,
      description: `Pintura completa em ${carColor.nome} — ${formatBRL(calculateItemPrice(partId, 'pintura-completa', carColorId))}`,
    })
  }

  const handleRemovePart = (partId: string) => {
    setSelectedPartIds((prev) => prev.filter((id) => id !== partId))
    setItems((prev) => prev.filter((it) => it.partId !== partId))
  }

  const handleUpdateItem = (partId: string, patch: Partial<BudgetItem>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.partId !== partId) return it
        const updated = { ...it, ...patch }
        // recalcular preço se mudou serviço ou cor
        if (patch.tipoServico || patch.corId) {
          updated.preco = calculateItemPrice(partId, updated.tipoServico, updated.corId)
        }
        return updated
      })
    )
  }

  const handleAISuggest = async (partId: string) => {
    const part = CAR_PARTS_BY_ID[partId]
    const item = items.find((it) => it.partId === partId)
    if (!item || !part) return
    setAiLoading(partId)
    try {
      const res = await fetch('/api/suggest-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId,
          tipoServico: item.tipoServico,
          corId: item.corId,
          veiculo: client.modelo ? `${client.modelo} ${client.ano}`.trim() : undefined,
          observacoes: observacoes || undefined,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setItems((prev) =>
          prev.map((it) =>
            it.partId === partId ? { ...it, preco: data.preco } : it
          )
        )
        toast({
          title: 'IA sugeriu novo preço',
          description: `${part.nome}: ${formatBRL(data.preco)} (${data.source === 'ai' ? 'IA' : 'simulado'}) — ${data.justificativa?.slice(0, 80) ?? ''}`,
        })
      } else {
        toast({ title: 'Erro na sugestão IA', description: data.error, variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: 'Falha ao chamar IA', description: String(e), variant: 'destructive' })
    } finally {
      setAiLoading(null)
    }
  }

  const handleAddPartManually = (partId: string) => {
    if (selectedPartIds.includes(partId)) return
    setSelectedPartIds((prev) => [...prev, partId])
    setItems((prev) => [
      ...prev,
      {
        partId,
        tipoServico: 'pintura-completa',
        corId: carColorId,
        preco: calculateItemPrice(partId, 'pintura-completa', carColorId),
      },
    ])
  }

  // ===== PEÇAS DE REPOSIÇÃO =====
  const handleBuscarPeca = async () => {
    if (!buscaPeca.nome || !buscaPeca.veiculo) {
      toast({ title: 'Preencha nome e veículo', variant: 'destructive' })
      return
    }
    setBuscandoPeca(true)
    setResultadosBusca([])
    try {
      const res = await fetch('/api/search-part-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: buscaPeca.nome,
          veiculo: buscaPeca.veiculo,
          marca: buscaPeca.marca || undefined,
        }),
      })
      const data = await res.json()
      if (data.ok && data.resultados?.length > 0) {
        setResultadosBusca(
          data.resultados.map((r: any) => ({
            id: crypto.randomUUID(),
            nome: r.nome,
            marca: r.marca,
            fornecedor: r.fornecedor,
            link: r.link,
            preco: r.preco,
            quantidade: 1,
            veiculo: buscaPeca.veiculo,
          }))
        )
        toast({
          title: `${data.resultados.length} resultados encontrados`,
          description: data.source === 'ai'
            ? 'Pesquisa via IA com web search'
            : 'Valores estimados (sem IA configurada)',
        })
      } else {
        toast({ title: 'Nenhum resultado', description: data.error || 'Tente ser mais específico', variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: 'Erro na busca', description: String(e), variant: 'destructive' })
    } finally {
      setBuscandoPeca(false)
    }
  }

  const handleAddPecaResultado = (p: ReplacementPart & { link?: string }) => {
    setPecas((prev) => [...prev, p])
    setResultadosBusca((prev) => prev.filter((r) => r.id !== p.id))
    toast({ title: 'Peça adicionada', description: `${p.nome} — ${formatBRL(p.preco)}` })
  }

  const handleAddPecaManual = () => {
    if (!buscaPeca.nome || !buscaPeca.veiculo) {
      toast({ title: 'Preencha nome e veículo', variant: 'destructive' })
      return
    }
    const nova: ReplacementPart = {
      id: crypto.randomUUID(),
      nome: buscaPeca.nome,
      veiculo: buscaPeca.veiculo,
      marca: buscaPeca.marca || undefined,
      fornecedor: 'Manual',
      preco: 0,
      quantidade: 1,
    }
    setPecas((prev) => [...prev, nova])
    setBuscaPeca({ nome: '', veiculo: '', marca: '' })
    toast({ title: 'Peça adicionada (preço a definir)' })
  }

  const handleUpdatePeca = (id: string, patch: Partial<ReplacementPart>) => {
    setPecas((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const handleRemovePeca = (id: string) => {
    setPecas((prev) => prev.filter((p) => p.id !== id))
  }

  // ===== MÃO DE OBRA =====
  const handleAddMaoObra = () => {
    if (!novoServicoMO.descricao) {
      toast({ title: 'Preencha a descrição', variant: 'destructive' })
      return
    }
    const novo: LaborService = {
      id: crypto.randomUUID(),
      descricao: novoServicoMO.descricao,
      tempoEstimado: novoServicoMO.tempoEstimado || undefined,
      preco: novoServicoMO.preco || 0,
    }
    setMaoObra((prev) => [...prev, novo])
    setNovoServicoMO({ descricao: '', tempoEstimado: '', preco: 0 })
    toast({ title: 'Serviço adicionado' })
  }

  const handleUpdateMaoObra = (id: string, patch: Partial<LaborService>) => {
    setMaoObra((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  const handleRemoveMaoObra = (id: string) => {
    setMaoObra((prev) => prev.filter((m) => m.id !== id))
  }

  const subtotalGeral = React.useMemo(() => {
    const pintura = items.reduce((s, i) => s + i.preco, 0)
    const pec = pecas.reduce((s, p) => s + p.preco * p.quantidade, 0)
    const mo = maoObra.reduce((s, m) => s + m.preco, 0)
    return pintura + pec + mo
  }, [items, pecas, maoObra])
  const descontoValor = Math.round((subtotalGeral * desconto) / 100)
  const total = subtotalGeral - descontoValor

  const buildBudget = (): Budget => ({
    id: crypto.randomUUID(),
    numero: generateBudgetNumber(),
    createdAt: new Date().toISOString(),
    cliente: client,
    itens: items,
    pecasReposicao: pecas,
    maodeObra: maoObra,
    desconto,
    observacoes,
    garantia,
    validade,
    total,
    assinatura: assinaturaCliente,
    assinaturaEmpresa,
    logo,
    fotosAntes: fotosAntes.length > 0 ? fotosAntes : undefined,
    fotosDepois: fotosDepois.length > 0 ? fotosDepois : undefined,
  })

  const handleSaveToHistory = (budget: Budget) => {
    const next = [budget, ...history].slice(0, 50)
    setHistory(next)
    saveHistory(next)
  }

  const handleNewBudget = () => {
    setItems([])
    setSelectedPartIds([])
    setDesconto(0)
    setObservacoes('')
    setClient({ nome: '', telefone: '', email: '', placa: '', modelo: '', ano: '' })
    setAssinaturaCliente(undefined)
    setAssinaturaEmpresa(undefined)
    setPecas([])
    setMaoObra([])
    setResultadosBusca([])
    setBuscaPeca({ nome: '', veiculo: '', marca: '' })
    setNovoServicoMO({ descricao: '', tempoEstimado: '', preco: 0 })
    setFotosAntes([])
    setFotosDepois([])
    toast({ title: 'Novo orçamento iniciado' })
  }

  const handleClearAll = () => {
    setItems([])
    setSelectedPartIds([])
    setDesconto(0)
    setObservacoes('')
    setGarantia('3 meses de garantia na pintura')
    setValidade('15 dias a partir da data de emissão')
    setClient({ nome: '', telefone: '', email: '', placa: '', modelo: '', ano: '' })
    setAssinaturaCliente(undefined)
    setAssinaturaEmpresa(undefined)
    setCarColorId('vermelho-cintilante')
    setPecas([])
    setMaoObra([])
    setResultadosBusca([])
    setBuscaPeca({ nome: '', veiculo: '', marca: '' })
    setNovoServicoMO({ descricao: '', tempoEstimado: '', preco: 0 })
    setFotosAntes([])
    setFotosDepois([])
    toast({ title: 'Dados limpos', description: 'Todos os campos do orçamento foram resetados.' })
  }

  const handleClearHistory = () => {
    setHistory([])
    saveHistory([])
    toast({ title: 'Histórico limpo' })
  }

  const handleClearEverything = () => {
    handleClearAll()
    setHistory([])
    saveHistory([])
    toast({ title: 'Tudo limpo', description: 'Orçamento atual e histórico foram apagados deste navegador.' })
  }

  const handleExport = (kind: 'pdf' | 'word' | 'json' | 'print' | 'whatsapp' | 'email') => {
    if (items.length === 0 && pecas.length === 0 && maoObra.length === 0) {
      toast({ title: 'Adicione ao menos 1 item', description: 'Pintura, peça de reposição ou mão de obra', variant: 'destructive' })
      return
    }
    if (!client.nome) {
      toast({ title: 'Informe o nome do cliente', variant: 'destructive' })
      return
    }
    const budget = buildBudget()
    handleSaveToHistory(budget)
    try {
      if (kind === 'pdf') exportPDF(budget)
      else if (kind === 'word') exportWord(budget)
      else if (kind === 'json') saveJSON(budget)
      else if (kind === 'print') printBudget(budget)
      else if (kind === 'whatsapp') shareOnWhatsApp(budget)
      else if (kind === 'email') shareOnEmail(budget)
      toast({ title: 'Orçamento gerado', description: `Número ${budget.numero}` })
    } catch (e) {
      toast({ title: 'Erro ao exportar', description: String(e), variant: 'destructive' })
    }
  }

  const handleDeleteHistory = (id: string) => {
    const next = history.filter((h) => h.id !== id)
    setHistory(next)
    saveHistory(next)
  }

  const handleLoadHistory = (entry: HistoryEntry) => {
    setClient(entry.cliente)
    setItems(entry.itens)
    setSelectedPartIds(entry.itens.map((i) => i.partId))
    setPecas(entry.pecasReposicao || [])
    setMaoObra(entry.maodeObra || [])
    setDesconto(entry.desconto)
    setObservacoes(entry.observacoes)
    setGarantia(entry.garantia)
    setValidade(entry.validade)
    setAssinaturaCliente(entry.assinatura)
    setAssinaturaEmpresa(entry.assinaturaEmpresa)
    setFotosAntes(entry.fotosAntes || [])
    setFotosDepois(entry.fotosDepois || [])
    setHistoryOpen(false)
    toast({ title: `Orçamento ${entry.numero} carregado` })
  }

  const availableParts = CAR_PARTS.filter((p) => !selectedPartIds.includes(p.id))

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 no-print">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt="Cel-Car" className="h-10 w-10 object-contain rounded-lg bg-white p-1" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Car className="h-6 w-6" />
              </div>
            )}
            <div>
              <h1 className="text-base sm:text-lg font-bold leading-tight">Cel-Car</h1>
              <p className="text-xs text-muted-foreground leading-tight">Orçamento de Repintura Automotiva</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
              <History className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Histórico</span>
              {history.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{history.length}</Badge>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleNewBudget}>
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Novo</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="bg-primary/10 hover:bg-primary/20 border-primary/30">
              <Share2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Compartilhar App</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                  <Eraser className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Limpar Dados</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Limpar dados
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Escolha o que deseja apagar. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-2 py-2">
                  <Button variant="outline" onClick={handleClearAll} className="justify-start">
                    <Eraser className="h-4 w-4 mr-2" />
                    Limpar apenas o orçamento atual
                  </Button>
                  <Button variant="outline" onClick={handleClearHistory} className="justify-start">
                    <Trash className="h-4 w-4 mr-2" />
                    Limpar apenas o histórico salvo
                  </Button>
                  <Button variant="destructive" onClick={handleClearEverything} className="justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Limpar TUDO (orçamento + histórico)
                  </Button>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {mounted && (
              <Button
                variant="outline"
                size="icon"
                aria-label="Alternar tema"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Car + colors */}
        <section className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    Selecione as peças no carro
                  </CardTitle>
                  <CardDescription>
                    Clique diretamente sobre as peças do veículo ou use a lista completa abaixo.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  Cor atual: <span className="font-semibold ml-1">{carColor.nome}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CarSVG
                selectedPartIds={selectedPartIds}
                onPartClick={handlePartClick}
                carColor={carColor.hex}
                carColorName={carColor.nome}
              />
            </CardContent>
          </Card>

          {/* Color picker */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cor da pintura</CardTitle>
              <CardDescription>Escolha a cor que será aplicada às novas peças adicionadas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PAINT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCarColorId(c.id)}
                    className={`group relative rounded-lg border-2 p-3 text-left transition-all hover:scale-[1.02] ${
                      carColorId === c.id ? 'border-primary shadow-lg' : 'border-border'
                    }`}
                  >
                    <div
                      className="mb-2 h-10 w-full rounded-md border border-border"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div className="text-xs font-medium leading-tight">{c.nome}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{c.acabamento}</div>
                    {carColorId === c.id && (
                      <span className="absolute top-1 right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available parts (manual add) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Todas as peças</CardTitle>
              <CardDescription>
                Peças disponíveis para adicionar (inclui vista superior/traseira não visível no desenho).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-72 overflow-y-auto fancy-scroll pr-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableParts.length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-2">Todas as peças já foram adicionadas.</p>
                ) : (
                  availableParts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddPartManually(p.id)}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-card hover:bg-accent/50 px-3 py-2 text-left text-sm transition-colors"
                    >
                      <div>
                        <div className="font-medium">{p.nome}</div>
                        <div className="text-xs text-muted-foreground capitalize">{p.zona.replace('-', ' ')}</div>
                      </div>
                      <Plus className="h-4 w-4 text-primary shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* RIGHT: Items + client + summary */}
        <section className="lg:col-span-5 space-y-4">
          {/* Client form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados do cliente</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="cli-nome">Nome</Label>
                <Input id="cli-nome" value={client.nome} onChange={(e) => setClient({ ...client, nome: e.target.value })} placeholder="Nome do cliente" />
              </div>
              <div>
                <Label htmlFor="cli-tel">Telefone</Label>
                <Input id="cli-tel" value={client.telefone} onChange={(e) => setClient({ ...client, telefone: e.target.value })} placeholder="(21) 99999-9999" />
              </div>
              <div>
                <Label htmlFor="cli-email">E-mail</Label>
                <Input id="cli-email" type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} placeholder="cliente@email.com" />
              </div>
              <div>
                <Label htmlFor="cli-modelo">Veículo</Label>
                <Input id="cli-modelo" value={client.modelo} onChange={(e) => setClient({ ...client, modelo: e.target.value })} placeholder="Honda Civic" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="cli-placa">Placa</Label>
                  <Input id="cli-placa" value={client.placa} onChange={(e) => setClient({ ...client, placa: e.target.value })} placeholder="ABC1D23" />
                </div>
                <div>
                  <Label htmlFor="cli-ano">Ano</Label>
                  <Input id="cli-ano" value={client.ano} onChange={(e) => setClient({ ...client, ano: e.target.value })} placeholder="2022" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items list */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Peças do orçamento <span className="text-muted-foreground font-normal">({items.length})</span>
                </CardTitle>
                {items.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => { setItems([]); setSelectedPartIds([]) }}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Limpar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Car className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Clique nas peças do carro acima para montar o orçamento.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[28rem] overflow-y-auto fancy-scroll pr-2">
                  {items.map((item) => {
                    const part = CAR_PARTS_BY_ID[item.partId]
                    const color = PAINT_COLORS_BY_ID[item.corId]
                    return (
                      <div key={item.partId} className="rounded-lg border border-border bg-card p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{part.nome}</div>
                            <div className="text-xs text-muted-foreground capitalize">{part.zona.replace('-', ' ')}</div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRemovePart(item.partId)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] uppercase text-muted-foreground">Serviço</Label>
                            <Select
                              value={item.tipoServico}
                              onValueChange={(v) => handleUpdateItem(item.partId, { tipoServico: v })}
                            >
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {TIPOS_SERVICO.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase text-muted-foreground">Cor</Label>
                            <Select
                              value={item.corId}
                              onValueChange={(v) => handleUpdateItem(item.partId, { corId: v })}
                            >
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {PAINT_COLORS.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="h-4 w-4 rounded border border-border shrink-0" style={{ backgroundColor: color.hex }} />
                            <Label className="text-[10px] uppercase text-muted-foreground shrink-0">Valor</Label>
                            <CurrencyInput
                              value={item.preco}
                              onChange={(v) => handleUpdateItem(item.partId, { preco: Math.max(0, v) })}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2"
                              title="Resetar ao valor simulado"
                              onClick={() => {
                                const simulado = calculateItemPrice(item.partId, item.tipoServico, item.corId)
                                handleUpdateItem(item.partId, { preco: simulado })
                              }}
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs shrink-0"
                            disabled={aiLoading === item.partId}
                            onClick={() => handleAISuggest(item.partId)}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            {aiLoading === item.partId ? 'Consultando IA...' : 'Sugerir preço IA'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== PEÇAS DE REPOSIÇÃO ===== */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Peças de Reposição <span className="text-muted-foreground font-normal">({pecas.length})</span>
              </CardTitle>
              <CardDescription>Pesquise o preço na internet ou cadastre manualmente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Formulário de busca */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Nome da peça</Label>
                  <Input
                    value={buscaPeca.nome}
                    onChange={(e) => setBuscaPeca({ ...buscaPeca, nome: e.target.value })}
                    placeholder="Para-choque traseiro"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Veículo</Label>
                  <Input
                    value={buscaPeca.veiculo}
                    onChange={(e) => setBuscaPeca({ ...buscaPeca, veiculo: e.target.value })}
                    placeholder="Volkswagen Kombi 2010"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Marca (opcional)</Label>
                  <Input
                    value={buscaPeca.marca}
                    onChange={(e) => setBuscaPeca({ ...buscaPeca, marca: e.target.value })}
                    placeholder="Original VW"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={handleBuscarPeca} disabled={buscandoPeca} className="h-7 text-xs">
                  <Search className="h-3 w-3 mr-1" />
                  {buscandoPeca ? 'Pesquisando...' : 'Pesquisar preço na internet'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleAddPecaManual} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Adicionar manual
                </Button>
              </div>

              {/* Resultados da busca */}
              {resultadosBusca.length > 0 && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-2 space-y-2">
                  <div className="text-[10px] uppercase text-muted-foreground px-1">Resultados da pesquisa</div>
                  {resultadosBusca.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-2 rounded bg-background p-2 border border-border">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{r.nome}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {r.marca ? `${r.marca} — ` : ''}{r.fornecedor} — {formatBRL(r.preco)}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {r.link && (
                          <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                            <a href={r.link} target="_blank" rel="noopener noreferrer" title="Abrir link">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleAddPecaResultado(r)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lista de peças adicionadas */}
              {pecas.length > 0 && (
                <div className="space-y-2 max-h-72 overflow-y-auto fancy-scroll pr-1">
                  {pecas.map((p) => (
                    <div key={p.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{p.nome}</div>
                          <div className="text-xs text-muted-foreground">{p.veiculo}{p.marca ? ` — ${p.marca}` : ''}</div>
                          {p.fornecedor && <div className="text-[10px] text-muted-foreground">Fornecedor: {p.fornecedor}</div>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRemovePeca(p.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-[10px] uppercase text-muted-foreground">Qtd</Label>
                          <Input
                            type="number"
                            min={1}
                            value={p.quantidade}
                            onChange={(e) => handleUpdatePeca(p.id, { quantidade: Math.max(1, Number(e.target.value) || 1) })}
                            className="h-7 w-16 text-xs"
                          />
                          <CurrencyInput
                            value={p.preco}
                            onChange={(v) => handleUpdatePeca(p.id, { preco: Math.max(0, v) })}
                          />
                        </div>
                        <div className="text-sm font-semibold">
                          = {formatBRL(p.preco * p.quantidade)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== MÃO DE OBRA ===== */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-5 w-5 text-accent" />
                Mão de Obra <span className="text-muted-foreground font-normal">({maoObra.length})</span>
              </CardTitle>
              <CardDescription>Adicione os serviços de mão de obra que serão cobrados do cliente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <Label className="text-[10px] uppercase text-muted-foreground">Descrição do serviço</Label>
                  <Input
                    value={novoServicoMO.descricao}
                    onChange={(e) => setNovoServicoMO({ ...novoServicoMO, descricao: e.target.value })}
                    placeholder="Remoção e instalação do para-choque"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-[10px] uppercase text-muted-foreground">Horas / Dias úteis</Label>
                  <Input
                    type="text"
                    value={novoServicoMO.tempoEstimado}
                    onChange={(e) => setNovoServicoMO({ ...novoServicoMO, tempoEstimado: e.target.value })}
                    placeholder="2h, 1 dia útil, 3 dias..."
                    className="h-8 text-xs"
                  />
                </div>
                <div className="sm:col-span-3">
                  <Label className="text-[10px] uppercase text-muted-foreground">Valor (R$)</Label>
                  <CurrencyInput
                    value={novoServicoMO.preco}
                    onChange={(v) => setNovoServicoMO({ ...novoServicoMO, preco: v })}
                  />
                </div>
                <div className="sm:col-span-1 flex items-end">
                  <Button size="sm" className="h-8 w-full" onClick={handleAddMaoObra}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {maoObra.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto fancy-scroll pr-1">
                  {maoObra.map((m) => (
                    <div key={m.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Input
                          value={m.descricao}
                          onChange={(e) => handleUpdateMaoObra(m.id, { descricao: e.target.value })}
                          className="h-7 text-sm border-0 px-0 focus-visible:ring-0"
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRemoveMaoObra(m.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">Horas/Dias</Label>
                        <Input
                          type="text"
                          value={m.tempoEstimado ?? ''}
                          onChange={(e) => handleUpdateMaoObra(m.id, { tempoEstimado: e.target.value || undefined })}
                          placeholder="2h, 1 dia útil..."
                          className="h-7 w-32 text-xs"
                        />
                        <CurrencyInput
                          value={m.preco}
                          onChange={(v) => handleUpdateMaoObra(m.id, { preco: Math.max(0, v) })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discount + totals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatBRL(subtotalGeral)}</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm">Desconto: {desconto}%</Label>
                </div>
                <Slider
                  value={[desconto]}
                  onValueChange={(v) => setDesconto(v[0])}
                  min={0}
                  max={30}
                  step={1}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-primary">{formatBRL(total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Condições</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="garantia">Garantia</Label>
                <Input id="garantia" value={garantia} onChange={(e) => setGarantia(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="validade">Validade do orçamento</Label>
                <Input id="validade" value={validade} onChange={(e) => setValidade(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="obs">Observações</Label>
                <Textarea id="obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Desconto à vista, formas de pagamento, etc." rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Assinaturas digitais */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Assinatura digital
              </CardTitle>
              <CardDescription>
                Colete a assinatura do cliente e da empresa. Ela será embutida no PDF, Word e impressão com validade jurídica (MP 2.200-2/2001 e Lei 14.063/2020).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SignaturePad
                label="Assinatura do cliente"
                value={assinaturaCliente}
                onChange={setAssinaturaCliente}
              />
              <Separator />
              <SignaturePad
                label="Assinatura da empresa"
                value={assinaturaEmpresa}
                onChange={setAssinaturaEmpresa}
              />
            </CardContent>
          </Card>

          {/* Logo da empresa */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Logo da Cel-Car
              </CardTitle>
              <CardDescription>
                Suba a logo da sua empresa. Ela aparece no app, PDF, Word e impressão. Fica salva neste navegador.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogoUploader
                value={logo}
                onChange={setLogo}
              />
            </CardContent>
          </Card>

          {/* Fotos do veículo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-5 w-5 text-accent" />
                Fotos do Veículo
              </CardTitle>
              <CardDescription>
                Anexe fotos do carro antes e depois do serviço. Vão no PDF, Word e impressão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PhotoUploader
                fotos={fotosAntes}
                onChange={setFotosAntes}
                label="ANTES do serviço"
                maxPhotos={5}
              />
              <Separator />
              <PhotoUploader
                fotos={fotosDepois}
                onChange={setFotosDepois}
                label="DEPOIS do serviço"
                maxPhotos={5}
              />
            </CardContent>
          </Card>

          {/* Export buttons */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Enviar / Exportar</CardTitle>
              <CardDescription>O orçamento é salvo automaticamente no histórico local ao exportar.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Button onClick={() => handleExport('whatsapp')} className="col-span-2 sm:col-span-1 bg-green-600 hover:bg-green-700 text-white">
                <Send className="h-4 w-4 mr-1" /> WhatsApp
              </Button>
              <Button onClick={() => handleExport('email')} variant="outline">
                <Mail className="h-4 w-4 mr-1" /> E-mail
              </Button>
              <Button onClick={() => handleExport('pdf')} variant="outline">
                <FileText className="h-4 w-4 mr-1" /> PDF
              </Button>
              <Button onClick={() => handleExport('word')} variant="outline">
                <FileType2 className="h-4 w-4 mr-1" /> Word
              </Button>
              <Button onClick={() => handleExport('print')} variant="outline">
                <Printer className="h-4 w-4 mr-1" /> Imprimir
              </Button>
              <Button onClick={() => handleExport('json')} variant="outline">
                <Save className="h-4 w-4 mr-1" /> Salvar JSON
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-border bg-card/50 no-print">
        <div className="container mx-auto px-4 py-4 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <strong className="text-foreground">{COMPANY.nome}</strong> — CNPJ {COMPANY.cnpj}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{COMPANY.telefone}</span>
              <span>•</span>
              <span>{COMPANY.email}</span>
              <span>•</span>
              <span>{COMPANY.endereco} — CEP {COMPANY.cep}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Compartilhar App Cel-Car
            </DialogTitle>
            <DialogDescription>
              Use o link abaixo para acessar o app em qualquer dispositivo ou enviar para seus clientes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md border border-border bg-muted/40 p-3">
              <div className="text-[10px] uppercase text-muted-foreground mb-1">Link do app</div>
              <div className="text-xs font-mono break-all select-all">{appUrl || '—'}</div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button onClick={handleCopyLink} variant="outline" className="w-full justify-start">
                <Copy className="h-4 w-4 mr-2" /> Copiar apenas o link
              </Button>
              <Button onClick={handleShareWhatsApp} className="w-full justify-start bg-green-600 hover:bg-green-700 text-white">
                <Send className="h-4 w-4 mr-2" /> Enviar link pelo WhatsApp
              </Button>
              <Button onClick={handleShareApp} variant="outline" className="w-full justify-start">
                <Share2 className="h-4 w-4 mr-2" /> Compartilhar... (menu do celular)
              </Button>
            </div>

            <div className="rounded-md border border-dashed border-border p-4 flex flex-col items-center gap-2">
              <div className="text-xs text-muted-foreground">QR Code — aponte a câmera do celular</div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}`}
                alt="QR Code do app Cel-Car"
                className="w-44 h-44 rounded-md bg-white p-2"
                width={176}
                height={176}
              />
              <p className="text-[10px] text-muted-foreground text-center">
                Escaneie com a câmera do WhatsApp ou do celular para abrir o app direto no telefone.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Widget — Agente Virtual Cel-Car */}
      <ChatWidget />

      {/* History sheet */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Histórico de Orçamentos</SheetTitle>
            <SheetDescription>
              Orçamentos salvos localmente neste navegador.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum orçamento salvo ainda.</p>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleClearHistory} className="w-full">
                  <Trash className="h-3.5 w-3.5 mr-1" /> Limpar todo o histórico
                </Button>
                {history.map((h) => (
                  <div key={h.id} className="rounded-lg border border-border p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm">Orçamento {h.numero}</div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteHistory(h.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDate(h.createdAt)}</div>
                    <div className="text-sm">Cliente: <strong>{h.cliente.nome || '-'}</strong></div>
                    <div className="text-sm">Veículo: {h.cliente.modelo || '-'} {h.cliente.placa ? `— ${h.cliente.placa}` : ''}</div>
                    <div className="text-xs text-muted-foreground">{h.itens.length} {h.itens.length === 1 ? 'item' : 'itens'}</div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-base font-bold text-primary">{formatBRL(h.total)}</span>
                      <Button variant="outline" size="sm" onClick={() => handleLoadHistory(h)}>
                        Carregar
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
