import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useBookings } from '../../hooks/useBookings';
import { useModal } from '../../contexts/ModalContext';
import { BookingDetailsModal } from '../Bookings/BookingDetailsModal';

export function NotificationBell() {
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();
  const { bookings } = useBookings();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique à l'extérieur et gérer le scroll
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Empêcher le scroll sur mobile quand le panneau est ouvert
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: any) => {
    // Marquer comme lu
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Fermer le dropdown
    setIsOpen(false);

    // Ouvrir le modal de détails de la réservation si elle existe
    if (notification.booking_id) {
      // Trouver la réservation dans la liste
      const booking = bookings.find(b => b.id === notification.booking_id);

      if (booking) {
        openModal(
          <BookingDetailsModal
            booking={booking}
            onClose={closeModal}
          />
        );
      } else {
        // Si la réservation n'est pas trouvée, rediriger vers le calendrier
        navigate('/calendar');
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_created':
        return <Calendar className="w-5 h-5 text-green-600" />;
      case 'booking_updated':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'booking_cancelled':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'booking_created':
        return 'bg-green-50 border-green-200';
      case 'booking_updated':
        return 'bg-blue-50 border-blue-200';
      case 'booking_cancelled':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div className="fixed inset-x-0 top-16 bottom-0 md:absolute md:inset-auto md:top-full md:right-0 md:left-auto md:mt-2 md:w-96 md:max-h-[600px] bg-white md:rounded-xl shadow-2xl border-t-2 md:border-2 border-gray-200 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Notifications</h3>
                <p className="text-sm text-blue-100">
                  {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est lu'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Tout marquer comme lu</span>
                <span className="sm:hidden">Tout lu</span>
              </button>
              <button
                onClick={clearAllNotifications}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Tout supprimer</span>
                <span className="sm:hidden">Supprimer</span>
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Aucune notification
                </p>
                <p className="text-xs text-gray-500">
                  Vous recevrez des alertes pour les nouvelles réservations
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-all duration-200 ${
                      notification.is_read
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-blue-50 hover:bg-blue-100'
                    } cursor-pointer relative group`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        getNotificationBgColor(notification.type)
                      } border-2`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`text-sm font-bold ${
                            notification.is_read ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className={`text-xs ${
                          notification.is_read ? 'text-gray-500' : 'text-gray-700'
                        } mb-2`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 font-medium">
                            {formatDate(notification.created_at)}
                          </span>
                          {notification.is_read && (
                            <Check className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 bg-gray-50 border-t border-gray-200 text-center flex-shrink-0">
              <p className="text-xs text-gray-600">
                Affichage des 20 dernières notifications
              </p>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
}
