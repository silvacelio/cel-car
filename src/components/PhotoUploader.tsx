'use client'

import * as React from 'react'
import { ImagePlus, X, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PhotoUploaderProps {
  fotos: string[]
  onChange: (fotos: string[]) => void
  label?: string
  maxPhotos?: number
  className?: string
}

export function PhotoUploader({
  fotos,
  onChange,
  label = 'Fotos',
  maxPhotos = 5,
  className,
}: PhotoUploaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const processFiles = async (files: FileList | File[]) => {
    const array = Array.from(files)
    if (array.length === 0) return

    const remaining = maxPhotos - fotos.length
    if (remaining <= 0) {
      alert(`Máximo de ${maxPhotos} fotos.`)
      return
    }

    const toProcess = array.slice(0, remaining)
    const newPhotos: string[] = []

    for (const file of toProcess) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > 1024 * 1024 * 5) {
        alert(`Arquivo ${file.name} muito grande. Use imagens até 5MB.`)
        continue
      }
      const dataUrl = await resizeImage(file, 800)
      newPhotos.push(dataUrl)
    }

    if (newPhotos.length > 0) {
      onChange([...fotos, ...newPhotos])
    }
  }

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleRemove = (index: number) => {
    onChange(fotos.filter((_, i) => i !== index))
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase text-muted-foreground tracking-wide">
          {label} <span className="text-[10px] normal-case">({fotos.length}/{maxPhotos})</span>
        </span>
        {fotos.length < maxPhotos && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-3 w-3 mr-1" /> Adicionar
          </Button>
        )}
      </div>

      {fotos.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-md border-2 border-dashed border-border p-4 flex flex-col items-center justify-center gap-1 hover:bg-accent/40 transition-colors"
        >
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground text-center">
            Clique, arraste ou tire foto
            <br />
            <span className="text-[10px]">JPG/PNG até 5MB cada</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((foto, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-md overflow-hidden border border-border group"
            >
              <img src={foto} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remover"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                {i + 1}
              </span>
            </div>
          ))}
          {fotos.length < maxPhotos && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-md border-2 border-dashed border-border flex items-center justify-center hover:bg-accent/40 transition-colors"
            >
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}
