# Guia: Geolocalização + QR Code

## 🎯 O Que Foi Implementado

### 1. **Geolocalização Inteligente (ShopSelector)**
   - Detecta localização do cliente automaticamente
   - Mostra distância em km para cada unidade
   - Auto-seleciona se houver apenas 1 loja próxima
   - Botão "Encontrar meu local" para ativar geolocalização sob demanda

### 2. **Deep Linking com Fallback**
   - **Primeiro**: Subdomain (paulista.barberpro.com)
   - **Segundo**: Query param (?shopId=xxx)
   - **Terceiro**: Geolocalização (encontra unidade mais próxima)
   - **Quarto**: LocalStorage (última seleção)
   - **Quinto**: Padrão (primeira unidade)

### 3. **QR Code Generator**
   - Gera QR code a partir do link de deep linking
   - Baixa como PNG para imprimir
   - Função de impressão formatada
   - Copia link para a área de transferência

## 🚀 Como Testar

### Teste 1: Geolocalização no ShopSelector

1. Abra [http://localhost:3000](http://localhost:3000)
2. Clique em "Nossas Unidades" (ícone no home)
3. Você deve ver 2 unidades com distâncias calculadas
4. Clique em "Encontrar meu local" (novo botão azul)
5. Autorize a geolocalização no navegador
6. As distâncias devem atualizar

**Esperado:**
- Botão "Detectando localização..." enquanto busca
- Distâncias em km aparecem após autorização
- Se apenas 1 unidade próxima, auto-seleciona e fecha

### Teste 2: Deep Linking por Subdomain

1. Abra [http://paulista.barberpro.com:3000](http://paulista.barberpro.com:3000)
   (Nota: Em produção, seria paulista.barberpro.com)
2. Unidade "Paulista" deve ser auto-selecionada
3. Verifique que o nome da página mostra "Paulista - Sistema de Agendamento"

**Esperado:**
- Página carrega com Paulista pré-selecionada
- Nenhum modal de seleção aparece (só 1 loja)

### Teste 3: Deep Linking por Query Param

1. Abra [http://localhost:3000?shopId=shop-2](http://localhost:3000?shopId=shop-2)
2. Unidade "Morumbi" deve ser auto-selecionada

**Esperado:**
- Página carrega com Morumbi pré-selecionada

### Teste 4: QR Code Generator

1. Faça login como Barbeiro ou Admin
2. Abra "Compartilhar" no dashboard
3. Modal "Compartilhar Link" aparece
4. Clique em "Gerar QR Code" (novo botão roxo)
5. Modal de QR Code abre
6. Clique em "Baixar QR Code (PNG)"
7. Arquivo `qrcode-paulista.png` deve ser baixado

**Esperado:**
- QR code visível no modal
- Botões funcionam: Baixar, Imprimir, Copiar link
- Dicas de uso exibidas
- Tamanhos recomendados mostrados

### Teste 5: Compartilhamento de QR Code

1. No modal de QR Code, clique em "Imprimir"
2. Preview de impressão abre com:
   - Nome da unidade centralizado
   - QR Code em tamanho grande
   - Link codificado
   - Dicas de uso

**Esperado:**
- Janela de print normal do navegador (Ctrl+P)
- QR code formatado para impressão
- Texto claro e legível

## 📝 Componentes Principais

### ShopSelector.tsx
```tsx
// Novo hook de geolocalização
const { location, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();

// Novo estado para lojas próximas
const [nearbyShops, setNearbyShops] = useState<any[]>([]);

// Auto-detecta na primeira renderização
if (!location) requestLocation();

// Auto-seleciona se apenas 1 próxima
if (nearbyShops.length === 1) setShop(nearbyShops[0]);
```

### ShareLink.tsx
```tsx
// Novo estado para mostrar QR Code
const [showQRCode, setShowQRCode] = useState(false);

// Novo botão para abrir gerador
<button onClick={() => setShowQRCode(true)}>
  Gerar QR Code
</button>

// Modal de QR Code integrado
<QRCodeGenerator 
  isOpen={showQRCode}
  onClose={() => setShowQRCode(false)}
  shopName={shop.name}
  deepLink={subdomainUrl}
/>
```

### QRCodeGenerator.tsx
```tsx
// Usa qrcode.react (QRCodeSVG)
import { QRCodeSVG } from 'qrcode.react';

// Gera QR a partir do deepLink
<QRCodeSVG value={deepLink} size={256} />

// Download como PNG
const handleDownload = () => {
  const canvas = qrRef.current.querySelector('canvas');
  const url = canvas.toDataURL('image/png');
  // Cria link e clica
}

// Impressão formatada
const handlePrint = () => {
  const printWindow = window.open('');
  printWindow.document.write(/* HTML formatado */);
  printWindow.print();
}
```

### useGeolocation Hook
```tsx
// Retorna
{
  location: { latitude, longitude, accuracy, timestamp },
  loading: boolean,
  error: string | null,
  requestLocation: () => void
}

// Funções auxiliares
calculateDistance(lat, lng) // Haversine formula
findNearbyShops(shops, lat, lng, radiusKm) // Retorna array ordenado
```

## 🔧 Configurações

### Coordenadas das Lojas (constants.ts)

```tsx
{
  id: 'shop-1',
  name: 'Paulista',
  // ... outros campos
  coordinates: { lat: -23.5505, lng: -46.6333 }
}
```

### Raio de Geofencing (ShopSelector.tsx)

```tsx
// Detectar lojas dentro de 2km
const nearby = findNearbyShops(shops, lat, lng, 2);
```

## ⚙️ Permissões do Navegador

### Geolocalização
- Navegador solicita permissão ao primeiro uso
- Pode ser concedida apenas uma vez
- Pode ser revogada em Configurações > Privacidade > Localização

### QR Code
- Nenhuma permissão necessária
- Usa geolocalização do dispositivo se disponível
- Fallback: permite seleção manual

## 🐛 Troubleshooting

### "Geolocalização não disponível"
- Navegador não suporta Geolocation API (navegadores antigos)
- Solução: Use query param ou subdomain

### "QR Code não aparece"
- Biblioteca qrcode.react não importada corretamente
- Verifique: `import { QRCodeSVG } from 'qrcode.react'`

### "Distâncias não calculam"
- Lojas não têm coordenadas definidas
- Verifique constants.ts - adicione `coordinates` para cada shop

### "Auto-seleção não funciona"
- Geolocalização não autorizada
- Clique em "Encontrar meu local" e autorize
- Ou use subdomain/query param

## 🎨 Estilos

### Buttons

- **Azul (Geolocalização)**: `from-blue-600 to-blue-700`
- **Verde (WhatsApp)**: `from-green-500 to-green-600`
- **Roxo (QR Code)**: `from-purple-500 to-purple-600`
- **Ambar (Download)**: `from-amber-600 to-orange-500`

### Ícones

- Geolocalização: `<Compass />`
- QR Code: `<QrCode />`
- Download: `<Download />`
- Impressão: `<Printer />`

## 📱 Responsividade

Todos os modais são mobile-first com:
- Padding adequado em telas pequenas
- Overflow scrollable se necessário
- Touch-friendly button sizing (44x44px mín)

## ✅ Checklist de Implementação

- [x] Hook `useGeolocation` criado e testado
- [x] `ShopSelector` atualizado com geolocalização
- [x] Deep linking funcional (subdomain + query param)
- [x] `QRCodeGenerator` component criado
- [x] `ShareLink` integrado com QR Code
- [x] Lojas mock com coordenadas
- [x] Sem erros de compilação TypeScript
- [x] Notificações de sucesso/erro funcionando
- [x] Responsividade testada em mobile

## 🚀 Próximos Passos

1. **Testar em produção** com DNS configurado para subdomínios
2. **Adicionar cache** de geolocalização (localStorage)
3. **Implementar analytics** para rastrear qual loja é mais acessada
4. **Dark mode** para o QR Code Generator
5. **Google OAuth** (próxima feature solicitada)
