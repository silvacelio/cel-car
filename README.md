# 🚗 Cel-Car — Orçamento de Repintura Automotiva

Aplicativo web para geração de orçamentos de repintura automotiva com inteligência artificial, assinatura digital e exportação para PDF, Word, WhatsApp e e-mail.

## ✨ Funcionalidades

- 🚘 **Carro SVG interativo** — clique nas peças (capô, portas, para-choques, teto, etc.) para adicioná-las ao orçamento
- 🎨 **8 cores de pintura** com acabamentos distintos (sólida, metálica, perolizada, efeito) que afetam o preço
- 🔧 **22 peças** catalogadas em 5 zonas (frente, lateral esq/dir, teto, traseira)
- 🛠️ **4 tipos de serviço** por peça: pintura completa, retoque, polimento, tratamento de ferrugem
- 🤖 **IA para sugestão de preços** — analisa peça + cor + serviço + veículo e retorna preço justo com justificativa
- ✍️ **Assinatura digital** (cliente + empresa) embutida em PDF/Word/Impressão com validade jurídica (MP 2.200-2/2001 e Lei 14.063/2020)
- 📤 **6 ações de exportação**: WhatsApp, E-mail, PDF, Word, Imprimir, JSON
- 💾 **Histórico local** — até 50 orçamentos salvos no navegador
- 🗑️ **Botão Limpar Dados** com 3 níveis (orçamento atual / histórico / tudo)
- 📲 **Botão Compartilhar App** com link + QR Code
- 🌓 **Modo escuro** (preto/vermelho/azul) como padrão
- 📱 **Responsivo** mobile-first

## 🛠️ Stack

- [Next.js 16](https://nextjs.org/) com App Router
- [TypeScript 5](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) — componentes
- [jsPDF](https://github.com/parallax/jsPDF) — geração de PDF
- [z-ai-web-dev-sdk](https://github.com/zai-org/z-ai-web-dev-sdk) — sugestão de preços por IA
- [next-themes](https://github.com/pacocoursey/next-themes) — dark mode

## 🚀 Como rodar localmente

```bash
# Instalar dependências
bun install

# Configurar IA (crie .z-ai-config na raiz)
cat > .z-ai-config <<EOF
{
  "baseUrl": "https://sua-api-ia/v1",
  "apiKey": "sua-api-key"
}
EOF

# Rodar em desenvolvimento
bun run dev

# Abrir http://localhost:3000
```

## ☁️ Deploy na Vercel

1. Faça push do projeto para o GitHub
2. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**
3. Importe o repositório do GitHub
4. A Vercel detecta Next.js automaticamente — não precisa configurar nada
5. (Opcional) Adicione as variáveis de ambiente se necessário
6. Clique em **Deploy**

Pronto! O app estará disponível em `https://cel-car.vercel.app` (ou similar).

## 📋 Estrutura do projeto

```
src/
├── app/
│   ├── api/suggest-price/   # Endpoint de IA (z-ai-web-dev-sdk)
│   ├── globals.css          # Tema dark + cores
│   ├── layout.tsx           # Layout + ThemeProvider
│   └── page.tsx             # App principal (single page)
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── CarSVG.tsx           # Carro SVG interativo
│   ├── SignaturePad.tsx     # Assinatura digital (canvas)
│   └── theme-provider.tsx
└── lib/
    ├── car-parts.ts         # Catálogo de 22 peças
    ├── colors.ts            # 8 cores de pintura
    ├── company.ts           # Dados da empresa
    └── export.ts            # PDF, Word, WhatsApp, Email, JSON, Print
```

## 📄 Licença

MIT — use livremente para o seu negócio.

---

Desenvolvido para **Cel-Car — Funilaria e Pintura**
CNPJ 35.497.152/0001-26 | (21) 97708-6841 | Rio de Janeiro - RJ
