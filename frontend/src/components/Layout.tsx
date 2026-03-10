
import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { useTheme } from '../context/ThemeContext';
// Fix: Import Link from react-router-dom and hooks from react-router to resolve export errors in some environments
import { Link } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router';
import { Scissors, Calendar, User, LayoutDashboard, LogOut, Menu, X, Instagram, Phone, Sun, Moon, ShoppingBag, Home as HomeIcon, Award, List } from 'lucide-react';
import { UserRole } from '../types';
import { UserMenu } from './UserMenu';
import { PWABadge } from './PWABadge';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { shop, fetchError } = useShop();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isTabActive = (path: string) => location.pathname === path;

  const showPlans = shop.settings.modulesEnabled?.clientPlans !== false;
  const showProducts = shop.settings.modulesEnabled?.products !== false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col pb-20 md:pb-0">
      {/* Top Navigation - Desktop Focus */}
      <nav ref={navRef} className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-amber-500 p-1.5 rounded-lg flex-shrink-0">
                  <Scissors className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight uppercase truncate max-w-[150px] md:max-w-none">
                  {shop.name}
                </span>
              </Link>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="hover:text-amber-500 transition-colors font-medium">Início</Link>
              <Link to="/services" className="hover:text-amber-500 transition-colors font-medium">Serviços</Link>
              {showPlans && (
                <Link to="/plans" className="hover:text-amber-500 transition-colors font-medium">Planos</Link>
              )}
              {showProducts && (
                <Link to="/products" className="hover:text-amber-500 transition-colors font-medium flex items-center gap-1">
                  <ShoppingBag size={18} /> Loja
                </Link>
              )}

              <Link to="/book" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
                <Calendar size={18} /> Agendar
              </Link>

              <div className="h-6 w-px bg-gray-700 mx-2"></div>

              <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-white">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <Link to="/login" className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl font-bold">Acessar</Link>
              )}
            </div>

            {/* Mobile Theme Toggle (visible only in top bar) */}
            <div className="md:hidden flex items-center">
              <button onClick={toggleTheme} className="p-2 text-gray-400">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Global Offline Banner */}
      {fetchError && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-600 dark:text-red-400 px-4 py-2 flex items-center justify-between text-xs sm:text-sm animate-fade-in z-40">
          <div className="flex items-center gap-2 w-full max-w-7xl mx-auto">
            <span>⚠️ <strong>Modo Offline.</strong> O sistema não conseguiu se conectar ao servidor.</span>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded font-bold transition-colors"
            >
              Recarregar
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Essential UX */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          <Link to="/" className={`flex flex-col items-center gap-1 flex-1 ${isTabActive('/') ? 'text-amber-500' : 'text-gray-400'}`}>
            <HomeIcon size={20} />
            <span className="text-[10px] font-bold uppercase">Início</span>
          </Link>

          {/* UX SWAP: If plans are disabled, show Services (Catalog) instead of empty/hidden Plans slot */}
          {showPlans ? (
            <Link to="/plans" className={`flex flex-col items-center gap-1 flex-1 ${isTabActive('/plans') ? 'text-amber-500' : 'text-gray-400'}`}>
              <Award size={20} />
              <span className="text-[10px] font-bold uppercase">Planos</span>
            </Link>
          ) : (
            <Link to="/services" className={`flex flex-col items-center gap-1 flex-1 ${isTabActive('/services') ? 'text-amber-500' : 'text-gray-400'}`}>
              <List size={20} />
              <span className="text-[10px] font-bold uppercase">Serviços</span>
            </Link>
          )}

          <Link to="/book" className="flex flex-col items-center gap-1 flex-1 -mt-8">
            <div className="bg-amber-500 p-3 rounded-full shadow-lg border-4 border-white dark:border-gray-800 text-white">
              <Calendar size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase mt-1 text-amber-500">Agendar</span>
          </Link>
          <Link to="/products" className={`flex flex-col items-center gap-1 flex-1 ${isTabActive('/products') ? 'text-amber-500' : 'text-gray-400'}`}>
            <ShoppingBag size={20} />
            <span className="text-[10px] font-bold uppercase">Loja</span>
          </Link>
          <Link to={isAuthenticated ? "/dashboard" : "/login"} className={`flex flex-col items-center gap-1 flex-1 ${isTabActive('/dashboard') || isTabActive('/profile') ? 'text-amber-500' : 'text-gray-400'}`}>
            <User size={20} />
            <span className="text-[10px] font-bold uppercase">Perfil</span>
          </Link>
        </div>
      </div>

      {/* Footer - Only visible on desktop/large screens */}
      <footer className="hidden md:block bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-4 text-lg font-bold text-white uppercase tracking-widest">{shop.name}</p>
          <div className="flex justify-center gap-6 mb-8 text-sm">
            <Link to="/terms" className="hover:text-white">Termos</Link>
            <Link to="/privacy" className="hover:text-white">Privacidade</Link>
            <Link to="/contact" className="hover:text-white">Contato</Link>
          </div>
          <p className="text-xs opacity-50">&copy; 2025 BarberPro System. Todos os direitos reservados.</p>
        </div>
      </footer>

      <PWABadge />
    </div>
  );
};
