# Plano de Implementação: Estabilização Final de Data/Hora (Fim do Bug 23:59)

Este plano visa eliminar definitivamente o bug de exibição "23:59" e garantir que todos os agendamentos apareçam no horário correto em todos os dashboards.

## 1. Diagnóstico do Bug "23:59"

Durante o QA em `http://localhost:3001`, identificamos que agendamentos feitos para horários matinais (ex: 10:00) ou vespertinos (ex: 16:00) estão sendo exibidos como **23:59** no dashboard.
- **Causa**: Lógicas de "proteção" defensivas aplicadas anteriormente para evitar o shift de Timezone estão forçando o horário para o final do dia.
- **Solução**: Remover todos os hacks manuais e implementar uma camada de visualização agnóstica a fuso horário do servidor, forçando fuso Brasil.

## 2. Mudanças Propostas

---

### Backend (Filtro Inteligente)

#### [MODIFY] [appointments.service.ts](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/src/appointments/appointments.service.ts)
- Manter o filtro de data ajustado para UTC-3 (03:00 UTC a 03:00 UTC do dia seguinte).
- **Importante**: Garantir que o campo `date` não seja manipulado durante a criação, preservando os minutos e segundos originais.

---

### Frontend (Padronização e Limpeza)

#### [MODIFY] [ClientDashboard.tsx](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/pages/client/ClientDashboard.tsx)
#### [MODIFY] [BarberDashboard.tsx](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/pages/barber/BarberDashboard.tsx)
#### [MODIFY] [AdminAppointmentHistory.tsx](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/pages/admin/AdminAppointmentHistory.tsx)
- **Remover**: Qualquer código que detecte `23:59` e altere a data.
- **Fix**: Usar `Intl.DateTimeFormat` com `timeZone: 'America/Sao_Paulo'` para formatar a data ISO vinda do backend.

#### [MODIFY] [useAppointments.ts](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/hooks/useAppointments.ts)
- Sincronizar o helper `getAppointmentDate` para remover hacks e usar parsing de data nativo resiliente.

---

### 3. Plano de Verificação (QA Sênior)

1. **Limpeza de Build**: Solicitar ao usuário que garanta que o build de produção em `3001` reflita o código fonte atualizado (se necessário).
2. **Teste de Agendamento Crítico**: 
    - Agendar para as 21:00 (Deve aparecer no dia certo).
    - Agendar para as 08:00 (Deve aparecer no dia e hora certa).
3. **Verificação Visual**: Confirmar que o horário exibido no card corresponde exatamente ao horário selecionado no seletor do `Booking.tsx`.

## 4. Open Questions

> [!IMPORTANT]
> O servidor de produção em `localhost:3001` é um build estático? Se sim, as minhas alterações no código fonte (`src/`) só terão efeito após uma nova execução de `npm run build`. Confirmar com o usuário se posso prosseguir com a correção no código fonte.
