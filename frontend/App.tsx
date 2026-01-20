
import React, { useEffect } from 'react';
// Fix: Import HashRouter from react-router-dom and core components from react-router to resolve export errors in some environments
import { HashRouter as Router } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { ShopProvider } from './context/ShopContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Booking } from './pages/Booking';
import { BarberProfile } from './pages/BarberProfile';
import { Services } from './pages/Services';
import { Products } from './pages/Products';
import { Plans } from './pages/Plans';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Contact } from './pages/Contact';
import { Appointment } from './types';
import { ProtectedRoute } from './components/ProtectedRoute';

// Component to handle global background tasks (notifications)
const AppLogic: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  // Notification Check Interval
  useEffect(() => {
    if (!user || user.role !== 'CLIENT') return;

    const checkAppointments = () => {
      const stored = localStorage.getItem('appointments');
      const notified = JSON.parse(localStorage.getItem('notified_appointments') || '[]');
      
      if (stored) {
        const appointments: Appointment[] = JSON.parse(stored);
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        appointments.forEach(apt => {
          if (apt.clientId === user.id && apt.status === 'SCHEDULED' && !notified.includes(apt.id)) {
            const aptDate = new Date(apt.date);
            
            // Check if appointment is within the next hour (and in the future)
            if (aptDate > now && aptDate <= oneHourLater) {
              addNotification(
                'warning', 
                `Seu agendamento é às ${aptDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. Chegue com 10 min de antecedência.`, 
                'Atendimento em Breve'
              );
              
              // Mark as notified
              notified.push(apt.id);
              localStorage.setItem('notified_appointments', JSON.stringify(notified));
            }
          }
        });
      }
    };

    // Run check immediately and then every 60 seconds
    checkAppointments();
    const interval = setInterval(checkAppointments, 60000);

    return () => clearInterval(interval);
  }, [user, addNotification]);

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
        <ShopProvider>
          <AuthProvider>
            <AppLogic>
              <Router>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/plans" element={<Plans />} />
                    
                    {/* Rotas Protegidas */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/book" element={
                      <ProtectedRoute>
                        <Booking />
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
          </AuthProvider>
        </ShopProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;
