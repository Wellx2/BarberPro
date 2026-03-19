# Implementation Plan - Dashboard Refactoring & Improvements

This plan outlines the steps to refactor the 4200+ line [AdminDashboard.tsx](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/pages/admin/AdminDashboard.tsx) into smaller, manageable components while adding the requested UX improvements.

## Proposed Changes

### Dashboard Refactoring (Task 5)
Break down [AdminDashboard.tsx](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/pages/admin/AdminDashboard.tsx) into:
- `DashboardTabs/FinancialTab.tsx`: Handling all financial analytics and charts.
- `DashboardTabs/TeamTab.tsx`: Handling team member management.
- `DashboardTabs/CatalogTab.tsx`: Combining Services and Products? Or separate.
- `DashboardTabs/SettingsTab.tsx`: Appearance and general settings.

### Visualizations (Task 6)
- Integrate `recharts` (or a vanilla CSS/SVG solution if library not present) to show:
  - **Revenue Composition**: Service vs Product vs Plans.
  - **Expense Composition**: Commissions vs Fixed Costs vs Supply Costs.

### Performance (Task 7)
- Move state management for each tab into its own component where possible.
- Implement a custom `useAnalytics` hook with session-based caching to avoid re-fetching when switching between tabs.

## Verification Plan
- Verify each tab still functions and communicates with the backend.
- Ensure the "Composition" charts show accurate data calculated from the [Analytics](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/src/financial/financial.service.ts#10-97) endpoint.
- Verify mobile menu still works after refactoring.
