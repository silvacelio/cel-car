'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number
  onChange: (value: number) => void
  prefix?: string
}

/**
 * Input de moeda brasileira.
 * - Formata enquanto digita: R$ 1.234,56
 * - Permite editar centena, decimal, etc.
 * - Retorna número (number) para o onChange.
 */
export function CurrencyInput({
  value,
  onChange,
  prefix = 'R$',
  className,
  ...props
}: CurrencyInputProps) {
  // Estado do texto exibido no input
  const [display, setDisplay] = React.useState<string>('')

  // Converte número -> string formatada em BRL (sem símbolo, ex: "1.234,56")
  const formatBRL = (n: number): string => {
    if (isNaN(n) || n === 0) return '0,00'
    const fixed = n.toFixed(2)
    const [intPart, decPart] = fixed.split('.')
    // Adiciona separador de milhar com ponto
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${intFormatted},${decPart}`
  }

  // Sincroniza o display quando o value externo muda
  React.useEffect(() => {
    setDisplay(formatBRL(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Pega só os dígitos
    let digits = e.target.value.replace(/\D/g, '')

    // Se vazio, zera
    if (!digits) {
      setDisplay('0,00')
      onChange(0)
      return
    }

    // Converte string de dígitos em número (centavos)
    // Ex: "1234" -> 12.34
    const cents = parseInt(digits, 10)
    const number = cents / 100

    // Atualiza o display formatado
    setDisplay(formatBRL(number))

    // Notifica o parent
    onChange(number)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
    props.onFocus?.(e)
  }

  return (
    <div className="relative inline-flex items-center">
      {prefix && (
        <span className="absolute left-2 text-xs text-muted-foreground pointer-events-none select-none">
          {prefix}
        </span>
      )}
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        className={cn(
          'h-8 w-32 text-sm font-semibold text-right',
          prefix && 'pl-8 pr-2',
          className
        )}
        {...props}
      />
    </div>
  )
}
