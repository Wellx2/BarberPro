
import { Service, Plan, Barber, User, UserRole, Appointment, Shop, Product, FixedCost } from './types';

export const UI_STYLE = {
  button: {
    primary: "bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[11px] tracking-[0.2em] py-5 px-8 rounded-[22px] shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-3",
    secondary: "bg-gray-900 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-700 text-white font-black uppercase text-[11px] tracking-[0.2em] py-5 px-8 rounded-[22px] transition-all active:scale-95 flex items-center justify-center gap-3",
    outline: "border-2 border-gray-100 dark:border-gray-700 hover:border-amber-500 text-gray-500 hover:text-amber-500 font-black uppercase text-[10px] tracking-widest py-4 px-6 rounded-2xl transition-all",
    danger: "bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest py-4 px-6 rounded-2xl transition-all"
  },
  card: "bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden",
  input: "w-full p-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-bold dark:text-white transition-all placeholder:text-gray-400 placeholder:font-medium"
};

const today = new Date();
const formatDate = (hours: number, minutes: number, daysAgo: number = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
};

export const MOCK_FIXED_COSTS: FixedCost[] = [
  { id: 'fc-1', shopId: 'shop-1', name: 'Aluguel Unidade', value: 2500, quantity: 1, category: 'INFRA', active: true },
  { id: 'fc-2', shopId: 'shop-1', name: 'Gola de Pescoço (Lote)', value: 150, quantity: 100, unitLabel: 'un', category: 'SUPPLY', active: true },
  { id: 'fc-3', shopId: 'shop-1', name: 'Lâminas (Caixa)', value: 80, quantity: 100, unitLabel: 'un', category: 'SUPPLY', active: true },
  { id: 'fc-4', shopId: 'shop-1', name: 'Toalhas Higienização', value: 200, quantity: 50, unitLabel: 'lavagens', category: 'SUPPLY', active: true }
];

export const MOCK_SHOPS: Shop[] = [
  {
    id: 'shop-1',
    name: 'Paulista',
    address: 'Av. Paulista, 1000',
    phone: '(11) 99999-1000',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800',
    openingTime: '09:00',
    closingTime: '20:00',
    intervalMinutes: 30,
    loyaltyEnabled: true,
    loyaltyProgramTarget: 8,
    settings: { showBarbers: true, subscriptionEnabled: true, allowPayOnLocation: true }
  },
  {
    id: 'shop-2',
    name: 'Morumbi',
    address: 'Shopping Morumbi',
    phone: '(11) 99999-2000',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b7f304?w=800',
    openingTime: '10:00',
    closingTime: '22:00',
    intervalMinutes: 30,
    loyaltyEnabled: false,
    loyaltyProgramTarget: 10,
    settings: { showBarbers: true, subscriptionEnabled: false, allowPayOnLocation: true }
  }
];

export const SERVICES: Service[] = [
  { id: '1', name: 'Corte de Cabelo', duration: 30, price: 80, category: 'HAIR', image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=500', active: true },
  { id: '2', name: 'Barba', duration: 20, price: 60, category: 'BEARD', image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500', active: true },
  { id: '4', name: 'Corte + Barba', duration: 45, price: 130, category: 'COMBO', image: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=500', active: true }
];

export const BARBERS: Barber[] = [
  { id: 'b1', shopId: 'shop-1', name: 'Carlos Silva', specialties: ['Corte', 'Barba'], rating: 4.8, avatar: 'https://picsum.photos/100/100?random=10', description: 'Mestre em Visagismo.', totalCuts: 1250, experience: '8 Anos', unit: 'Paulista', active: true, commissionRate: 50 },
  { id: 'b2', shopId: 'shop-1', name: 'André Souza', specialties: ['Degradê'], rating: 4.9, avatar: 'https://picsum.photos/100/100?random=11', description: 'Expert em Fades.', totalCuts: 980, experience: '5 Anos', unit: 'Paulista', active: true, commissionRate: 40 }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'a-1', shopId: 'shop-1', clientId: 'c1', barberId: 'b1', serviceIds: ['1'], date: formatDate(9, 0, 1), status: 'COMPLETED', totalPrice: 800 },
  { id: 'a-2', shopId: 'shop-1', clientId: 'c1', barberId: 'b1', serviceIds: ['4'], date: formatDate(10, 0, 1), status: 'COMPLETED', totalPrice: 1300 },
  { id: 'a-3', shopId: 'shop-1', clientId: 'c1', barberId: 'b2', serviceIds: ['1'], date: formatDate(11, 0, 2), status: 'COMPLETED', totalPrice: 800 },
  { id: 'a-4', shopId: 'shop-1', clientId: 'c1', barberId: 'b2', serviceIds: ['4'], date: formatDate(14, 0, 0), status: 'COMPLETED', totalPrice: 1300 },
  { id: 'a-5', shopId: 'shop-1', clientId: 'c1', barberId: 'b1', serviceIds: ['1'], date: formatDate(16, 0, 0), status: 'COMPLETED', totalPrice: 5000 },
];

export const PRODUCTS: Product[] = [
  { id: 'p1', shopId: 'shop-1', name: 'Pomada Matte', description: 'Fixação forte.', price: 50, costPrice: 20, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500', category: 'Cabelo', stock: 20, active: true }
];

export const PLANS: Plan[] = [
  { id: 'premium', shopId: 'shop-1', name: 'PREMIUM', price: 149.90, benefits: ['4 cortes/mês'], discount: 20, active: true, isPopular: true }
];

export const MOCK_USERS: Record<string, User> = {
  // Fix: Added missing phone property to mock users
  admin: { id: 'adm1', name: 'Admin Master', email: 'admin@barber.com', phone: '(11) 99999-0000', role: UserRole.ADMIN, avatar: 'https://picsum.photos/100/100?random=99' },
  client: { id: 'c1', name: 'João Cliente', email: 'cliente@barber.com', phone: '(11) 99999-1111', role: UserRole.CLIENT, avatar: 'https://picsum.photos/100/100?random=20' },
  barber: { id: 'b1', shopId: 'shop-1', name: 'Carlos Silva', email: 'barber@barber.com', phone: '(11) 99999-2222', role: UserRole.BARBER, avatar: 'https://picsum.photos/100/100?random=10' },
};

export const MOCK_TESTIMONIALS = [
    { id: 1, name: "Marcos Oliveira", text: "Excelente atendimento!", rating: 5, avatar: "https://i.pravatar.cc/150?u=1" }
];
