import React, { useEffect, useState } from 'react';
import { CheckCircle, Calendar, Clock, User, Mail, Phone, Package, CreditCard } from 'lucide-react';
import { Booking } from '../../types';

interface BookingSuccessProps {
  booking: Booking;
}

export function BookingSuccess({ booking }: BookingSuccessProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  // 🔥 FONCTION POUR FORMATER L'HEURE (HH:mm au lieu de HH:mm:ss)
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    // Si le format est "HH:mm:ss", on prend seulement "HH:mm"
    return timeString.substring(0, 5);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const totalPaid = booking.transactions
    ?.filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const remainingAmount = booking.total_amount - totalPaid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className={`max-w-2xl w-full transition-all duration-700 ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {/* Animation de succès */}
        <div className="text-center mb-8">
          <div className="flex justify-center gap-4 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            ))}
          </div>
          
          <div className="w-32 h-32 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Réservation confirmée !
          </h1>
          <p className="text-lg text-gray-600">
            Votre rendez-vous a été enregistré avec succès
          </p>
        </div>

        {/* Carte de détails */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header avec service */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {booking.custom_service_data?.name || booking.service?.name || 'Service'}
                  </h2>
                  <p className="text-white/80">
                    {booking.custom_service_data?.duration || booking.service?.duration_minutes || booking.duration_minutes} minutes
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{booking.total_amount.toFixed(2)}€</div>
                {booking.quantity > 1 && (
                  <div className="text-white/80 text-sm">× {booking.quantity}</div>
                )}
              </div>
            </div>
          </div>

          {/* Détails */}
          <div className="p-6 space-y-4">
            {/* Date et heure */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-200">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-900">Date et heure</h3>
              </div>
              <div className="ml-8">
                <div className="text-gray-900 font-medium">{formatDate(booking.date)}</div>
                <div className="flex items-center gap-2 text-purple-600 font-medium mt-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(booking.time)}
                </div>
              </div>
            </div>

            {/* Coordonnées */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">Vos coordonnées</h3>
              </div>
              <div className="ml-8 space-y-2">
                <div className="text-gray-900 font-medium">
                  {booking.client_firstname} {booking.client_name}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  {booking.client_email}
                </div>
                {booking.client_phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {booking.client_phone}
                  </div>
                )}
              </div>
            </div>

            {/* Paiement */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-900">Paiement</h3>
              </div>
              <div className="ml-8 space-y-2">
                {totalPaid > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Acompte payé</span>
                    <span className="font-bold text-green-600">{totalPaid.toFixed(2)}€</span>
                  </div>
                )}
                {remainingAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Solde à régler sur place</span>
                    <span className="font-bold text-orange-600">{remainingAmount.toFixed(2)}€</span>
                  </div>
                )}
                <div className="pt-2 border-t border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-green-600">
                      {booking.total_amount.toFixed(2)}€
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message de confirmation */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Email de confirmation envoyé</h3>
              <p className="text-blue-700">
                Un email de confirmation a été envoyé à{' '}
                <span className="font-medium">{booking.client_email}</span> avec tous les détails de votre réservation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
