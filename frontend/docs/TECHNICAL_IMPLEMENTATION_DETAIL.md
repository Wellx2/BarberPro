# BarberPro Technical Source Package (Frontend)

Este documento contém o código-fonte dos arquivos essenciais do frontend do BarberPro, estruturado para análise técnica profunda no Google NotebookLM.

---

## 📦 1. Dependências e Tech Stack ([package.json](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/package.json))

```json
{
  "name": "barberpro-system",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "dependencies": {
    "lucide-react": "0.474.0",
    "qrcode.react": "^4.2.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-router": "7.1.3",
    "react-router-dom": "7.1.3",
    "recharts": "2.15.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

---

## 🔐 2. Lógica de Autenticação ([src/context/AuthContext.tsx](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/context/AuthContext.tsx))

Gerencia JWT, Roles e persistência de usuário.

```typescript
// ... (imports omitidos para brevidade)
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('barber_user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      localStorage.removeItem('barber_user');
      return null;
    }
  });

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as UserRole,
        shopId: response.user.shopId,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(response.user.name)}&background=random`,
        // ...
      };
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('barber_user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };
  // ...
```

---

## 🏢 3. Coração Multi-Tenant ([src/context/ShopContext.tsx](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/context/ShopContext.tsx))

Gerencia o contexto da barbearia selecionada e a troca dinâmica de unidades.

```typescript
export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [shop, setShop] = useState<Shop>(/* ... */);

  const switchShop = async (shopId: string): Promise<void> => {
    if (shopId === shop.id) return;
    try {
      const response = await barbershopService.switch(shopId);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      const newShop = shops.find(s => s.id === shopId);
      if (newShop) setShop(newShop);

      window.dispatchEvent(new CustomEvent('shop-changed', { 
        detail: { oldShopId: shop.id, newShopId: shopId, shop: response.shop } 
      }));
    } catch (error) {
      console.error('Erro ao trocar de barbearia:', error);
      throw error;
    }
  };
  // ...
```

---

## 📡 4. Comunicação com API ([src/services/api.ts](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/services/api.ts))

Cliente centralizado com suporte a JWT e Refresh Token automático.

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<{ data: T }> {
    const token = localStorage.getItem('accessToken');
    const fullURL = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(fullURL, { ...options, headers });

    if (response.status === 401 && retry && !endpoint.includes('/auth/')) {
      // Lógica de Refresh Token aqui...
    }
    // ...
```

---

## 📅 5. Serviço de Agendamentos ([src/services/appointmentService.ts](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/services/appointmentService.ts))

Abstração das chamadas de negócio para reservas.

```typescript
export const appointmentService = {
  async create(data: CreateAppointmentDto): Promise<Appointment> {
    const payload = {
      ...(data.barberId && { barberId: data.barberId }),
      serviceIds: data.serviceIds,
      date: data.date,
      ...(data.clientId && { clientId: data.clientId }),
    };
    const response = await api.post<Appointment>('/appointments', payload);
    return response.data;
  },

  async getAvailableSlots(barberId: string, date: string, durationMinutes?: number): Promise<string[]> {
    const response = await api.get<string[]>(`/barbers/${barberId}/available-slots?date=${date}`);
    return response.data;
  },
  // ...
```

---

## 🖼️ 6. Tela de Agendamento ([src/pages/Booking.tsx](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/pages/Booking.tsx))

Fluxo principal de reserva do cliente.

```typescript
export const Booking: React.FC = () => {
  // Estados: step, selectedServices, selectedBarber, selectedDate, selectedTime
  
  const handleConfirm = async () => {
    // Validações de data/hora futura e campos obrigatórios
    const appointmentDate = new Date(`${selectedDate}T${selectedTime}:00`);
    
    let appointmentData: any = {
      serviceIds: selectedServices,
      date: appointmentDate.toISOString()
    };

    // Lógica condicional por Role
    if (user.role === 'CLIENT') {
      appointmentData.barberId = finalBarberId;
    } else if (user.role === 'BARBER' || user.role === 'ADMIN') {
      appointmentData.clientId = selectedClient;
      // ...
    }

    await appointmentService.create(appointmentData);
    addNotification('success', 'Agendamento confirmado!');
    navigate('/dashboard');
  };
  // ...
```

---

## 📊 7. Dashboard Administrativo ([src/pages/admin/AdminDashboard.tsx](file:///d:/Meus%20docs/Curso%20IA/barberpro/frontend/src/pages/admin/AdminDashboard.tsx))

Visão geral da lógica de gerenciamento (Primeiras 300 linhas do arquivo de 4000).

```typescript
export const AdminDashboard: React.FC = () => {
  const { shop: currentShop, setShop: setCurrentShop } = useShop();
  // Estados de Dashboard, Financeiro, Serviços, Produtos, Colaboradores
  
  // Efeito para carregar Analytics Financeiro
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoadingAnalytics(true);
        const data = await getFinancialAnalytics(currentShop.id, financialPeriod);
        setAnalytics(data);
      } catch (error: any) {
        addNotification('error', 'Erro ao carregar dados financeiros');
      } finally {
        setLoadingAnalytics(false);
      }
    };
    loadAnalytics();
  }, [currentShop.id, financialPeriod]);

  // Efeito para carregar Equipe
  useEffect(() => {
    const loadTeam = async () => {
      const data = await teamService.list(true);
      setTeamMembers(data);
    };
    loadTeam();
  }, [currentShop.id]);

  // ... (O arquivo continua com Modais de CRUD para Serviços, Produtos e Gestão de Caixa)
```

---
*Este pacote contém a espinha dorsal técnica do sistema. Os arquivos completos podem ser solicitados conforme a necessidade de aprofundamento em sub-módulos específicos.*
