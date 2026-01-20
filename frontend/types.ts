
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
  ADMIN = 'ADMIN'
}

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
  bio?: string;
  birthDate?: string;
  isGuest?: boolean; 
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
  settings: {
    showBarbers: boolean;
    subscriptionEnabled: boolean;
    allowPayOnLocation: boolean;
  };
  socialWhatsapp?: string;
  socialInstagram?: string;
  coordinates?: { lat: number; lng: number };
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
  image: string;
  active: boolean;
  description?: string;
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
}

export interface Plan {
  id: string;
  shopId: string;
  name: string;
  price: number;
  benefits: string[];
  discount: number;
  active: boolean;
  isPopular?: boolean;
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
  shopId: string;
  name: string;
  specialties: string[];
  rating: number;
  avatar: string;
  description: string;
  totalCuts: number;
  experience: string;
  unit: string;
  active: boolean;
  commissionRate?: number;
  birthDate?: string;
}

export interface AppointmentProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Appointment {
  id: string;
  shopId: string;
  clientId: string;
  clientPhone?: string; 
  clientName?: string;  
  barberId: string;
  serviceIds: string[];
  date: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'CANCELLED_BY_BARBER';
  totalPrice: number;
  products?: AppointmentProduct[];
  isManual?: boolean;   
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