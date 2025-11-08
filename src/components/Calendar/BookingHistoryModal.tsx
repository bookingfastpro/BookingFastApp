import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Clock, User, CreditCard, CheckCircle, XCircle, AlertCircle, FileText, UserCheck, History, Edit, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HistoryEvent {
  id: string;
  event_type: string;
  event_data: any;
  description: string;
  created_at: string;
  user_email: string | null;
}

interface BookingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  clientName: string;
}

export function BookingHistoryModal({ isOpen, onClose, bookingId, clientName }: BookingHistoryModalProps) {
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && bookingId) {
      loadHistory();
      
      // Bloquer le scroll du body
      // Use modal-open class
      document.body.classList.add('modal-open');
      
      return () => {
        document.body.classList.remove('modal-open');
      };
    }
  }, [isOpen, bookingId]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Chargement historique pour booking_id:', bookingId);

      // 1. Charger l'historique
      const { data: historyData, error: historyError } = await supabase!
        .from('booking_history')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (historyError) {
        console.error('❌ Erreur requête historique:', historyError);
        throw historyError;
      }

      console.log('✅ Historique chargé:', historyData?.length || 0, 'événements');

      // 2. Extraire tous les service_id uniques de l'historique
      const serviceIds = new Set<string>();
      historyData?.forEach(event => {
        if (event.event_data?.service_id) {
          const serviceId = typeof event.event_data.service_id === 'object' 
            ? event.event_data.service_id.new || event.event_data.service_id.old
            : event.event_data.service_id;
          if (serviceId) serviceIds.add(serviceId);
        }
      });

      console.log('🔍 Service IDs trouvés:', Array.from(serviceIds));

      // 3. Charger les noms des services
      if (serviceIds.size > 0) {
        const { data: servicesData, error: servicesError } = await supabase!
          .from('services')
          .select('id, name')
          .in('id', Array.from(serviceIds));

        if (servicesError) {
          console.warn('⚠️ Erreur chargement services:', servicesError);
        } else {
          const namesMap: Record<string, string> = {};
          servicesData?.forEach(service => {
            namesMap[service.id] = service.name;
          });
          console.log('✅ Noms des services chargés:', namesMap);
          setServiceNames(namesMap);
        }
      }

      const mappedHistory = (historyData || []).map(event => ({
        ...event,
        user_email: null
      }));

      setHistory(mappedHistory);
    } catch (err) {
      console.error('❌ Erreur chargement historique:', err);
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger l\'historique';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 🎯 FONCTION HELPER : Convertir une valeur en string affichable
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // 🎯 FONCTION HELPER : Extraire old/new d'un objet ou retourner la valeur directe
  const extractOldNew = (value: any): { old: string | null; new: string | null } => {
    if (value && typeof value === 'object' && ('old' in value || 'new' in value)) {
      return {
        old: value.old ? formatValue(value.old) : null,
        new: value.new ? formatValue(value.new) : null
      };
    }
    return { old: null, new: formatValue(value) };
  };

  // 🎯 NOUVELLE FONCTION : Obtenir le nom du service à partir de l'ID
  const getServiceName = (serviceId: string): string => {
    return serviceNames[serviceId] || `Service inconnu (${serviceId.substring(0, 8)}...)`;
  };

  const formatEventDetails = (eventType: string, eventData: any) => {
    if (!eventData || Object.keys(eventData).length === 0) return null;

    const details: JSX.Element[] = [];

    // Date
    if (eventData.date) {
      const { old, new: newVal } = extractOldNew(eventData.date);
      details.push(
        <div key="date" className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600 font-medium">📅 Date</span>
          <div className="flex items-center gap-2">
            {old && <span className="text-red-600 line-through">{old}</span>}
            {old && <ArrowRight className="w-4 h-4 text-gray-400" />}
            <span className="text-green-600 font-semibold">{newVal}</span>
          </div>
        </div>
      );
    }

    // Heure
    if (eventData.time) {
      const { old, new: newVal } = extractOldNew(eventData.time);
      const oldTime = old ? old.substring(0, 5) : null;
      const newTime = newVal ? newVal.substring(0, 5) : null;
      
      details.push(
        <div key="time" className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600 font-medium">🕐 Heure</span>
          <div className="flex items-center gap-2">
            {oldTime && <span className="text-red-600 line-through">{oldTime}</span>}
            {oldTime && <ArrowRight className="w-4 h-4 text-gray-400" />}
            <span className="text-green-600 font-semibold">{newTime}</span>
          </div>
        </div>
      );
    }

    // Service - MODIFIÉ POUR AFFICHER LE NOM
    if (eventData.service_id) {
      const { old, new: newVal } = extractOldNew(eventData.service_id);
      
      details.push(
        <div key="service" className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600 font-medium">🎯 Service</span>
          <div className="flex items-center gap-2">
            {old && (
              <>
                <span className="text-red-600 line-through">{getServiceName(old)}</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </>
            )}
            <span className="text-green-600 font-semibold">{getServiceName(newVal!)}</span>
          </div>
        </div>
      );
    }

    // Quantité
    if (eventData.quantity) {
      const { old, new: newVal } = extractOldNew(eventData.quantity);
      details.push(
        <div key="quantity" className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600 font-medium">👥 Quantité</span>
          <div className="flex items-center gap-2">
            {old && <span className="text-red-600 line-through">{old}</span>}
            {old && <ArrowRight className="w-4 h-4 text-gray-400" />}
            <span className="text-green-600 font-semibold">{newVal}</span>
          </div>
        </div>
      );
    }

    // Montant total
    if (eventData.total_amount) {
      const { new: newVal } = extractOldNew(eventData.total_amount);
      details.push(
        <div key="total_amount" className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600 font-medium">💰 Montant total</span>
          <span className="text-green-600 font-semibold">{newVal}€</span>
        </div>
      );
    }

    // Nom du client
    if (eventData.client_name) {
      const { new: newVal } = extractOldNew(eventData.client_name);
      details.push(
        <div key="client_name" className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600 font-medium">👤 Client</span>
          <span className="text-gray-900 font-semibold">{newVal}</span>
        </div>
      );
    }

    // Statut
    if (eventData.old_status && eventData.new_status) {
      const oldStatus = formatValue(eventData.old_status);
      const newStatus = formatValue(eventData.new_status);
      
      details.push(
        <div key="status" className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600 font-medium">📊 Statut</span>
          <div className="flex items-center gap-2">
            <span className="text-red-600 line-through capitalize">{oldStatus}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="text-green-600 font-semibold capitalize">{newStatus}</span>
          </div>
        </div>
      );
    }

    return details.length > 0 ? (
      <div className="mt-3 pt-3 border-t border-gray-200">
        <details className="text-sm">
          <summary className="cursor-pointer hover:text-gray-900 font-medium text-gray-700 flex items-center gap-2">
            <span>📋 Voir les détails</span>
          </summary>
          <div className="mt-3 bg-white rounded-lg p-4 space-y-2 border border-gray-200">
            {details}
          </div>
        </details>
      </div>
    ) : null;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'status_change':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'payment_added':
      case 'payment_updated':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'online_confirmation':
        return <CheckCircle className="w-5 h-5 text-purple-600" />;
      case 'note_added':
      case 'note_updated':
        return <FileText className="w-5 h-5 text-amber-600" />;
      case 'assigned_user_changed':
        return <UserCheck className="w-5 h-5 text-indigo-600" />;
      case 'booking_updated':
        return <Edit className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return 'from-green-50 to-emerald-50 border-green-200';
      case 'status_change':
        return 'from-blue-50 to-cyan-50 border-blue-200';
      case 'payment_added':
      case 'payment_updated':
        return 'from-green-50 to-teal-50 border-green-200';
      case 'online_confirmation':
        return 'from-purple-50 to-pink-50 border-purple-200';
      case 'note_added':
      case 'note_updated':
        return 'from-amber-50 to-yellow-50 border-amber-200';
      case 'assigned_user_changed':
        return 'from-indigo-50 to-blue-50 border-indigo-200';
      case 'booking_updated':
        return 'from-orange-50 to-red-50 border-orange-200';
      default:
        return 'from-gray-50 to-slate-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn z-[10000]"
        onClick={onClose}
      />

      {/* Modal - z-index plus élevé pour être au-dessus du modal parent */}
      <div className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 z-[10001]">
        <div className="bg-white w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] sm:rounded-3xl shadow-2xl transform animate-slideUp flex flex-col">
          {/* Header avec safe area */}
          <div 
            className="flex-shrink-0 relative overflow-hidden sm:rounded-t-3xl"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <History className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg">
                      Historique de la réservation
                    </h2>
                    <p className="text-white/80 text-sm sm:text-base mt-0.5 sm:mt-1">
                      {clientName}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 sm:p-3 text-white hover:bg-white/20 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-110"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          </div>

          {/* Contenu scrollable avec safe area */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 font-medium mb-2">{error}</p>
                  <p className="text-sm text-gray-500 mb-4">Vérifiez la console pour plus de détails</p>
                  <button
                    onClick={loadHistory}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">Aucun historique disponible</p>
                  <p className="text-sm text-gray-500">Les événements de cette réservation apparaîtront ici</p>
                  <button
                    onClick={loadHistory}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Actualiser
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Timeline */}
                  <div className="relative">
                    {/* Ligne verticale */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-200 to-pink-200"></div>

                    {/* Événements */}
                    <div className="space-y-6">
                      {history.map((event, index) => (
                        <div key={event.id} className="relative pl-16 animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
                          {/* Icône */}
                          <div className="absolute left-3 top-0 w-10 h-10 bg-white rounded-full border-2 border-indigo-200 flex items-center justify-center shadow-lg z-10">
                            {getEventIcon(event.event_type)}
                          </div>

                          {/* Carte d'événement */}
                          <div className={`bg-gradient-to-r ${getEventColor(event.event_type)} rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow`}>
                            {/* Heure et date */}
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <span className="text-lg font-bold text-gray-900">
                                {formatTime(event.created_at)}
                              </span>
                              <span className="text-sm text-gray-600">
                                - {formatDate(event.created_at)}
                              </span>
                            </div>

                            {/* Description */}
                            <p className="text-gray-900 font-medium mb-2">
                              {event.description}
                            </p>

                            {/* Utilisateur */}
                            {event.user_email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="w-3 h-3" />
                                <span>{event.user_email}</span>
                              </div>
                            )}

                            {/* Détails formatés */}
                            {formatEventDetails(event.event_type, event.event_data)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bouton fermer */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Utiliser le portail React pour rendre le modal
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(modalContent, modalRoot);
}
