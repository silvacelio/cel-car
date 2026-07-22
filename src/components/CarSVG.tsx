'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface CarSVGProps {
  selectedPartIds: string[]
  onPartClick: (partId: string) => void
  carColor: string // hex
  carColorName: string
}

// Map SVG id -> part id (the parts with svgId)
const SVG_TO_PART: Record<string, string> = {
  'part-capo': 'capo',
  'part-pcd': 'para-choque-dianteiro',
  'part-grade': 'grade-frontal',
  'part-plde': 'para-lama-dianteiro-esq',
  'part-pdde': 'porta-dianteira-esq',
  'part-pte': 'porta-traseira-esq',
  'part-plte': 'para-lama-traseiro-esq',
  'part-esp-e': 'espelho-esq',
  'part-mac-e': 'maçaneta-esq',
  'part-teto': 'teto',
  'part-tampa': 'tampa-malas',
  'part-pct': 'para-choque-traseiro',
}

export function CarSVG({ selectedPartIds, onPartClick, carColor, carColorName }: CarSVGProps) {
  const selectedSet = React.useMemo(() => new Set(selectedPartIds), [selectedPartIds])

  const handleClick = (e: React.MouseEvent<SVGElement>) => {
    const id = e.currentTarget.id
    const partId = SVG_TO_PART[id]
    if (partId) {
      e.stopPropagation()
      onPartClick(partId)
    }
  }

  // Body color - use the chosen paint color
  const bodyFill = carColor

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 800 320"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        role="img"
        aria-label={`Carro na cor ${carColorName}, vista lateral. Clique nas peças para selecionar.`}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={bodyFill} stopOpacity="1" />
            <stop offset="60%" stopColor={bodyFill} stopOpacity="0.95" />
            <stop offset="100%" stopColor={bodyFill} stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="windowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a2a3a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2a4a6a" stopOpacity="0.7" />
          </linearGradient>
          <radialGradient id="wheelGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#444" />
            <stop offset="60%" stopColor="#222" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <filter id="carShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
            <feOffset dx="0" dy="4" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.4" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="400" cy="285" rx="340" ry="12" fill="#000" opacity="0.25" />

        {/* === CAR BODY PARTS === */}
        {/* Para-lama dianteiro esquerdo */}
        <path
          id="part-plde"
          className={cn('car-part', selectedSet.has('para-lama-dianteiro-esq') && 'selected')}
          onClick={handleClick}
          d="M 60 200 Q 60 160 90 150 L 130 145 L 130 220 L 60 220 Z"
          fill="url(#bodyGrad)"
          stroke="#00000040"
          strokeWidth="1"
          filter="url(#carShadow)"
        />

        {/* Para-choque dianteiro */}
        <path
          id="part-pcd"
          className={cn('car-part', selectedSet.has('para-choque-dianteiro') && 'selected')}
          onClick={handleClick}
          d="M 60 200 Q 50 220 70 240 L 130 240 L 130 200 Z"
          fill="url(#bodyGrad)"
          stroke="#00000040"
          strokeWidth="1"
          filter="url(#carShadow)"
        />

        {/* Grade frontal */}
        <path
          id="part-grade"
          className={cn('car-part', selectedSet.has('grade-frontal') && 'selected')}
          onClick={handleClick}
          d="M 75 165 L 120 162 L 122 195 L 80 195 Z"
          fill="#1a1a1a"
          stroke="#00000060"
          strokeWidth="1"
        />

        {/* Capô */}
        <path
          id="part-capo"
          className={cn('car-part', selectedSet.has('capo') && 'selected')}
          onClick={handleClick}
          d="M 120 145 L 130 140 L 280 138 Q 290 138 295 145 L 295 175 L 120 175 Z"
          fill="url(#bodyGrad)"
          stroke="#00000040"
          strokeWidth="1"
          filter="url(#carShadow)"
        />

        {/* Teto */}
        <path
          id="part-teto"
          className={cn('car-part', selectedSet.has('teto') && 'selected')}
          onClick={handleClick}
          d="M 295 140 Q 320 100 380 95 L 510 95 Q 560 100 580 145 L 295 145 Z"
          fill="url(#bodyGrad)"
          stroke="#00000040"
          strokeWidth="1"
          filter="url(#carShadow)"
        />

        {/* Vidros (não clicáveis) */}
        <path
          d="M 305 142 Q 325 110 375 105 L 500 105 Q 545 110 565 142 Z"
          fill="url(#windowGrad)"
          stroke="#00000040"
          strokeWidth="1"
        />

        {/* Porta dianteira esquerda */}
        <path
          id="part-pdde"
          className={cn('car-part', selectedSet.has('porta-dianteira-esq') && 'selected')}
          onClick={handleClick}
          d="M 295 145 L 410 145 L 410 220 L 295 220 Z"
          fill="url(#bodyGrad)"
          stroke="#00000040"
          strokeWidth="1"
          filter="url(#carShadow)"
        />

        {/* Maçaneta porta dianteira */}
        <rect
          id="part-mac-e"
          className={cn('car-part', selectedSet.has('maçaneta-esq') && 'selected')}
          onClick={handleClick}
          x="340"
          y="158"
          width="22"
          height="5"
          rx="2"
          fill="#1a1a1a"
          stroke="#00000060"
        />

        {/* Porta traseira esquerda */}
        <path
          id="part-pte"
          className={cn('car-part', selectedSet.has('porta-traseira-esq') && 'selected')}
          onClick={handleClick}
          d="M 410 145 L 580 145 L 580 220 L 410 220 Z"
          fill="url(#bodyGrad)"
          stroke="#00000040"
          strokeWidth="1"
          filter="url(#carShadow)"
        />

        {/* Retrovisor esquerdo */}
        <path
          id="part-esp-e"
          className={cn('car-part', selectedSet.has('espelho-esq') && 'selected')}
          onClick={handleClick}
          d="M 290 155 Q 275 145 285 135 Q 295 138 295 152 Z"
          fill="#1a1a1a"
          stroke="#00000060"
          strokeWidth="1"
        />

        {/* Para-lama traseiro esquerdo */}
        <path
          id="part-plte"
          className={cn('car-part', selectedSet.has('para-lama-traseiro-esq') && 'selected')}
          onClick={handleClick}
          d="M 580 145 L 670 150 Q 700 160 700 200 L 700 220 L 580 220 Z"
          fill="url(#bodyGrad)"
          stroke="#00000040"
          strokeWidth="1"
          filter="url(#carShadow)"
        />

        {/* Tampa do porta-malas */}
        <path
          id="part-tampa"
          className={cn('car-part', selectedSet.has('tampa-malas') && 'selected')}
          onClick={handleClick}
          d="M 670 150 L 730 158 Q 740 162 740 175 L 740 220 L 700 220 L 670 200 Z"
          fill="url(#bodyGrad)"
          stroke="#00000040"
          strokeWidth="1"
          filter="url(#carShadow)"
        />

        {/* Para-choque traseiro */}
        <path
          id="part-pct"
          className={cn('car-part', selectedSet.has('para-choque-traseiro') && 'selected')}
          onClick={handleClick}
          d="M 700 200 L 740 200 L 740 240 Q 740 250 730 250 L 700 250 Z"
          fill="url(#bodyGrad)"
          stroke="#00000040"
          strokeWidth="1"
          filter="url(#carShadow)"
        />

        {/* === WHEELS (not paintable) === */}
        <circle cx="155" cy="240" r="32" fill="url(#wheelGrad)" stroke="#000" strokeWidth="1.5" />
        <circle cx="155" cy="240" r="16" fill="#888" stroke="#444" strokeWidth="1" />
        <circle cx="155" cy="240" r="5" fill="#222" />

        <circle cx="635" cy="240" r="32" fill="url(#wheelGrad)" stroke="#000" strokeWidth="1.5" />
        <circle cx="635" cy="240" r="16" fill="#888" stroke="#444" strokeWidth="1" />
        <circle cx="635" cy="240" r="5" fill="#222" />

        {/* Headlight/taillight (decorative) */}
        <ellipse cx="90" cy="170" rx="14" ry="8" fill="#fff8c4" opacity="0.85" />
        <ellipse cx="725" cy="170" rx="10" ry="7" fill="#ff4a4a" opacity="0.85" />

        {/* Hint label */}
        <text
          x="400"
          y="305"
          textAnchor="middle"
          fontSize="11"
          fill="currentColor"
          opacity="0.6"
        >
          Clique nas peças do carro para adicioná-las ao orçamento
        </text>
      </svg>
    </div>
  )
}
