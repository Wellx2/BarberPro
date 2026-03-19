# 📚 Guia de Padrões de Estilo - BarberPro

## Importância
Este arquivo documenta os padrões Tailwind CSS reutilizáveis definidos em `src/styles/patterns.css`. Use estes padrões em **novas features** para manter consistência e reduzir duplicação.

---

## 🏷️ Typography Patterns

### Labels e Tags

```tsx
// Categoria de produto - XS (9px)
<span className="label-xs">Produtos</span>

// Tag padrão - SM (10px) 
<span className="label-sm">Novo</span>

// Tag cinza discreta
<span className="label-sm-gray">Informação</span>

// Texto auxiliar
<p className="helper-text">Configure sua agenda</p>
```

---

## 🎨 Border Radius Patterns

```tsx
// Cards grandes (35px)
<div className="radius-card">Conteúdo</div>

// Inputs e campos (25px)
<input className="radius-input" />

// Badges pequenos (full)
<span className="radius-badge">VIP</span>
```

---

## 📦 Container Patterns

### Card Base

```tsx
// Card com hover e border
<div className="card-base">Conteúdo</div>

// Card com flex column (para layout vertical)
<div className="card-base-flex">
  <img src="..." />
  <h3>Título</h3>
</div>
```

### Input Base

```tsx
// Input com estilo consistente
<input 
  type="text" 
  className="input-base" 
  placeholder="Digite..."
/>

<textarea className="input-base" placeholder="..." />
```

---

## 📐 Layout Patterns

```tsx
// Centralizado
<div className="flex-center">
  <Icon size={32} />
</div>

// Espaço entre (header com buttons)
<div className="flex-between">
  <h1>Título</h1>
  <button>Ação</button>
</div>

// Coluna centralizada
<div className="flex-col-center">
  <Icon />
  <p>Mensagem</p>
</div>
```

---

## 🚨 Background/Alert Patterns

```tsx
// Alert com gradiente amber
<div className="bg-alert-amber p-6 rounded-[30px]">
  <Info size={24} />
  <p>Mensagem de alerta</p>
</div>

// Alert de sucesso
<div className="bg-alert-success p-6 rounded-[30px]">
  <Check size={24} />
  <p>Operação realizada!</p>
</div>
```

---

## 🏷️ Badge/Tag Patterns

```tsx
// Badge destacado
<span className="badge-amber">Ativo no Portal</span>

// Badge em linha (em cards)
<span className="badge-inline-amber">
  <Icon size={14} />
  Status
</span>
```

---

## ✅ State Patterns

```tsx
// Feature ativado
<div className={`p-4 rounded-[25px] border ${enabled ? 'feature-enabled' : 'feature-disabled'}`}>
  {enabled ? '✓ Ativado' : '○ Desativado'}
</div>
```

---

## 🎬 Animation Patterns

```tsx
// Fade in simples
<div className="animate-fade-in">Conteúdo</div>

// Slide pela direita (sidebars)
<div className="animate-slide-in-right">
  Menu lateral
</div>
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Card de Produto

```tsx
<div className="card-base-flex">
  <img src={image} className="radius-input" alt="..." />
  <div className="p-4 space-y-3">
    <span className="label-xs">Categoria</span>
    <h3 className="dark-text font-black">Nome do Produto</h3>
    <p className="helper-text-mt">Descrição breve</p>
    <button className="badge-inline-amber">
      <Plus size={14} />
      Adicionar
    </button>
  </div>
</div>
```

### Exemplo 2: Alert/Notificação

```tsx
<div className="bg-alert-amber p-6 rounded-[30px] flex items-center gap-4">
  <Info size={24} />
  <div>
    <h3 className="dark-text font-black">Atenção</h3>
    <p className="helper-text-mt">Verifique suas configurações</p>
  </div>
</div>
```

### Exemplo 3: Form Input

```tsx
<div className="space-y-3">
  <label className="label-sm-gray">Nome</label>
  <input 
    className="input-base" 
    type="text" 
    placeholder="Digite seu nome"
  />
</div>
```

---

## 📋 Checklist para Novas Features

Ao criar novas páginas/componentes:

- [ ] Use `label-xs` ou `label-sm` para categorias/tags
- [ ] Use `card-base` ou `card-base-flex` para containers
- [ ] Use `input-base` para todos os inputs
- [ ] Use `radius-card` (35px) para cards principais
- [ ] Use `radius-input` (25px) para inputs
- [ ] Use `flex-between` para headers com botões
- [ ] Use `badge-amber` para status destacados
- [ ] Use `bg-alert-amber` para alertas
- [ ] Use `dark-text` para textos que precisam respeitar dark mode
- [ ] Use `animate-fade-in` para animações de entrada

---

## ❌ Evitar

```tsx
// ❌ Não faça isso em novas features:
<span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em]">
  Categoria
</span>

// ✅ Faça isso:
<span className="label-xs">Categoria</span>
```

---

## 🔍 Encontrou um padrão repetido?

Se ao desenvolver uma nova feature você notar um padrão que se repete em múltiplos lugares:

1. **Documente o padrão aqui**
2. **Adicione a classe em `src/styles/patterns.css`**
3. **Use a classe nas novas features**

Exemplo: Se você usa `"w-24 h-24 rounded-[35px] object-cover"` 3 vezes, crie:
```css
.avatar-lg {
  @apply w-24 h-24 rounded-[35px] object-cover;
}
```

---

## 📞 Suporte

Para dúvidas sobre padrões ou para sugerir novos padrões, consulte este guia ou abra uma issue.
