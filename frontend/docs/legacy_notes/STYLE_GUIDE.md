# Design System - BarberPro PWA

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Design Tokens](#design-tokens)
3. [Temas](#temas)
4. [Tipografia](#tipografia)
5. [Espaçamento](#espaçamento)
6. [Cores](#cores)
7. [Componentes UI](#componentes-ui)
8. [Componentes de Feedback](#componentes-de-feedback)
9. [Componentes de Layout](#componentes-de-layout)
10. [Padrões de Uso](#padrões-de-uso)
11. [Acessibilidade](#acessibilidade)
12. [Mobile & PWA](#mobile--pwa)

---

## 🎨 Visão Geral

O BarberPro é um **PWA (Progressive Web App)** com design system profissional e responsivo, otimizado para **mobile-first**. O design segue princípios modernos de UX/UI com suporte a **dark mode** automático.

### Características

- ✅ Mobile-first approach
- ✅ Dark/Light themes automáticos
- ✅ Sistema de design tokens
- ✅ Componentes reutilizáveis
- ✅ Acessibilidade (WCAG 2.1 AA)
- ✅ Performance otimizada
- ✅ PWA-ready com safe areas (notch, home indicator)

---

## 🎯 Design Tokens

Design tokens são valores reutilizáveis que definem a linguagem visual da aplicação.

### Localização

```
src/styles/
├── tokens.ts          # Design tokens centralizados
├── theme.ts           # Temas (light/dark)
├── globals.ts         # CSS reset e estilos globais
└── components.ts      # Estilos base dos componentes
```

### Usando Design Tokens

```typescript
import { colors, spacing, typography, borderRadius } from '@/styles/tokens';

// Cores
const primaryColor = colors.primary[500];     // #f59e0b
const backgroundColor = colors.neutral[50];   // #fafafa

// Espaçamento (múltiplos de 4px)
const padding = spacing[4];  // 1rem (16px)
const margin = spacing[6];   // 1.5rem (24px)

// Tipografia
const fontSize = typography.fontSize.base;           // 1rem
const fontWeight = typography.fontWeight.semibold;   // 600
const lineHeight = typography.lineHeight.normal;     // 1.5

// Arredondamentos
const borderRadius = borderRadius.md;  // 0.75rem
```

---

## 🌓 Temas

### Light Theme (Padrão)

Cores quentes e limpas para uso durante o dia.

```typescript
import { lightTheme } from '@/styles/theme';

// Cores principais
lightTheme.colors.primary          // #f59e0b (dourado)
lightTheme.colors.background       // #ffffff
lightTheme.colors.textPrimary      // #171717
```

### Dark Theme

Cores escuras para reduzir fadiga ocular à noite.

```typescript
import { darkTheme } from '@/styles/theme';

// Cores principais
darkTheme.colors.primary          // #fbbf24
darkTheme.colors.background       // #0a0a0a
darkTheme.colors.textPrimary      // #fafafa
```

### Mudando o Tema

```typescript
import { applyTheme, getSystemTheme, watchSystemTheme, getTheme } from '@/styles/theme';

// Aplicar tema específico
const theme = getTheme('dark');
applyTheme(theme);

// Detectar preferência do sistema
const systemTheme = getSystemTheme(); // 'dark' | 'light'

// Escutar mudanças de tema do sistema
const unwatch = watchSystemTheme((theme) => {
  console.log('Tema mudou para:', theme);
  const newTheme = getTheme(theme);
  applyTheme(newTheme);
});

// Parar de escutar
unwatch();
```

### CSS Custom Properties

Os temas são convertidos em CSS custom properties automaticamente:

```css
/* Disponível globalmente */
body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
}

button {
  background-color: var(--color-primary);
  transition: color var(--transition-fast);
}
```

---

## 📝 Tipografia

### Tipos de Fonte

```typescript
// System stack (performance otimizada)
typography.fontFamily.sans   // Sistema de fontes padrão
typography.fontFamily.mono   // Fonte monoespaçada (código)
```

### Tamanhos

| Variável | Tamanho | Uso |
|----------|--------|-----|
| `xs` | 12px | Labels pequenos, helpers |
| `sm` | 14px | Descrições, helper text |
| `base` | 16px | Texto normal, body |
| `lg` | 18px | Subtítulos pequenos |
| `xl` | 20px | Subtítulos |
| `2xl` | 24px | Títulos secundários (h3, h4) |
| `3xl` | 30px | Títulos principais (h2) |
| `4xl` | 36px | Hero titles (h1) |

### Pesos

```typescript
100 - thin         300 - light          500 - medium       700 - bold
200 - extralight   400 - normal (padrão) 600 - semibold    800 - extrabold
                                                            900 - black
```

### Altura de Linha

```typescript
1        - none (títulos)
1.25     - tight (títulos)
1.375    - snug (cabeçalhos)
1.5      - normal (texto)
1.625    - relaxed (descrições)
2        - loose (textos longos)
```

### Exemplo de Uso

```typescript
// Título principal (h1)
<h1 style={{
  fontSize: typography.fontSize['4xl'],
  fontWeight: typography.fontWeight.bold,
  lineHeight: typography.lineHeight.tight,
}}>
  Bem-vindo ao BarberPro
</h1>

// Texto descritivo (p)
<p style={{
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.normal,
  lineHeight: typography.lineHeight.relaxed,
}}>
  Agende seu corte agora mesmo
</p>
```

---

## 🎲 Espaçamento

Sistema de espaçamento baseado em múltiplos de 4px (1rem).

```typescript
// Valores disponíveis (em pixels)
0    - 0        6  - 24px       12 - 48px
1    - 4px      7  - 28px       16 - 64px
2    - 8px      8  - 32px       20 - 80px
3    - 12px     10 - 40px       24 - 96px
4    - 16px     (base)          32 - 128px
5    - 20px
```

### Convenções de Uso

```typescript
// Padding (interno)
padding: spacing[4]   // 16px interno

// Margin (externo)
margin: spacing[6]    // 24px externo

// Gap (entre elementos)
gap: spacing[3]       // 12px entre items

// Responsivo
// Mobile: spacing[4]  (16px)
// Tablet: spacing[6]  (24px)
// Desktop: spacing[8] (32px)
```

---

## 🎨 Cores

### Paleta de Cores

#### Primary (Dourado - Brand Color)

```
50    - #fffbeb (mais claro)
100   - #fef3c7
200   - #fde68a
300   - #fcd34d
400   - #fbbf24
500   - #f59e0b (MAIN - 60%)
600   - #d97706
700   - #b45309
800   - #92400e
900   - #78350f (mais escuro)
```

**Uso**: Botões primários, links, accents, brand elements.

#### Secondary (Cinza Escuro)

```
50    - #fafafa
100   - #f4f4f5
200   - #e4e4e7
300   - #d4d4d8
400   - #a1a1aa
500   - #71717a
600   - #52525b
700   - #3f3f46
800   - #27272a
900   - #18181b
```

**Uso**: Elementos secundários, texto, borders.

#### Status Colors

```
Success  - #22c55e (verde)
Error    - #ef4444 (vermelho)
Warning  - #f59e0b (amarelo)
Info     - #3b82f6 (azul)
```

### Semântica de Cores

```typescript
// Light Theme
colors.primary          // #f59e0b (ação principal)
colors.primaryHover     // #d97706 (hover)
colors.primaryActive    // #b45309 (active)
colors.primaryLight     // #fef3c7 (background)

colors.success          // #22c55e (sucesso)
colors.error            // #ef4444 (erro)
colors.warning          // #f59e0b (aviso)
colors.info             // #3b82f6 (informação)

colors.textPrimary      // #171717 (texto principal)
colors.textSecondary    // #525252 (texto secundário)
colors.textDisabled     // #a3a3a3 (texto desabilitado)

colors.background       // #ffffff (fundo)
colors.surface          // #ffffff (cards, modais)
colors.border           // #e5e5e5 (borders)
```

---

## 🧩 Componentes UI

### Button

Botão reutilizável com múltiplas variantes.

```typescript
import { Button } from '@/components/ui';

// Variantes
<Button variant="primary">Primário</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Deletar</Button>
<Button variant="success">Confirmar</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="md">Médio (padrão)</Button>
<Button size="lg">Grande</Button>
<Button size="xl">Extra grande</Button>

// Estados
<Button disabled>Desabilitado</Button>
<Button isLoading>Carregando...</Button>
<Button fullWidth>Largura completa</Button>

// Com ícone
<Button icon={<CheckIcon />}>Confirmar</Button>
<Button iconRight={<ArrowIcon />}>Avançar</Button>

// Combinações
<Button variant="danger" isLoading>
  Deletando...
</Button>
```

**Props**

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}
```

### Input

Campo de texto com validação e ícones.

```typescript
import { Input } from '@/components/ui';

// Básico
<Input placeholder="Digite algo..." />

// Com label
<Input 
  label="Email"
  type="email"
  placeholder="seu@email.com"
  required
/>

// Com validação
<Input 
  label="Email"
  error="Email inválido"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// Com sucesso
<Input 
  label="Nome"
  success
  value="João Silva"
/>

// Com ícone
<Input 
  icon={<MagnifyIcon />}
  placeholder="Pesquisar..."
/>

// Com helper text
<Input 
  label="Senha"
  type="password"
  helperText="Mínimo 8 caracteres"
/>

// Tipos suportados
<Input type="text" />      // Texto
<Input type="email" />     // Email
<Input type="password" />  // Senha
<Input type="number" />    // Número
<Input type="tel" />       // Telefone
<Input type="date" />      // Data
<Input type="time" />      // Hora
```

### Select

Dropdown com múltiplas opções.

```typescript
import { Select } from '@/components/ui';

const options = [
  { value: 1, label: 'Corte de Cabelo' },
  { value: 2, label: 'Barba' },
  { value: 3, label: 'Corte + Barba', disabled: true },
];

<Select 
  label="Selecione um serviço"
  options={options}
  placeholder="Escolha uma opção..."
  required
/>

// Com validação
<Select 
  options={options}
  error="Este campo é obrigatório"
/>
```

### Textarea

Área de texto com contador de caracteres.

```typescript
import { Textarea } from '@/components/ui';

<Textarea 
  label="Comentários"
  placeholder="Digite suas observações..."
  charLimit={500}
/>

// Com validação
<Textarea 
  label="Descrição"
  error="Máximo 1000 caracteres"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

### Card

Container com estilo consistente.

```typescript
import { Card } from '@/components/ui';

// Básico
<Card>
  Conteúdo do card
</Card>

// Com subcomponents
<Card elevated>
  <Card.Header>
    <h3>Título</h3>
  </Card.Header>
  
  <Card.Body>
    Conteúdo principal
  </Card.Body>
  
  <Card.Footer>
    <Button>Ação</Button>
  </Card.Footer>
</Card>

// Interativo
<Card interactive onClick={() => navigate('/details')}>
  Clique para ver detalhes
</Card>

// Sem padding
<Card noPadding>
  <img src="image.jpg" />
</Card>
```

---

## 💬 Componentes de Feedback

### Alert

Mensagens de feedback inline.

```typescript
import { Alert } from '@/components/feedback';

// Tipos
<Alert type="success" message="Operação concluída!" />
<Alert type="error" message="Algo deu errado" />
<Alert type="warning" message="Cuidado!" />
<Alert type="info" message="Informação importante" />

// Com título
<Alert 
  type="success"
  title="Sucesso!"
  message="Seu agendamento foi confirmado"
  closeable
/>

// Com ação
<Alert 
  type="warning"
  message="Você tem 1 dia para confirmar"
  action={{
    label: 'Confirmar agora',
    onClick: () => confirm(),
  }}
/>

// Com ícone customizado
<Alert 
  type="info"
  icon={<InfoIcon />}
  message="Nova versão disponível"
/>
```

### Modal

Diálogo flutuante.

```typescript
import { Modal } from '@/components/feedback';
import { useState } from 'react';

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Abrir Modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirmar Ação"
        size="md"
        showCloseButton
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              handleConfirm();
              setIsOpen(false);
            }}>
              Confirmar
            </Button>
          </>
        }
      >
        Deseja continuar com esta ação?
      </Modal>
    </>
  );
}
```

**Props**

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdropClick?: boolean;  // true
  closeOnEscape?: boolean;          // true
  showCloseButton?: boolean;        // true
}
```

### Toast (Notificações)

Notificações temporárias.

```typescript
import { ToastProvider, ToastContainer, useToastShortcuts } from '@/components/feedback';

// Setup (em App.tsx)
<ToastProvider>
  <ToastContainer />
  <YourApp />
</ToastProvider>

// Uso em componentes
export function MyComponent() {
  const { success, error, warning, info } = useToastShortcuts();

  const handleSuccess = () => {
    success('Operação concluída!', 'Sucesso');
  };

  const handleError = () => {
    error('Algo deu errado', 'Erro');
  };

  return (
    <>
      <Button onClick={handleSuccess}>Sucesso</Button>
      <Button onClick={handleError} variant="danger">Erro</Button>
    </>
  );
}
```

---

## 📐 Componentes de Layout

### Container

Wrapper responsivo com max-width.

```typescript
import { Container } from '@/components/layout';

<Container size="lg">
  <h1>Conteúdo centralizado</h1>
</Container>

// Tamanhos
<Container size="sm">    {/* 640px */}
<Container size="md">    {/* 768px */}
<Container size="lg">    {/* 1024px (padrão) */}
<Container size="xl">    {/* 1280px */}
<Container size="2xl">   {/* 1536px */}
<Container size="full">  {/* 100% */}
```

### Grid

Layout em grid com responsive automático.

```typescript
import { Grid } from '@/components/layout';

// Com número de colunas
<Grid cols={3} gap="lg">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>

// Auto-fit (quebra automaticamente)
<Grid autoFit autoFitMin="300px">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>

// Gaps
<Grid cols={2} gap="sm">     {/* 12px */}
<Grid cols={2} gap="md">     {/* 24px (padrão) */}
<Grid cols={2} gap="lg">     {/* 32px */}
<Grid cols={2} gap="xl">     {/* 40px */}
```

### Flex

Layout flexbox com props semânticas.

```typescript
import { Flex } from '@/components/layout';

// Horizontal (padrão)
<Flex justify="between" align="center" gap="md">
  <span>Esquerda</span>
  <span>Direita</span>
</Flex>

// Vertical
<Flex direction="column" align="center" gap="lg">
  <h2>Título</h2>
  <p>Descrição</p>
</Flex>

// Combinações
<Flex 
  direction="column" 
  justify="center" 
  align="center" 
  gap="xl"
  wrap
>
  {items.map(item => (
    <Card key={item.id}>{item.name}</Card>
  ))}
</Flex>

// Props
justify:  'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
align:    'start' | 'end' | 'center' | 'stretch' | 'baseline'
direction: 'row' | 'column' | 'row-reverse' | 'column-reverse'
gap:      'sm' | 'md' | 'lg' | 'xl'
wrap:     boolean
```

---

## 📋 Padrões de Uso

### Formulário Completo

```typescript
import { Container, Flex } from '@/components/layout';
import { Input, Select, Textarea, Button } from '@/components/ui';
import { useToastShortcuts } from '@/components/feedback';
import { useState } from 'react';

export function ServiceForm() {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    duration: '',
    description: '',
  });

  const [errors, setErrors] = useState({});
  const { success, error } = useToastShortcuts();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validação
      if (!formData.name) {
        setErrors({ name: 'Nome é obrigatório' });
        return;
      }

      // API call
      await createService(formData);

      success('Serviço criado com sucesso!');
      setFormData({ name: '', category: '', duration: '', description: '' });
    } catch (err) {
      error(err.message);
    }
  };

  return (
    <Container size="md">
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="lg">
          <h1>Novo Serviço</h1>

          <Input
            label="Nome do Serviço"
            placeholder="ex: Corte Clássico"
            required
            error={errors.name}
            value={formData.name}
            onChange={(e) => 
              setFormData({ ...formData, name: e.target.value })
            }
          />

          <Select
            label="Categoria"
            placeholder="Selecione uma categoria"
            options={[
              { value: 'corte', label: 'Corte' },
              { value: 'barba', label: 'Barba' },
              { value: 'completo', label: 'Corte + Barba' },
            ]}
            value={formData.category}
            onChange={(e) => 
              setFormData({ ...formData, category: e.target.value })
            }
          />

          <Input
            label="Duração (minutos)"
            type="number"
            min="15"
            step="15"
            value={formData.duration}
            onChange={(e) => 
              setFormData({ ...formData, duration: e.target.value })
            }
          />

          <Textarea
            label="Descrição"
            placeholder="Descreva o serviço..."
            charLimit={500}
            value={formData.description}
            onChange={(e) => 
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <Flex gap="md">
            <Button variant="ghost" fullWidth>
              Cancelar
            </Button>
            <Button type="submit" fullWidth>
              Criar Serviço
            </Button>
          </Flex>
        </Flex>
      </form>
    </Container>
  );
}
```

### Card Grid com Ações

```typescript
import { Grid, Container } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAppointments } from '@/hooks';

export function AppointmentsList() {
  const { appointments, loading } = useAppointments();

  return (
    <Container size="lg">
      <h1>Meus Agendamentos</h1>
      
      <Grid autoFit autoFitMin="300px" gap="lg">
        {appointments.map((apt) => (
          <Card key={apt.id} interactive elevated>
            <Card.Header>
              <h3>{apt.barber.name}</h3>
            </Card.Header>

            <Card.Body>
              <p><strong>{apt.service.name}</strong></p>
              <p>{formatDateTime(apt.date)}</p>
              <p>{apt.status}</p>
            </Card.Body>

            <Card.Footer>
              <Button variant="ghost" size="sm">
                Editar
              </Button>
              <Button variant="danger" size="sm">
                Cancelar
              </Button>
            </Card.Footer>
          </Card>
        ))}
      </Grid>
    </Container>
  );
}
```

---

## ♿ Acessibilidade

### ARIA Labels

```typescript
// Botão com label
<button aria-label="Fechar menu">✕</button>

// Links descritivos
<a href="/profile" aria-label="Perfil do usuário">
  <UserIcon />
</a>

// Inputs obrigatórios
<input aria-required="true" />

// Alertas
<div role="alert">
  Sua sessão expirou
</div>
```

### Ordem Tabular

Sempre use `tabIndex` corretamente em elementos focáveis:

```typescript
// ✅ Correto - ordem natural
<input />
<button>Submit</button>

// ❌ Evitar - quebra ordem
<button tabIndex="10" />
<input tabIndex="1" />
```

### Contraste de Cor

Mínimo 4.5:1 para texto normal, 3:1 para texto grande.

| Elemento | Light | Dark | Contraste |
|----------|-------|------|-----------|
| Texto primário | #171717 on #fff | #fafafa on #0a0a0a | ✅ 21:1 |
| Botão primário | #fff on #f59e0b | #000 on #fbbf24 | ✅ 7:1 |

### Focus Visible

Sempre fornecemos outline visível em focus:

```css
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
```

---

## 📱 Mobile & PWA

### Safe Areas (Notch, Home Indicator)

```typescript
// CSS
body {
  padding-left: max(1rem, env(safe-area-inset-left));
  padding-right: max(1rem, env(safe-area-inset-right));
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

// TypeScript
import { safeAreas } from '@/styles/tokens';

const paddingBottom = safeAreas.bottom;  // env(safe-area-inset-bottom)
```

### Responsive Breakpoints

```
xs:  0px      (smartphones pequenos)
sm:  640px    (smartphones)
md:  768px    (tablets)
lg:  1024px   (laptops)
xl:  1280px   (desktops)
2xl: 1536px   (telas grandes)
```

### Mobile Touch Targets

Mínimo 44x44px para elementos interativos:

```typescript
import { touchTargets } from '@/styles/tokens';

const minSize = touchTargets.min;         // 44px
const comfortableSize = touchTargets.comfortable; // 48px
const largeSize = touchTargets.large;     // 56px
```

### PWA Manifest

```json
{
  "name": "BarberPro",
  "short_name": "BarberPro",
  "description": "Agendamentos de barbearia",
  "start_url": "/",
  "display": "standalone",
  "scope": "/",
  "background_color": "#ffffff",
  "theme_color": "#f59e0b",
  "icons": [...]
}
```

### Service Worker

PWA-ready com suporte offline (implementado via Vite).

---

## 🔗 Referências e Recursos

- [Design Tokens](src/styles/tokens.ts)
- [Temas](src/styles/theme.ts)
- [Estilos Globais](src/styles/globals.ts)
- [Componentes UI](src/components/ui/)
- [Componentes Feedback](src/components/feedback/)
- [Componentes Layout](src/components/layout/)

---

## 📞 Suporte

Para dúvidas ou sugestões sobre o Design System, entre em contato com o time de design.
