import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Settings, LayoutDashboard, Package, Mail, BarChart3, Users, ShoppingCart, LogOut, Menu, X, ChevronDown, ChevronRight, Puzzle, List, UserCircle, FileText, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlugins } from '../../hooks/usePlugins';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, isImpersonating, endImpersonation } = useAuth();
  const { userPlugins, loading } = usePlugins();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pluginsMenuOpen, setPluginsMenuOpen] = useState(false);
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);

  const currentPage = location.pathname.replace('/', '') || 'dashboard';

  const hasReportsAccess = userPlugins.some(p => p.plugin_slug === 'reports');
  const hasMultiUserAccess = userPlugins.some(p => p.plugin_slug === 'multi-user');
  const hasPOSAccess = userPlugins.some(p => p.plugin_slug === 'pos');

  const calendarSubItems = [
    { id: 'calendar', label: 'Planning', icon: Calendar, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'bookings-list', label: 'Liste de réservations', icon: List, gradient: 'from-indigo-500 to-purple-500' },
    { id: 'clients', label: 'Clients', icon: UserCircle, gradient: 'from-pink-500 to-rose-500' }
  ];

  const pluginNavItems = [
    ...(hasReportsAccess ? [{ id: 'reports', label: 'Rapports', icon: BarChart3, gradient: 'from-indigo-500 to-purple-500' }] : []),
    ...(hasMultiUserAccess ? [{ id: 'multi-user', label: 'Multi-Utilisateurs', icon: Users, gradient: 'from-pink-500 to-rose-500' }] : []),
    ...(hasPOSAccess ? [{ id: 'pos', label: 'POS', icon: ShoppingCart, gradient: 'from-cyan-500 to-blue-500' }] : [])
  ];

  const hasPlugins = pluginNavItems.length > 0;
  const isPluginPageActive = pluginNavItems.some(item => item.id === currentPage);
  const isCalendarPageActive = calendarSubItems.some(item => item.id === currentPage);

  const handlePluginsToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPluginsMenuOpen(!pluginsMenuOpen);
  };

  const handleCalendarToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCalendarMenuOpen(!calendarMenuOpen);
  };

  const handleNavigation = (pageId: string) => {
    navigate(`/${pageId}`);
    setMobileMenuOpen(false);
    setPluginsMenuOpen(false);
    setCalendarMenuOpen(false);
  };

  const handleCloseMobileMenu = () => {
    setMobileMenuOpen(false);
    setPluginsMenuOpen(false);
    setCalendarMenuOpen(false);
  };

  return (
    <>
      <nav 
        className="bg-white border-b border-gray-200 shadow-sm" 
        style={{ 
          position: 'sticky', 
          top: 0,
          zIndex: 40,
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                BookingFast
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => handleNavigation('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  currentPage === 'dashboard'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </button>

              <div className="relative">
                <button
                  onClick={handleCalendarToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    isCalendarPageActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  <span>Calendrier</span>
                  {calendarMenuOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {calendarMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    {calendarSubItems.map(item => {
                      const Icon = item.icon;
                      const isActive = currentPage === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigation(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 font-medium transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleNavigation('services')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  currentPage === 'services'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Package className="w-5 h-5" />
                <span>Services</span>
              </button>

              <button
                onClick={() => handleNavigation('invoices')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  currentPage === 'invoices'
                    ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Factures</span>
              </button>

              <button
                onClick={() => handleNavigation('emails')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  currentPage === 'emails'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Mail className="w-5 h-5" />
                <span>Emails</span>
              </button>

              {hasPlugins && (
                <div className="relative">
                  <button
                    onClick={handlePluginsToggle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                      isPluginPageActive
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Puzzle className="w-5 h-5" />
                    <span>Plugins</span>
                    {pluginsMenuOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {pluginsMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      {pluginNavItems.map(item => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavigation(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 font-medium transition-all ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => handleNavigation('admin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  currentPage === 'admin'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Paramètres</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isImpersonating && (
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg animate-pulse">
                  <ShieldAlert className="w-5 h-5" />
                  <span className="hidden md:inline font-bold">Mode Admin</span>
                </div>
              )}

              <NotificationBell />

              <button
                onClick={isImpersonating ? endImpersonation : signOut}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">{isImpersonating ? 'Quitter le mode admin' : 'Déconnexion'}</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-blue-900/95 backdrop-blur-md animate-fadeIn safe-all scrollable-area"
          style={{
            zIndex: 9998,
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            height: '100%',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain'
          }}
        >
          {/* Bouton de fermeture en haut à droite */}
          <button
            onClick={handleCloseMobileMenu}
            className="fixed top-4 right-4 z-50 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-all shadow-lg"
            style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div 
            className="h-full overflow-y-auto p-6 pt-20 scrollable-area"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              overscrollBehavior: 'contain'
            }}
          >
            <div className="max-w-md mx-auto space-y-3">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">BookingFast</h2>
                <p className="text-purple-200 text-sm">Gestion de réservations</p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-purple-200 uppercase tracking-wider px-4 mb-3">
                  Menu Principal
                </div>
                
                <button
                  onClick={() => handleNavigation('dashboard')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl font-medium transition-all transform hover:scale-105 animate-slideUp ${
                    currentPage === 'dashboard'
                      ? 'bg-white text-gray-900 shadow-2xl'
                      : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    currentPage === 'dashboard'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-white/20'
                  }`}>
                    <LayoutDashboard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">Dashboard</div>
                    <div className={`text-xs ${currentPage === 'dashboard' ? 'text-gray-500' : 'text-purple-200'}`}>
                      Vue d'ensemble
                    </div>
                  </div>
                  {currentPage === 'dashboard' && (
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse"></div>
                  )}
                </button>
              </div>

              <div className="space-y-2 mt-6">
                <div className="text-xs font-bold text-purple-200 uppercase tracking-wider px-4 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Calendrier
                </div>
                <button
                  onClick={handleCalendarToggle}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl font-medium transition-all transform hover:scale-105 ${
                    isCalendarPageActive
                      ? 'bg-white text-gray-900 shadow-2xl'
                      : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isCalendarPageActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                      : 'bg-white/20'
                  }`}>
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">Calendrier</div>
                    <div className={`text-xs ${isCalendarPageActive ? 'text-gray-500' : 'text-purple-200'}`}>
                      {calendarSubItems.length} option(s)
                    </div>
                  </div>
                  <div className="transition-transform duration-300" style={{ transform: calendarMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                {calendarMenuOpen && (
                  <div className="ml-4 space-y-2 animate-slideDown">
                    {calendarSubItems.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = currentPage === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigation(item.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl font-medium transition-all transform hover:scale-105 animate-slideUp ${
                            isActive
                              ? 'bg-white text-gray-900 shadow-2xl'
                              : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isActive
                              ? `bg-gradient-to-r ${item.gradient}`
                              : 'bg-white/20'
                          }`}>
                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-bold text-sm">{item.label}</div>
                          </div>
                          {isActive && (
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-6">
                <div className="text-xs font-bold text-purple-200 uppercase tracking-wider px-4 mb-3">
                  Autres
                </div>
                
                <button
                  onClick={() => handleNavigation('services')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl font-medium transition-all transform hover:scale-105 ${
                    currentPage === 'services'
                      ? 'bg-white text-gray-900 shadow-2xl'
                      : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    currentPage === 'services'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-white/20'
                  }`}>
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">Services</div>
                    <div className={`text-xs ${currentPage === 'services' ? 'text-gray-500' : 'text-purple-200'}`}>
                      Vos prestations
                    </div>
                  </div>
                  {currentPage === 'services' && (
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 animate-pulse"></div>
                  )}
                </button>

                <button
                  onClick={() => handleNavigation('invoices')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl font-medium transition-all transform hover:scale-105 ${
                    currentPage === 'invoices'
                      ? 'bg-white text-gray-900 shadow-2xl'
                      : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    currentPage === 'invoices'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-white/20'
                  }`}>
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">Factures</div>
                    <div className={`text-xs ${currentPage === 'invoices' ? 'text-gray-500' : 'text-purple-200'}`}>
                      Facturation clients
                    </div>
                  </div>
                  {currentPage === 'invoices' && (
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-600 to-orange-600 animate-pulse"></div>
                  )}
                </button>

                <button
                  onClick={() => handleNavigation('emails')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl font-medium transition-all transform hover:scale-105 ${
                    currentPage === 'emails'
                      ? 'bg-white text-gray-900 shadow-2xl'
                      : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    currentPage === 'emails'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500'
                      : 'bg-white/20'
                  }`}>
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">Emails</div>
                    <div className={`text-xs ${currentPage === 'emails' ? 'text-gray-500' : 'text-purple-200'}`}>
                      Communication
                    </div>
                  </div>
                  {currentPage === 'emails' && (
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-600 to-red-600 animate-pulse"></div>
                  )}
                </button>
              </div>

              {hasPlugins && (
                <div className="space-y-2 mt-6">
                  <div className="text-xs font-bold text-purple-200 uppercase tracking-wider px-4 mb-3 flex items-center gap-2">
                    <Puzzle className="w-4 h-4" />
                    Extensions
                  </div>
                  <button
                    onClick={handlePluginsToggle}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl font-medium transition-all transform hover:scale-105 ${
                      isPluginPageActive
                        ? 'bg-white text-gray-900 shadow-2xl'
                        : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isPluginPageActive
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                        : 'bg-white/20'
                    }`}>
                      <Puzzle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold">Plugins</div>
                      <div className={`text-xs ${isPluginPageActive ? 'text-gray-500' : 'text-purple-200'}`}>
                        {pluginNavItems.length} extension(s)
                      </div>
                    </div>
                    <div className="transition-transform duration-300" style={{ transform: pluginsMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </button>

                  {pluginsMenuOpen && (
                    <div className="ml-4 space-y-2 animate-slideDown">
                      {pluginNavItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavigation(item.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl font-medium transition-all transform hover:scale-105 animate-slideUp ${
                              isActive
                                ? 'bg-white text-gray-900 shadow-2xl'
                                : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                            }`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isActive
                                ? `bg-gradient-to-r ${item.gradient}`
                                : 'bg-white/20'
                            }`}>
                              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-bold text-sm">{item.label}</div>
                            </div>
                            {isActive && (
                              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 animate-pulse"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 mt-6">
                <div className="text-xs font-bold text-purple-200 uppercase tracking-wider px-4 mb-3">
                  Paramètres
                </div>
                <button
                  onClick={() => handleNavigation('admin')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl font-medium transition-all transform hover:scale-105 ${
                    currentPage === 'admin'
                      ? 'bg-white text-gray-900 shadow-2xl'
                      : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    currentPage === 'admin'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                      : 'bg-white/20'
                  }`}>
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">Paramètres</div>
                    <div className={`text-xs ${currentPage === 'admin' ? 'text-gray-500' : 'text-purple-200'}`}>
                      Configuration
                    </div>
                  </div>
                  {currentPage === 'admin' && (
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse"></div>
                  )}
                </button>
              </div>

              <div className="pt-6 mt-6 border-t border-white/20">
                {isImpersonating && (
                  <div className="mb-4 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-2xl shadow-2xl animate-pulse">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-6 h-6" />
                      <div>
                        <div className="font-bold">Mode Administrateur</div>
                        <div className="text-xs text-white/80">Vous consultez le compte d'un utilisateur</div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (isImpersonating) {
                      endImpersonation();
                    } else {
                      signOut();
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-2xl"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">{isImpersonating ? 'Quitter le mode admin' : 'Déconnexion'}</div>
                    <div className="text-xs text-red-100">{isImpersonating ? 'Retourner à votre compte' : 'Quitter l\'application'}</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
