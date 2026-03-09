# 🚀 Guia Rápido - Como Começar com o Design System

## 📖 Documentação Disponível

1. **[STYLE_GUIDE.md](./STYLE_GUIDE.md)** - Documentação completa com exemplos
2. **[DESIGN_SYSTEM_SUMMARY.md](./DESIGN_SYSTEM_SUMMARY.md)** - Sumário executivo
3. **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Status da implementação
4. **[README.md](./README.md)** - Documentação geral do projeto

---

## ⚡ Instalação Rápida

```bash
# Clone o repositório
git clone <repo-url>
cd barberpro/frontend

# Instale dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev

# Acesse http://localhost:5173
```

---

## 🎨 Usando Design Tokens

```typescript
import { colors, spacing, typography, borderRadius } from '@/styles/tokens';

// Cores
const primaryColor = colors.primary[500];      // #f59e0b
const backgroundColor = colors.neutral[50];    // #fafafa

// Espaçamento
const padding = spacing[4];  // 16px
const margin = spacing[6];   // 24px

// Tipografia
const fontSize = typography.fontSize.lg;       // 18px
const fontWeight = typography.fontWeight.bold; // 700

// Borders
const radius = borderRadius.md;  // 12px
```

---

## 🌓 Temas (Light/Dark)

O tema é detectado automaticamente pela preferência do sistema, mas você pode controlar manualmente:

```typescript
import { applyTheme, getTheme, watchSystemTheme } from '@/styles/theme';

// Aplicar tema específico
const darkTheme = getTheme('dark');
applyTheme(darkTheme);

// Detectar preferência do sistema
const systemTheme = getSystemTheme();  // 'dark' | 'light'

// Escutar mudanças
const unwatch = watchSystemTheme((newTheme) => {
  const theme = getTheme(newTheme);
  applyTheme(theme);
});
```

---

## 🧩 Componentes Base

### Button
```typescript
import { Button } from '@/components/ui';

// Básico
<Button>Click me</Button>

// Variantes
<Button variant="primary">Primário</Button>
<Button variant="danger">Deletar</Button>
<Button variant="ghost">Voltar</Button>

// Com ícone e loading
<Button icon={<CheckIcon />} isLoading={isLoading}>
  Confirmar
</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="lg">Grande</Button>
```

### Input
```typescript
import { Input } from '@/components/ui';

<Input
  label="Email"
  type="email"
  placeholder="seu@email.com"
  icon={<MailIcon />}
  error={error}
  required
/>
```

### Card
```typescript
import { Card } from '@/components/ui';

<Card interactive elevated>
  <Card.Header>Título</Card.Header>
  <Card.Body>Conteúdo</Card.Body>
  <Card.Footer>Rodapé</Card.Footer>
</Card>
```

### Select & Textarea
```typescript
import { Select, Textarea } from '@/components/ui';

<Select
  label="Serviço"
  options={[{ value: 1, label: 'Corte' }]}
/>

<Textarea
  label="Comentários"
  charLimit={500}
/>
```

---

## 💬 Componentes de Feedback

### Alert
```typescript
import { Alert } from '@/components/feedback';

<Alert
  type="success"
  title="Sucesso!"
  message="Operação concluída"
  closeable
/>
```

### Modal
```typescript
import { Modal } from '@/components/feedback';
import { useState } from 'react';

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Abrir</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirmar"
      >
        Deseja continuar?
      </Modal>
    </>
  );
}
```

### Toast
```typescript
import { useToastShortcuts } from '@/components/feedback';

export function MyComponent() {
  const { success, error } = useToastShortcuts();

  const handleClick = async () => {
    try {
      await doSomething();
      success('Operação concluída!');
    } catch (err) {
      error(err.message);
    }
  };

  return <Button onClick={handleClick}>Executar</Button>;
}
```

---

## 📐 Componentes de Layout

### Container (Centralização)
```typescript
import { Container } from '@/components/layout';

<Container size="lg">
  <h1>Conteúdo centralizado</h1>
</Container>
```

### Grid (Responsive)
```typescript
import { Grid } from '@/components/layout';

// Auto-fit (recomendado)
<Grid autoFit autoFitMin="300px" gap="lg">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
</Grid>

// Colunas fixas
<Grid cols={3} gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>
```

### Flex (Flexbox)
```typescript
import { Flex } from '@/components/layout';

// Horizontal (padrão)
<Flex justify="between" align="center">
  <span>Esquerda</span>
  <span>Direita</span>
</Flex>

// Vertical
<Flex direction="column" gap="lg">
  <h2>Título</h2>
  <p>Descrição</p>
</Flex>
```

---

## 🎯 Componentes do Domínio

### BarberCard
```typescript
import { BarberCard } from '@/components/domain';

const barber = {
  id: '1',
  name: 'João Silva',
  specialty: 'Cortes Modernos',
  rating: 4.8,
  reviews: 120,
  location: 'Centro, São Paulo',
  yearsExperience: 5,
  isOnline: true,
  image: 'https://...',
};

<BarberCard
  barber={barber}
  onViewProfile={() => navigate(`/barber/${barber.id}`)}
  onBookAppointment={() => startBooking()}
/>
```

### ServiceCard
```typescript
import { ServiceCard } from '@/components/domain';

const service = {
  id: '1',
  name: 'Corte + Barba',
  description: 'Corte moderno com barba feita',
  price: 65.00,
  duration: 45,
  category: 'Completo',
  image: 'https://...',
};

<ServiceCard
  service={service}
  onBook={() => startBooking(service.id)}
  compact
/>
```

### AppointmentCard
```typescript
import { AppointmentCard } from '@/components/domain';

const appointment = {
  id: '1',
  date: new Date('2025-01-20'),
  time: '14:30',
  duration: 45,
  barber: { id: '1', name: 'João Silva' },
  client: { id: '123', name: 'Pedro' },
  service: { id: '1', name: 'Corte + Barba', price: 65.00 },
  status: 'confirmed',
  location: 'Rua Principal, 100',
};

<AppointmentCard
  appointment={appointment}
  showBarber
  onCancel={() => cancelAppointment(appointment.id)}
/>
```

---

## 📝 Exemplo Completo: Formulário de Serviço

```typescript
import { Container, Flex, Grid } from '@/components/layout';
import { Input, Select, Textarea, Button, Card } from '@/components/ui';
import { useToastShortcuts } from '@/components/feedback';
import { useState } from 'react';

export function ServiceForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    duration: '',
    price: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const { success, error } = useToastShortcuts();

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' })); // Clear error
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Nome é obrigatório';
    if (!formData.category) newErrors.category = 'Categoria é obrigatória';
    if (!formData.duration) newErrors.duration = 'Duração é obrigatória';
    if (!formData.price) newErrors.price = 'Preço é obrigatório';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      
      // API call
      await createService(formData);
      
      success('Serviço criado com sucesso!');
      setFormData({
        name: '',
        category: '',
        duration: '',
        price: '',
        description: '',
      });
    } catch (err) {
      error(err.message || 'Erro ao criar serviço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md">
      <Card>
        <Card.Header>
          <h1>Novo Serviço</h1>
        </Card.Header>

        <Card.Body>
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="lg">
              <Input
                label="Nome do Serviço"
                placeholder="ex: Corte Clássico"
                required
                error={errors.name}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />

              <Select
                label="Categoria"
                placeholder="Selecione uma categoria"
                options={[
                  { value: 'corte', label: 'Corte' },
                  { value: 'barba', label: 'Barba' },
                  { value: 'completo', label: 'Corte + Barba' },
                ]}
                error={errors.category}
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
              />

              <Grid cols={2} gap="md">
                <Input
                  label="Duração (minutos)"
                  type="number"
                  min="15"
                  step="15"
                  error={errors.duration}
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  required
                />

                <Input
                  label="Preço (R$)"
                  type="number"
                  step="0.01"
                  min="0"
                  error={errors.price}
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  required
                />
              </Grid>

              <Textarea
                label="Descrição"
                placeholder="Descreva o serviço..."
                charLimit={500}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </Flex>
          </form>
        </Card.Body>

        <Card.Footer>
          <Flex gap="md">
            <Button variant="ghost" fullWidth>
              Cancelar
            </Button>
            <Button
              type="submit"
              fullWidth
              isLoading={loading}
              onClick={handleSubmit}
            >
              Criar Serviço
            </Button>
          </Flex>
        </Card.Footer>
      </Card>
    </Container>
  );
}
```

---

## 📱 Exemplo: Grid de Barbeiros

```typescript
import { Container, Grid } from '@/components/layout';
import { BarberCard } from '@/components/domain';
import { useBarbers } from '@/hooks';
import { useNavigate } from 'react-router-dom';

export function BarbersPage() {
  const { barbers, loading } = useBarbers();
  const navigate = useNavigate();

  if (loading) {
    return <Container size="lg">Carregando...</Container>;
  }

  return (
    <Container size="lg">
      <h1>Nossos Barbeiros</h1>
      <p>Escolha seu barbeiro preferido para agendar</p>

      <Grid autoFit autoFitMin="300px" gap="lg">
        {barbers.map((barber) => (
          <BarberCard
            key={barber.id}
            barber={barber}
            onViewProfile={() => navigate(`/barber/${barber.id}`)}
            onBookAppointment={() => navigate(`/booking/${barber.id}`)}
          />
        ))}
      </Grid>
    </Container>
  );
}
```

---

## 🔧 Estrutura de Pastas

```
src/
├── styles/                 # Design System
│   ├── tokens.ts          # Design tokens
│   ├── theme.ts           # Temas light/dark
│   ├── globals.ts         # CSS global
│   └── components.ts      # Component styles
├── components/
│   ├── ui/                # Base components
│   ├── feedback/          # Modal, Toast, Alert
│   ├── layout/            # Container, Grid, Flex
│   └── domain/            # BarberCard, ServiceCard, etc
├── pages/                 # Page components
├── context/               # React Context
├── hooks/                 # Custom hooks
├── services/              # API services
├── utils/                 # Helper functions
└── types/                 # TypeScript types
```

---

## 📚 Leitura Recomendada

1. **Comece aqui**: [DESIGN_SYSTEM_SUMMARY.md](./DESIGN_SYSTEM_SUMMARY.md)
2. **Componentes detalhados**: [STYLE_GUIDE.md](./STYLE_GUIDE.md)
3. **Projeto geral**: [README.md](./README.md)
4. **Checklist**: [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)

---

## 🆘 Troubleshooting

### "Design tokens não estão sendo aplicados"
```typescript
// Certifique-se que App.tsx está inicializando o tema
import { applyTheme, getSystemTheme } from '@/styles/theme';

// No useEffect do App.tsx:
const systemTheme = getSystemTheme();
const theme = getTheme(systemTheme);
applyTheme(theme);
```

### "Toast não está aparecendo"
```typescript
// Certifique-se que ToastProvider está no App.tsx
<ToastProvider>
  <ToastContainer />
  {/* resto da app */}
</ToastProvider>
```

### "Componentes não estão tipados corretamente"
```typescript
// Use imports diretos dos barrels
import { Button, Input, Card } from '@/components/ui';
// NÃO: import { Button } from '@/components/ui/Button';
```

---

## 🚀 Próximos Passos

1. ✅ Explorar componentes disponíveis
2. ✅ Ler STYLE_GUIDE.md completo
3. ✅ Criar primeira página usando os componentes
4. ✅ Integrar com backend API
5. ✅ Adicionar testes unitários

---

**Happy coding! 🎨✨**

Dúvidas? Verifique a documentação ou abra uma issue no repositório.
