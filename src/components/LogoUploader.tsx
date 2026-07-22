'use client'

import * as React from 'react'
import { ImagePlus, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface LogoUploaderProps {
  value: string | undefined
  onChange: (dataUrl: string | undefined) => void
  label?: string
  className?: string
}

const STORAGE_KEY = 'celcar:logo'

export function LogoUploader({ value, onChange, label = 'Logo da empresa', className }: LogoUploaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Persistir no localStorage
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (value) {
      try {
        localStorage.setItem(STORAGE_KEY, value)
      } catch (e) {
        console.error('Falha ao salvar logo no localStorage', e)
      }
    }
  }, [value])

  // Carregar do localStorage ao montar
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && !value) {
        onChange(saved)
      }
    } catch (e) {
      console.error('Falha ao carregar logo', e)
    }
  }, [])

  const handleFile = (file: File) => {
    if (!file) return
    // Limite de 1MB pra não estourar localStorage / PDF
    if (file.size > 1024 * 1024 * 2) {
      alert('Arquivo muito grande. Use uma imagem menor que 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      // Redimensiona pra no máximo 400px de largura
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 400
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
        if (!ctx) return
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/png')
        onChange(dataUrl)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = '' // permite re-selecionar o mesmo arquivo
  }

  const handleRemove = () => {
    onChange(undefined)
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {}
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-xs uppercase text-muted-foreground tracking-wide">{label}</Label>
      {value ? (
        <div className="flex items-center gap-3 p-2 rounded-md border border-border bg-card">
          <img
            src={value}
            alt="Logo da empresa"
            className="h-16 w-16 object-contain rounded bg-white p-1 border border-border"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="h-3 w-3 text-green-600" /> Logo carregada
            </p>
            <p className="text-[10px] text-muted-foreground">Aparece no app, PDF, Word e impressão.</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRemove} title="Remover logo">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-md border-2 border-dashed border-border p-4 flex flex-col items-center justify-center gap-2 hover:bg-accent/40 transition-colors"
        >
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground text-center">
            Clique ou arraste uma imagem aqui
            <br />
            <span className="text-[10px]">PNG/JPG até 2MB (ideal: 400x400px)</span>
          </p>
        </div>
      )}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}
