# DEFECTS.md

Este documento contém o mapeamento de endpoints chamados pelo frontend que não possuem correspondência funcional ou não foram encontrados nos controllers do backend.

## Lista de Endpoints Faltantes ou Inconsistentes

### 1. Service Orders - Busca por Agendamento
- **Frontend Service**: [serviceOrderService.ts](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/services/serviceOrderService.ts) - Método: `getByAppointmentId`
- **Chamada HTTP**: `GET /service-orders/appointment/${appointmentId}`
- **Problema no Backend**: O controller [service-orders.controller.ts](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/src/service-orders/service-orders.controller.ts) não possui o endpoint `@Get('appointment/:id')` ou similar para buscar uma ordem de serviço vinculada a um agendamento específico.
- **Ação Sugerida**: Implementar o `@Get('appointment/:appointmentId')` no [service-orders.controller.ts](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/src/service-orders/service-orders.controller.ts) chamando o método apropriado do service para realizar essa busca.
