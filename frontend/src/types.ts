

export interface Review {
  id: string;
  appointmentId: string;
  barberId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface BlockedPeriod {
  id: string;
  barberId: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  type: 'DAY' | 'TIME' | 'RANGE';
  blockedBy?: 'BARBER' | 'ADMIN';
}

export interface CreateBlockedPeriodDto {
  barberId: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  type: 'DAY' | 'TIME' | 'RANGE';
}

export interface UpdateBlockedPeriodDto {
  date?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  type?: 'DAY' | 'TIME' | 'RANGE';
}

export interface UsedSupply {
  costId: string;
  quantity: number;
}

export interface FixedCost {
  id: string;
  shopId: string;
  name: string;
  value: number;
  quantity: number;
  unitLabel?: string;
  category: 'SUPPLY' | 'OPERATIONAL' | 'INFRA';
  active: boolean;
  dueDate?: string;
}

export enum UserRole {
  CLIENT = 'CLIENT',
  BARBER = 'BARBER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  CANCELLED_BY_BARBER = 'CANCELLED_BY_BARBER',
}

export enum BarberAvailability {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  BLOCKED = 'BLOCKED',
  OFFLINE = 'OFFLINE',
}

export enum OrderStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export type PaymentMethod = 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  planId?: string;
  credits?: number;
  favorites?: string[];
  loyaltyStamps?: number;
  shopId?: string;
  barberId?: string;  // ID da entidade Barber (diferente do User ID)
  clientId?: string;  // ID da entidade Client (diferente do User ID)
  bio?: string;
  birthDate?: string;
  isGuest?: boolean;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  birthDate?: string;
}

// ============================================================================
// SHOP SUBSCRIPTION TIERS (Planos da Barbearia no Sistema)
// ============================================================================

export enum ShopSubscriptionTier {
  SIMPLE = 'SIMPLE',
  PLUS = 'PLUS',
  PREMIUM = 'PREMIUM',
}

export const SHOP_TIER_LABELS: Record<ShopSubscriptionTier, string> = {
  [ShopSubscriptionTier.SIMPLE]: 'Plano Simples',
  [ShopSubscriptionTier.PLUS]: 'Plano Plus',
  [ShopSubscriptionTier.PREMIUM]: 'Plano Premium',
};

export interface ShopSubscription {
  tier: ShopSubscriptionTier;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  features: ShopFeatures;
}

export interface ShopFeatures {
  // Core features
  maxTeamMembers: number; // Simples: 3, Plus: 10, Premium: ilimitado
  hasAppointments: boolean; // Todos: true
  hasCashier: boolean; // Simples: true, Plus: true, Premium: true

  // Financial features
  hasFinancialDashboard: boolean; // Simples: false, Plus: true, Premium: true
  hasCommissionReports: boolean; // Simples: false, Plus: true, Premium: true
  commissionReportPeriods: ('WEEKLY' | 'BIWEEKLY' | 'MONTHLY')[]; // Plus/Premium

  // Product & Inventory features
  hasProducts: boolean; // Simples: false, Plus: false, Premium: true
  hasInventory: boolean; // Simples: false, Plus: false, Premium: true
  hasProductReports: boolean; // Simples: false, Plus: false, Premium: true

  // Advanced reports
  hasAdvancedReports: boolean; // Simples: false, Plus: limited, Premium: true
  hasAIAnalysis: boolean; // Simples: false, Plus: false, Premium: true

  // Support
  hasPrioritySupport: boolean; // Simples: false, Plus: false, Premium: true
  hasConfigurationSupport: boolean; // Simples: false, Plus: false, Premium: true
}

export interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  image: string;
  openingTime: string;
  closingTime: string;
  intervalMinutes: number;
  loyaltyEnabled: boolean;
  loyaltyProgramTarget: number;
  subscription?: ShopSubscription; // Plano contratado pela barbearia
  settings: {
    showBarbers: boolean;
    subscriptionEnabled: boolean;
    allowPayOnLocation: boolean;
    // Módulos que podem ser ativados/desativados
    modulesEnabled: {
      clientPlans: boolean; // Planos que a barbearia vende aos clientes
      products: boolean; // Módulo de produtos
      reviews: boolean; // Avaliações na home
      cashier: boolean; // Módulo de caixa
      financial: boolean; // Dashboard financeiro
      reports: boolean; // Relatórios avançados
    };
  };
  socialWhatsapp?: string;
  socialInstagram?: string;
  coordinates?: { lat: number; lng: number };
}

export interface CreateShopDto {
  name: string;
  address: string;
  phone: string;
  image?: string;
  openingTime: string;
  closingTime: string;
  intervalMinutes?: number;
  loyaltyEnabled?: boolean;
  loyaltyProgramTarget?: number;
  socialWhatsapp?: string;
  socialInstagram?: string;
  coordinates?: { lat: number; lng: number };
}

export interface UpdateShopDto {
  name?: string;
  address?: string;
  phone?: string;
  image?: string;
  openingTime?: string;
  closingTime?: string;
  intervalMinutes?: number;
  loyaltyEnabled?: boolean;
  loyaltyProgramTarget?: number;
  socialWhatsapp?: string;
  socialInstagram?: string;
  coordinates?: { lat: number; lng: number };
}

export interface Service {
  id: string;
  shopId?: string;
  name: string;
  duration: number;
  price: number;
  category: string;
  image?: string;
  active: boolean;
  featured?: boolean;  // Admin pode marcar até 3 serviços como destaque na home
  description?: string;
  createdAt?: any;
  updatedAt?: any;
  deletedAt?: string | null; // Soft delete - se preenchido, o serviço foi excluído
}

export interface CreateServiceDto {
  name: string;
  duration: number;
  price: number;
  category: string;
  image?: string;
  description?: string;
  active?: boolean;
}

export interface UpdateServiceDto {
  name?: string;
  duration?: number;
  price?: number;
  category?: string;
  image?: string;
  description?: string;
  active?: boolean;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  costPrice?: number;
  image: string;
  category: string;
  stock: number;
  active: boolean;
  featured?: boolean;  // Admin pode marcar até 3 produtos como destaque na home
  unit?: string; // unidade, grama, ml, etc
  deletedAt?: string | null; // Soft delete - se preenchido, o produto foi excluído
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  costPrice?: number;
  image?: string;
  category: string;
  stock: number;
  active?: boolean;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  costPrice?: number;
  image?: string;
  category?: string;
  stock?: number;
  active?: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  reason?: string;
  date: string;
  createdBy: string;
}

export interface StockMovementDto {
  productId: string;
  quantity: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  reason?: string;
}

// CLIENT PLANS (Planos que a barbearia vende aos clientes)
export interface Plan {
  id: string;
  shopId: string;
  name: string;
  price: number;
  benefitMonths: number;
  benefitServices: number;
  benefitProducts: number;
  benefitMoneyback: number;
  description?: string;
  benefits: string[];
  discount: number;
  active: boolean;
  isPopular?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlanDto {
  name: string;
  price: number;
  benefitMonths: number;
  benefitServices: number;
  benefitProducts: number;
  benefitMoneyback: number;
  description?: string;
  benefits: string[];
  discount?: number;
  active?: boolean;
  isPopular?: boolean;
}

export interface UpdatePlanDto {
  name?: string;
  price?: number;
  benefitMonths?: number;
  benefitServices?: number;
  benefitProducts?: number;
  benefitMoneyback?: number;
  description?: string;
  benefits?: string[];
  discount?: number;
  active?: boolean;
  isPopular?: boolean;
}

export interface Subscription {
  id: string;
  clientId: string;
  planId: string;
  shopId: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  renewalDate?: string;
}

export interface CreateSubscriptionDto {
  planId: string;
  clientId: string;
}

export interface Campaign {
  id: string;
  shopId: string;
  title: string;
  description: string;
  type: 'BIRTHDAY' | 'COUPON' | 'FLASH_SALE' | 'PROMOTION';
  target: 'ALL' | 'SUBSCRIBERS' | 'SPECIFIC';
  targetUserId?: string;
  active: boolean;
  createdAt: string;
}

export interface Barber {
  id: string;
  shopId?: string;
  barbershopId?: string;
  name: string;
  specialties?: string[];
  rating?: number;
  avatar?: string;
  image?: string;
  description?: string;
  totalCuts?: number;
  experience?: string;
  unit?: string;
  active: boolean;
  commissionRate?: number;
  birthDate?: string;
  email?: string;
  phone?: string;
}

export interface CreateBarberDto {
  name: string;
  specialties: string[];
  avatar?: string;
  description?: string;
  experience?: string;
  commissionRate?: number;
  birthDate?: string;
  active?: boolean;
}

export interface UpdateBarberDto {
  name?: string;
  specialties?: string[];
  avatar?: string;
  description?: string;
  experience?: string;
  commissionRate?: number;
  birthDate?: string;
  active?: boolean;
}

export interface Client {
  id: string;
  shopId: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  observations?: string;
  loyaltyPoints?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// TEAM / COLABORADORES
// ============================================================================

export enum TeamMemberRole {
  BARBER = 'BARBER',
  HAIRDRESSER = 'HAIRDRESSER',
  MANICURIST = 'MANICURIST',
  RECEPTIONIST = 'RECEPTIONIST',
  CASHIER = 'CASHIER',
  CLEANER = 'CLEANER',
}

export const TEAM_ROLE_LABELS: Record<TeamMemberRole, string> = {
  [TeamMemberRole.BARBER]: 'Barbeiro(a)',
  [TeamMemberRole.HAIRDRESSER]: 'Cabelereiro(a)',
  [TeamMemberRole.MANICURIST]: 'Manicure',
  [TeamMemberRole.RECEPTIONIST]: 'Recepcionista',
  [TeamMemberRole.CASHIER]: 'Caixa',
  [TeamMemberRole.CLEANER]: 'Faxineiro(a)',
};

export enum BarberWorkModel {
  COMMISSION_ONLY = 'COMMISSION_ONLY',
  SALARY = 'SALARY',
  SALARY_COMMISSION = 'SALARY_COMMISSION',
  CHAIR_RENT = 'CHAIR_RENT',
}

export const WORK_MODEL_LABELS: Record<BarberWorkModel, string> = {
  [BarberWorkModel.COMMISSION_ONLY]: 'Apenas Comissão',
  [BarberWorkModel.SALARY]: 'Salário Fixo',
  [BarberWorkModel.SALARY_COMMISSION]: 'Salário + Comissão',
  [BarberWorkModel.CHAIR_RENT]: 'Aluguel de Cadeira',
};

export interface TeamMember {
  id: string;
  shopId: string;
  name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: TeamMemberRole;
  specialties?: string[];
  description?: string;
  bio?: string;
  commissionRate?: number;
  experienceYears?: number;
  birthDate?: string;
  hireDate?: string;
  workModel: BarberWorkModel;
  monthlySalary?: number;
  chairRentalFee?: number;
  active: boolean;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeamMemberDto {
  name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: TeamMemberRole;
  specialties?: string[];
  description?: string;
  bio?: string;
  commissionRate?: number;
  experienceYears?: number;
  birthDate?: string;
  hireDate?: string;
  workModel: BarberWorkModel;
  monthlySalary?: number;
  chairRentalFee?: number;
  active?: boolean;
}

export interface UpdateTeamMemberDto {
  name?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: TeamMemberRole;
  specialties?: string[];
  description?: string;
  bio?: string;
  commissionRate?: number;
  experienceYears?: number;
  birthDate?: string;
  hireDate?: string;
  workModel?: BarberWorkModel;
  monthlySalary?: number;
  chairRentalFee?: number;
  active?: boolean;
}

// ============================================================================
// AGENDA LOCK / BLOQUEIO DE AGENDA
// ============================================================================

export interface AgendaLock {
  id: string;
  shopId?: string;
  teamMemberId: string;
  teamMemberName?: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  lockedBy: string;
  lockedByName?: string;
  forceOverride?: boolean;
  conflictingAppointments?: Appointment[];
  notifiedClients?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAgendaLockDto {
  teamMemberId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  forceOverride?: boolean; // Se true, sobrescreve agendamentos
}

export interface UpdateAgendaLockDto {
  date?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface AgendaLockConflict {
  hasConflicts: boolean;
  conflicts: Appointment[];
  message: string;
}

export interface BarberStats {
  totalAppointments: number;
  totalClients: number;
  averageRating: number;
  totalRevenue: number;
  upcomingAppointments: number;
  cancelledAppointments: number;
}

export interface AppointmentProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Appointment {
  id: string;
  shopId?: string;
  barbershopId?: string;
  clientId: string;
  clientPhone?: string;
  clientName?: string;
  barberId: string;
  serviceIds: string[];
  date?: string;
  scheduledFor?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'CANCELLED_BY_BARBER';
  totalPrice?: number;
  products?: AppointmentProduct[];
  isManual?: boolean;
  notes?: string;
  cancelReason?: string;
  createdAt?: any;
  updatedAt?: any;
  // Campos retornados pelo backend com objetos completos
  client?: {
    id?: string;
    name?: string;
    phone?: string;
    user?: { name?: string; phone?: string };
  };
  barber?: {
    id?: string;
    name?: string;
    user?: { name?: string };
  };
  services?: Array<{
    id: string;
    name?: string;
    price?: number;
    service?: { id?: string; name?: string; price?: number; duration?: number };
  }>;
}

export interface CreateAppointmentDto {
  // clientId é extraído do JWT e enviado explicitamente
  // barbershopId é inferido do token JWT pelo backend
  barberId: string;
  serviceIds: string[];
  date: string; // ISO 8601
  notes?: string;
  products?: { productId: string; quantity: number }[];
}

export interface UpdateAppointmentDto {
  barberId?: string;
  serviceIds?: string[];
  date?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'CANCELLED_BY_BARBER';
  totalPrice?: number;
  products?: { productId: string; quantity: number }[];
}

export interface Invoice {
  id: string;
  shopId: string;
  clientId: string;
  clientName: string;
  description: string;
  amount: number;
  date: string;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  type: 'PLAN' | 'SERVICE' | 'PRODUCT';
  items?: { name: string; quantity: number; price: number; productId?: string }[];
  paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH';
  pickupStatus?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

// ============================================================================
// AUTH DTOs
// ============================================================================

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

export interface RegisterClientDto {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  timestamp?: string;
  path?: string;
  error?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

// ============================================================================
// GENERIC UTILITY TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  totalPages: number;
}

export interface SearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  [key: string]: any;
}