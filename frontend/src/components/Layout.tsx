
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

  const slugify = (str: string = '') => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const shopSlug = shop.slug || slugify(shop.name);

  // Helper paths
  const getShopPath = (path: string) => `/${shopSlug}${path}`;

  const showPlans = shop.settings.modulesEnabled?.clientPlans !== false;
  const showProducts = shop.settings.modulesEnabled?.products !== false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col pb-20 md:pb-0">
      {/* Top Navigation - Desktop Focus */}
      <nav ref={navRef} className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to={getShopPath('/')} className="flex items-center gap-2">
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.name} className="h-10 w-10 object-contain" />
                ) : (
                  <div className="bg-tenant-primary p-1.5 rounded-lg flex-shrink-0">
                    <Scissors className="h-5 w-5 text-white" />
                  </div>
                )}
                <span className="font-bold text-lg tracking-tight uppercase truncate max-w-[150px] md:max-w-none">
                  {shop.name}
                </span>
              </Link>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to={getShopPath('/')} className="hover:text-tenant-primary transition-colors font-medium">Início</Link>
              <Link to="/explore" className="hover:text-tenant-primary transition-colors font-medium">Buscar</Link>
              <Link to={getShopPath('/servicos')} className="hover:text-tenant-primary transition-colors font-medium">Serviços</Link>
              {showPlans && (
                <Link to={getShopPath('/planos')} className="hover:text-tenant-primary transition-colors font-medium">Planos</Link>
              )}
              {showProducts && (
                <Link to={getShopPath('/produtos')} className="hover:text-tenant-primary transition-colors font-medium flex items-center gap-1">
                  <ShoppingBag size={18} /> Loja
                </Link>
              )}

              <Link to={getShopPath('/agendar')} className="bg-tenant-primary hover:opacity-90 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
                <Calendar size={18} /> Agendar
              </Link>

              <div className="h-6 w-px bg-gray-700 mx-2"></div>

              <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-white">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <Link to="/login" className="border-2 border-tenant-primary text-tenant-primary hover:bg-tenant-primary hover:text-white px-5 py-2 rounded-xl font-bold transition-all">Acessar</Link>
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


      {/* Main Content Area */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Essential UX */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          <Link to={getShopPath('/')} className={`flex flex-col items-center gap-1 flex-1 ${isTabActive(getShopPath('/')) ? 'text-tenant-primary' : 'text-gray-400'}`}>
            <HomeIcon size={20} />
            <span className="text-[10px] font-bold uppercase">Início</span>
          </Link>

          {/* UX SWAP: If plans are disabled, show Services (Catalog) instead of empty/hidden Plans slot */}
          {showPlans ? (
            <Link to={getShopPath('/planos')} className={`flex flex-col items-center gap-1 flex-1 ${isTabActive(getShopPath('/planos')) ? 'text-tenant-primary' : 'text-gray-400'}`}>
              <Award size={20} />
              <span className="text-[10px] font-bold uppercase">Planos</span>
            </Link>
          ) : (
            <Link to={getShopPath('/servicos')} className={`flex flex-col items-center gap-1 flex-1 ${isTabActive(getShopPath('/servicos')) ? 'text-tenant-primary' : 'text-gray-400'}`}>
              <List size={20} />
              <span className="text-[10px] font-bold uppercase">Serviços</span>
            </Link>
          )}

          <Link to={getShopPath('/agendar')} className="flex flex-col items-center gap-1 flex-1 -mt-8">
            <div className="bg-tenant-primary p-3 rounded-full shadow-lg border-4 border-white dark:border-gray-800 text-white">
              <Calendar size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase mt-1 text-tenant-primary">Agendar</span>
          </Link>
          <Link to={getShopPath('/produtos')} className={`flex flex-col items-center gap-1 flex-1 ${location.pathname.includes('/produtos') ? 'text-tenant-primary' : 'text-gray-400'}`}>
            <ShoppingBag size={20} />
            <span className="text-[10px] font-bold uppercase">Loja</span>
          </Link>
          <Link to={isAuthenticated ? "/dashboard" : "/login"} className={`flex flex-col items-center gap-1 flex-1 ${isTabActive('/dashboard') || isTabActive('/profile') || isTabActive('/login') ? 'text-tenant-primary' : 'text-gray-400'}`}>
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
          <p className="text-xs opacity-50">&copy; 2025 Klypbarber System. Todos os direitos reservados.</p>
        </div>
      </footer>

      <PWABadge />
    </div>
  );
};
