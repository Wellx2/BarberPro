Concluído! Aqui está o resumo completo do que foi feito e como integrar no frontend:

---

## ✅ Bug de Despesas Corrigido

**Causa:** O backend exigia o campo `category` (obrigatório) que o frontend não enviava. **Solução:** Os campos `category` e `dueDate` foram tornados **opcionais** no `CreateExpenseDto`. O botão **"Criar"** no formulário de Nova Despesa deve funcionar agora sem nenhuma alteração no frontend.

---

## ✅ Módulo de Insumos Criado (Supply Items)

### Banco de Dados

* Nova tabela `supply_items` com suporte a unidades: **Unidade, Caixa, Pacote, ml, Gramas, Litros, Kg, Metros**
* Campos: `name`, `category`, `unit`, `quantity`, `minQuantity` (alerta de baixo estoque), `unitCost`, `totalCost`, `notes`
* Alerta automático quando `quantity ≤ minQuantity`

### API – Base URL: `/api/supply-items`

| Método    | Rota                         | Descrição                                       |
| ---------- | ---------------------------- | ------------------------------------------------- |
| `GET`    | `/supply-items`            | Listar todos (aceita `?category=Higiene`)       |
| `GET`    | `/supply-items/categories` | Listar categorias cadastradas                     |
| `GET`    | `/supply-items/:id`        | Buscar um insumo                                  |
| `POST`   | `/supply-items`            | **Criar** novo insumo                       |
| `PATCH`  | `/supply-items/:id`        | **Editar** insumo                           |
| `PATCH`  | `/supply-items/:id/adjust` | **Ajustar quantidade** (+entrada / -saída) |
| `DELETE` | `/supply-items/:id`        | **Remover** (desativa o registro)           |

### Frontend – usar o arquivo criado

O arquivo `src/services/supplyItemService.ts` já está pronto com TypeScript e todas as chamadas configuradas. Exemplo de uso:

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all my-2 rounded-lg bg-list-hover-subtle border border-gray-500/20"><div class="min-h-7 relative box-border flex flex-row items-center justify-between rounded-t border-b border-gray-500/20 px-2 py-0.5"><div class="font-sans text-sm text-ide-text-color opacity-60">typescript</div><div class="flex flex-row gap-2 justify-end"></div></div><div class="p-3"><div class="w-full h-full text-xs cursor-text"><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk10">import</span><span class="mtk1"> { supplyItemService } </span><span class="mtk10">from</span><span class="mtk1"></span><span class="mtk11">'</span><span class="mtk8">../services/supplyItemService</span><span class="mtk11">'</span><span class="mtk1">;</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk4">// Criar insumo</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk10">await</span><span class="mtk1"> supplyItemService.</span><span class="mtk5">create</span><span class="mtk1">({</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1">  name</span><span class="mtk10">:</span><span class="mtk1"></span><span class="mtk11">'</span><span class="mtk8">Navalha descartável</span><span class="mtk11">'</span><span class="mtk1">, unit</span><span class="mtk10">:</span><span class="mtk1"></span><span class="mtk11">'</span><span class="mtk8">BOX</span><span class="mtk11">'</span><span class="mtk1">, quantity</span><span class="mtk10">:</span><span class="mtk1"></span><span class="mtk3">100</span><span class="mtk1">, unitCost</span><span class="mtk10">:</span><span class="mtk1"></span><span class="mtk3">0.75</span><span class="mtk1">, minQuantity</span><span class="mtk10">:</span><span class="mtk1"></span><span class="mtk3">20</span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk1">});</span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk4">// Dar baixa (ex: usou 10 unidades)</span></div></div><div class="code-line" data-line-number="9" data-line-start="9" data-line-end="9"><div class="line-content"><span class="mtk10">await</span><span class="mtk1"> supplyItemService.</span><span class="mtk5">adjustQuantity</span><span class="mtk1">(id, { delta</span><span class="mtk10">:</span><span class="mtk1"></span><span class="mtk10">-</span><span class="mtk3">10</span><span class="mtk1">, notes</span><span class="mtk10">:</span><span class="mtk1"></span><span class="mtk11">'</span><span class="mtk8">Uso do dia</span><span class="mtk11">'</span><span class="mtk1"> });</span></div></div></div></div></div></div></pre>

### Tipos de unidade disponíveis

`UNIT` → Unidade | `BOX` → Caixa | `PACK` → Pacote | `ML` → Mililitros | `GRAMS` → Gramas | `LITERS` → Litros | `KG` → Quilograma | `METERS` → Metros
