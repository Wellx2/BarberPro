# 🎨 Visual Guide - Geolocalização + QR Code

## 📱 UI Components Overview

### ShopSelector Modal (Home Page)

```
┌─────────────────────────────────────────┐
│  🏪 NOSSAS UNIDADES                   X │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📷 Paulista (SELECIONADO)       │   │
│  │ Av. Paulista, 1000              │   │
│  │ 📍 2.5 km away                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📷 Morumbi                      │   │
│  │ Shopping Morumbi                │   │
│  │ 📍 8.9 km away                  │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌────────────┐ │
│  │ 🧭 Encontrar meu    │ │ Recalcular │ │
│  │    local            │ │ distâncias │ │
│  └─────────────────────┘ └────────────┘ │
└─────────────────────────────────────────┘
```

### Compartilhar Modal (Dashboard)

```
┌──────────────────────────────────────────┐
│  📤 COMPARTILHAR LINK               X    │
│  Convide clientes para Paulista          │
├──────────────────────────────────────────┤
│                                          │
│  Link Direto (Recomendado)               │
│  ┌────────────────────────────────────┐  │
│  │ https://paulista.barberpro.com     │  │
│  │                          [COPIAR] ✓ │
│  └────────────────────────────────────┘  │
│  ⭐ Simples e profissional               │
│                                          │
│  Link Alternativo                        │
│  ┌────────────────────────────────────┐  │
│  │ https://barberpro.com?shopId=...   │  │
│  │                          [COPIAR]  │  │
│  └────────────────────────────────────┘  │
│  Use como backup                         │
│                                          │
│  ┌─────────────────────┐ ┌────────────┐  │
│  │ 💬 WhatsApp         │ │ 📧 E-mail  │  │
│  └─────────────────────┘ └────────────┘  │
│  ┌──────────────────────────────────────┐ │
│  │ 🟣 Gerar QR Code                    │ │
│  └──────────────────────────────────────┘ │
│                                          │
│  💡 Dicas                                │
│  ✓ Compartilhe via WhatsApp, SMS...     │
│  ✓ Envie por e-mail                     │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### QR Code Generator Modal

```
┌──────────────────────────────────────────┐
│  🟣 PAULISTA                        X    │
│  Gerar QR Code para agendamentos         │
├──────────────────────────────────────────┤
│                                          │
│          ┌──────────────────┐            │
│          │   ▓▓▓▓▓▓▓▓▓▓▓▓   │            │
│          │   ▓ ░░░░░ ▓▓▓   │            │
│          │   ▓ ░   ░ ░░░   │            │
│          │   ▓ ░ ▓▓▓ ░░░   │            │
│          │   ▓ ░░░░░ ░░░   │            │
│          │   ▓ ▓▓▓▓▓▓▓▓▓   │            │
│          │   ▓▓▓▓▓▓▓▓▓▓▓▓   │            │
│          └──────────────────┘            │
│                                          │
│  Link codificado:                        │
│  ┌──────────────────────────────────┐    │
│  │ https://paulista.barberpro.com   │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌────────────────────┐ ┌────────────┐   │
│  │ 📥 Baixar QR Code  │ │ 🖨️ Imprimir│   │
│  │ (PNG)              │ │            │   │
│  └────────────────────┘ └────────────┘   │
│  ┌──────────────────────────────────┐    │
│  │ 📋 Copiar link                   │    │
│  └──────────────────────────────────┘    │
│                                          │
│  💡 Dicas de Uso                        │
│  ✓ Imprima 15x15cm a 50x50cm            │
│  ✓ Cole em local visível                │
│  ✓ Certifique-se de boa iluminação      │
│  ✓ Teste a leitura antes                │
│  ✓ Considere plastificar                │
│                                          │
│  📏 Tamanhos Recomendados                │
│  ┌─────────┐ ┌────────────┐             │
│  │ 15x15cm │ │ 30x30cm    │             │
│  │Pequeno  │ │ Médio ⭐   │             │
│  │Adesivos │ │ Recomendado│             │
│  └─────────┘ └────────────┘             │
└──────────────────────────────────────────┘
```

---

## 🔄 Fluxos de Interação

### Fluxo 1: Primeiro Acesso (Geolocalização)

```
┌─────────────────────────────────────┐
│ Cliente acessa barberpro.com        │
└────────────────┬────────────────────┘
                 │
                 ▼
      ┌─────────────────────────────┐
      │ ShopContext verifica:        │
      │ 1. Subdomain? ──NO──┐       │
      │ 2. Query param? ──NO─┤       │
      │ 3. LocalStorage? ─NO─┤       │
      └──────────────┬────────┘       │
                     │YES ─── Usa direto
                     │
                     ▼
        ┌────────────────────────┐
        │ Mostra ShopSelector    │
        │ com múltiplas lojas    │
        └──────────┬─────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
   [Clica em uma]      [Clica em
    loja manualmente]   "Encontrar meu local"]
         │                   │
         │                   ▼
         │          ┌──────────────────────┐
         │          │ Solicita geolocalização│
         │          │ (browser permission) │
         │          └──────────┬───────────┘
         │                     │
         │                     ▼
         │          ┌──────────────────────┐
         │          │ Calcula distância     │
         │          │ para cada loja        │
         │          └──────────┬───────────┘
         │                     │
         │                     ▼
         │          ┌──────────────────────┐
         │          │ Filtra < 2km          │
         │          └──────────┬───────────┘
         │                     │
         │                ┌────┴─────┬────┐
         │                │           │    │
         │         1 loja  2+ lojas   0    │
         │           │      │         │    │
         │           │      │         │    │
         │           ▼      ▼         ▼    │
         │      [AUTO]  [MOSTRA]  [MOSTRA │
         │       SEL.   COM DIST]  TODAS]  │
         │           │      │         │    │
         │           │      │         │    │
         └───────────┴──────┴─────────┘    │
                     │                     │
                     ▼                     │
              ┌──────────────────┐         │
              │ Seleciona loja   │         │
              │ Fecha modal      │         │
              │ Renderiza home   │         │
              └──────────────────┘         │
                     │                     │
                     └─────────────────────┘
```

### Fluxo 2: Compartilhar + QR Code

```
┌──────────────────────────────┐
│ Barbeiro no Dashboard        │
└──────────┬───────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Clica em         │
    │ "Compartilhar"   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Modal: Compartilhar Link │
    │                          │
    │ • Link Direto            │
    │ • Link Alternativo       │
    │ • Botão WhatsApp         │
    │ • Botão E-mail           │
    │ • Botão QR Code ◄────┐   │
    └────────┬─────────────┼───┘
             │             │
    ┌────────┴─────────┐   │
    │                  │   │
    ▼                  ▼   │
 [Clica           [Clica em│
  WhatsApp/         Gerar] │
  Email]                   │
    │                      │
    │                ┌─────┘
    │                │
    │                ▼
    │        ┌─────────────────────┐
    │        │ Modal: QR Code      │
    │        │                     │
    │        │ • QR Visível        │
    │        │ • Link display      │
    │        │ • Botão Baixar ◄──┐ │
    │        │ • Botão Imprimir ◄┼─┤
    │        │ • Botão Copiar ◄──┤ │
    │        │ • Dicas            │ │
    │        └────────┬────────────┘ │
    │                 │              │
    │         ┌───────┼──────┬───────┴─┐
    │         │       │      │         │
    │         ▼       ▼      ▼         ▼
    │      [PNG]  [PRINT] [COPY]    [INFO]
    │      baixado formatado copiadoshown
    │         │       │      │         │
    │         ▼       ▼      ▼         ▼
    │      Arquivo Print  Toast ✓   Modal
    │      salvo      preview  fechado fecha
    │              ativo
    │
    ▼
Cumpre objetivo de compartilhamento
```

### Fluxo 3: Deep Linking via URL

```
┌─────────────────────────────────────────┐
│ Cliente recebe link:                    │
│ https://paulista.barberpro.com          │
│ ou                                      │
│ https://barberpro.com?shopId=shop-1     │
└────────────┬────────────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ App carrega            │
    │ ShopContext.init()     │
    └────────┬───────────────┘
             │
             ▼
    ┌────────────────────────────────────┐
    │ Verifica URL:                      │
    │ 1. Subdomain paulista → match? YES │
    └────────┬─────────────────────────────┘
             │
             ▼
    ┌────────────────────────────────────┐
    │ Shop encontrada: Paulista          │
    │ setShop(paulista)                  │
    │ localStorage = paulista            │
    │ document.title = "Paulista - ..."  │
    └────────┬─────────────────────────────┘
             │
             ▼
    ┌────────────────────────────────────┐
    │ Renderiza Home com Paulista        │
    │ pré-selecionada                    │
    │ Sem mostrar modal de seleção       │
    └────────────────────────────────────┘
```

---

## 🎯 Casos de Uso

### Caso 1: Cliente no WhatsApp

```
Barbeiro no BarberDashboard
        ↓
Clica "Compartilhar"
        ↓
Clica "WhatsApp"
        ↓
WhatsApp abre com mensagem:
"Olá! Agende seu corte comigo aqui: https://paulista.barberpro.com"
        ↓
Cliente recebe no WhatsApp
        ↓
Clica no link
        ↓
App abre com Paulista auto-selecionado
        ↓
Cliente pode agendar direto
```

### Caso 2: Cliente Vendo QR Code na Entrada

```
Cliente chega na barbearia
        ↓
Vê QR Code na parede (15x30cm)
        ↓
Aponta câmera
        ↓
Browser auto-abre:
https://paulista.barberpro.com
        ↓
App detecta subdomain
        ↓
Paulista auto-selecionada
        ↓
Cliente marca consulta
```

### Caso 3: Cliente com Permissão de Geolocalização

```
Cliente acessa barberpro.com
        ↓
Vê modal com 2 lojas
        ↓
Clica "Encontrar meu local"
        ↓
Autoriza geolocalização
        ↓
Sistema calcula:
  • Distância para Paulista: 2.3 km
  • Distância para Morumbi: 8.9 km
        ↓
Mostra com distâncias
        ↓
Cliente seleciona Paulista (mais perto)
        ↓
Ou se houver apenas 1 < 2km:
   Auto-seleciona automaticamente
```

---

## 🛠️ Estrutura de Componentes

```
App
├── Home.tsx
│   └── ShopSelector.tsx ◄── Geolocalização
│       ├── useGeolocation hook
│       ├── findNearbyShops
│       └── calculateDistance
│
├── BarberDashboard.tsx
│   └── ShareLink.tsx ◄── Compartilhar
│       └── QRCodeGenerator.tsx ◄── QR Code
│           └── qrcode.react
│
└── AdminDashboard.tsx
    └── ShareLink.tsx ◄── Compartilhar
        └── QRCodeGenerator.tsx ◄── QR Code
```

---

## 📊 Dados Fluindo

### ShopContext
```
shops: Shop[] = [
  {
    id: 'shop-1',
    name: 'Paulista',
    coordinates: { lat: -23.5505, lng: -46.6333 }
  },
  {
    id: 'shop-2',
    name: 'Morumbi',
    coordinates: { lat: -23.6157, lng: -46.7170 }
  }
]

shop: Shop = { ... Paulista ... }
```

### useGeolocation Hook
```
{
  location: {
    latitude: -23.55,
    longitude: -46.63,
    accuracy: 20,
    timestamp: 1234567890
  },
  loading: false,
  error: null,
  requestLocation: () => { ... }
}
```

### QRCodeGenerator
```
Props:
  isOpen: true
  onClose: () => setShowQRCode(false)
  shopName: "Paulista"
  deepLink: "https://paulista.barberpro.com"
```

---

## 🎨 Paleta de Cores

```
🔵 Geolocalização: 
   from-blue-600 to-blue-700
   
🟣 QR Code: 
   from-purple-500 to-purple-600
   
🟢 WhatsApp: 
   from-green-500 to-green-600
   
🔵 Email: 
   from-blue-500 to-blue-600
   
🟠 Ação Primária: 
   from-amber-600 to-orange-500
```

---

## ✨ Animações

```
Modal entrada: animate-fade-in (fade in suave)
Botão hover: transition-all (transição suave)
Copiar feedback: toast notification com ✓
```

---

## 📏 Responsividade

```
Desktop (> 768px):
  ├── Modal com max-width-md
  ├── Grid 2 colunas para buttons
  └── Padding 6

Mobile (< 768px):
  ├── Modal com 100% width - padding
  ├── Buttons fullwidth
  └── Padding 4 (menor)
```

---

## 🚀 Performance

- Geolocalização: Cache 5 min
- QR Code: Renderizado sob demanda
- Deep linking: Sem requisições adicionais
- Distâncias: Calculadas com Haversine (otimizado)

