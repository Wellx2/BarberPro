
import React, { useEffect, useState } from 'react';
// Fix: Import HashRouter from react-router-dom and core components from react-router to resolve export errors in some environments
import { HashRouter as Router } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { ShopProvider, useShop } from './context/ShopContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ResetPassword } from './pages/ResetPassword';
import { UserProfile } from './pages/UserProfile';
import { Booking } from './pages/Booking';
import { BarberProfile } from './pages/BarberProfile';
import { Services } from './pages/Services';
import { Products } from './pages/Products';
import { Plans } from './pages/Plans';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Contact } from './pages/Contact';
import { Appointment, UserRole } from './types';
import { ProtectedRoute } from './components/ProtectedRoute';
import Appointments from './pages/admin/Appointments';
import AdminAppointmentHistory from './pages/admin/AdminAppointmentHistory';
import { SuperAdminDashboard } from './pages/admin/SuperAdminDashboard';
import { Cashier } from './pages/admin/Cashier';
import { StockMovements } from './pages/admin/StockMovements';
import { LoadingSkeletonCompact } from './components/LoadingSkeleton';
import { ShopLoadError } from './components/ShopLoadError';

// Component to handle global background tasks (notifications)
const AppLogic: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { isLoadingShops, fetchError } = useShop();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Notification Check Interval
  useEffect(() => {
    if (!user || user?.role !== 'CLIENT') return;

    const checkAppointments = async () => {
      const globalEnabled = localStorage.getItem('global_notifications_enabled') !== 'false';
      if (!globalEnabled) return;

      try {
        const { appointmentService } = await import('./services');
        const response = await appointmentService.list({ status: 'SCHEDULED' });
        const appointments: Appointment[] = Array.isArray(response) ? response : [];
        const notified = JSON.parse(localStorage.getItem('notified_appointments') || '[]');

        const now = new Date();
        const hasPlan = !!user.planId;
        const timeWindowMs = hasPlan ? 2 * 60 * 60 * 1000 : 60 * 60 * 1000;
        const timeWindowDate = new Date(now.getTime() + timeWindowMs);

        const disabledStr = localStorage.getItem('disabled_reminders') || '[]';
        const disabledList = JSON.parse(disabledStr);

        let newNotified = false;

        appointments.forEach(apt => {
          if (apt.status === 'SCHEDULED' && !notified.includes(apt.id)) {
            const aptDate = new Date(apt.date || apt.scheduledFor);

            // Check se agendamento está dentro da janela de lembrete
            if (aptDate > now && aptDate <= timeWindowDate) {
              const tempKey = `${apt.barberId}_${aptDate.toISOString().split('T')[0]}_${String(aptDate.getHours()).padStart(2, '0')}:${String(aptDate.getMinutes()).padStart(2, '0')}`;
              const isRemindersDisabledLocally = disabledList.includes(apt.id) || disabledList.includes(tempKey);

              if (!isRemindersDisabledLocally) {
                const formattedTime = aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                if (hasPlan) {
                  addNotification(
                    'info',
                    `Lembrete Premium: Seu agendamento é às ${formattedTime}. Você pode reagendar ou cancelar com antecedência, se necessário.`,
                    'Lembrete de Agendamento'
                  );
                } else {
                  addNotification(
                    'warning',
                    `Lembrete: Seu agendamento é às ${formattedTime}. Se não puder comparecer, cancele para evitar penalidades.`,
                    'Atendimento em Breve'
                  );
                }
              }

              // Marcar como notificado (ou silenciado permanentemente) para não reavaliar
              notified.push(apt.id);
              newNotified = true;
            }
          }
        });

        if (newNotified) {
          localStorage.setItem('notified_appointments', JSON.stringify(notified));
        }
      } catch (error) {
        console.error('Failed to fetch appointments for notifications', error);
      }
    };

    // Run check immediately and then every 3 minutes
    checkAppointments();
    const interval = setInterval(checkAppointments, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, addNotification]);

  // Listen for shop change events to show transition loading
  useEffect(() => {
    const handleShopChange = () => {
      setIsTransitioning(true);
      // Auto-hide after 1.5s (tempo para contextos atualizarem)
      setTimeout(() => setIsTransitioning(false), 1500);
    };

    window.addEventListener('shop-changed', handleShopChange);
    return () => window.removeEventListener('shop-changed', handleShopChange);
  }, []);

  // Proteção de transição (Skeleton) - Não bloqueia mais em caso de fetchError (Layout cuida disso com um Banner)
  if (isTransitioning) {
    return <LoadingSkeletonCompact />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  // Fix for potential broken images stored in localStorage from previous versions
  useEffect(() => {
    try {
      const storedServices = localStorage.getItem('services');
      if (storedServices) {
        const services = JSON.parse(storedServices);
        const newUrl = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60';

        let hasChanges = false;
        const updatedServices = services.map((s: any) => {
          if (s.id === '3' && (!s.image || s.image.includes('photo-1595476103518'))) {
            hasChanges = true;
            return { ...s, image: newUrl };
          }
          return s;
        });

        if (hasChanges) {
          localStorage.setItem('services', JSON.stringify(updatedServices));
        }
      }
    } catch (e) {
      console.error('Failed to patch services', e);
    }
  }, []);

  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <ShopProvider>
            <AppLogic>
              <Router>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/plans" element={<Plans />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Rotas Protegidas */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    } />
                    <Route path="/book" element={
                      <ProtectedRoute>
                        <Booking />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/appointments" element={
                      <ProtectedRoute>
                        <Appointments />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/history" element={
                      <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                        <AdminAppointmentHistory />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/super" element={
                      <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                        <SuperAdminDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/cashier" element={
                      <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                        <Cashier />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/stock" element={
                      <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                        <StockMovements />
                      </ProtectedRoute>
                    } />

                    <Route path="/barber/:id" element={<BarberProfile />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </Router>
            </AppLogic>
          </ShopProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;
