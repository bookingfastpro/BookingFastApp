import React from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Crown, Gift, Zap, Clock } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { useBookings } from '../../hooks/useBookings';

export function AdminStats() {
  const { users, accessCodes, redemptions, loading, error } = useAdmin();
  const { bookings } = useBookings();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // 🛡️ DEFENSIVE CHECKS - Ensure all data arrays exist
  const safeUsers = users || [];
  const safeAccessCodes = accessCodes || [];
  const safeRedemptions = redemptions || [];
  const safeBookings = bookings || [];

  const totalUsers = safeUsers.length;
  const activeUsers = safeUsers.filter(u => u.subscription_status === 'active').length;
  const trialUsers = safeUsers.filter(u => u.subscription_status === 'trial').length;
  const expiredUsers = safeUsers.filter(u => u.subscription_status === 'expired').length;
  const superAdmins = safeUsers.filter(u => u.is_super_admin).length;
  const activeCodes = safeAccessCodes.filter(c => c.is_active).length;

  const totalRevenue = activeUsers * 59.99; // Revenus mensuels estimés
  const totalBookings = safeBookings.length;

  const conversionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
  const churnRate = totalUsers > 0 ? (expiredUsers / totalUsers) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Vue d'ensemble */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          Vue d'Ensemble de la Plateforme
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8" />
              <TrendingUp className="w-5 h-5 text-blue-200" />
            </div>
            <div className="text-3xl font-bold mb-2">{totalUsers}</div>
            <div className="text-blue-100 text-sm">Utilisateurs totaux</div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8" />
              <TrendingUp className="w-5 h-5 text-green-200" />
            </div>
            <div className="text-3xl font-bold mb-2">{totalRevenue.toFixed(0)}€</div>
            <div className="text-green-100 text-sm">Revenus mensuels</div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8" />
              <TrendingUp className="w-5 h-5 text-purple-200" />
            </div>
            <div className="text-3xl font-bold mb-2">{totalBookings}</div>
            <div className="text-purple-100 text-sm">Réservations totales</div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="text-3xl font-bold mb-2">{conversionRate.toFixed(1)}%</div>
            <div className="text-orange-100 text-sm">Taux de conversion</div>
          </div>
        </div>
      </div>

      {/* Répartition des utilisateurs */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          Répartition des Utilisateurs
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">{activeUsers}</div>
            <div className="text-sm text-gray-600">Abonnés actifs</div>
            <div className="text-xs text-green-600 font-medium mt-1">
              {totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0}%
            </div>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">{trialUsers}</div>
            <div className="text-sm text-gray-600">En essai gratuit</div>
            <div className="text-xs text-blue-600 font-medium mt-1">
              {totalUsers > 0 ? ((trialUsers / totalUsers) * 100).toFixed(1) : 0}%
            </div>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600 mb-1">{expiredUsers}</div>
            <div className="text-sm text-gray-600">Expirés</div>
            <div className="text-xs text-red-600 font-medium mt-1">
              {totalUsers > 0 ? ((expiredUsers / totalUsers) * 100).toFixed(1) : 0}%
            </div>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-1">{superAdmins}</div>
            <div className="text-sm text-gray-600">Super admins</div>
            <div className="text-xs text-purple-600 font-medium mt-1">
              {totalUsers > 0 ? ((superAdmins / totalUsers) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Métriques business */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-600" />
            Métriques Financières
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <span className="text-green-800 font-medium">Revenus mensuels récurrents (MRR)</span>
              <span className="text-2xl font-bold text-green-600">{totalRevenue.toFixed(2)}€</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
              <span className="text-blue-800 font-medium">Revenus annuels récurrents (ARR)</span>
              <span className="text-2xl font-bold text-blue-600">{(totalRevenue * 12).toFixed(0)}€</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <span className="text-purple-800 font-medium">Valeur moyenne par utilisateur</span>
              <span className="text-2xl font-bold text-purple-600">
                {activeUsers > 0 ? (totalRevenue / activeUsers).toFixed(2) : '0.00'}€
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
              <span className="text-orange-800 font-medium">Taux de conversion</span>
              <span className="text-2xl font-bold text-orange-600">{conversionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Gift className="w-6 h-6 text-purple-600" />
            Codes d'Accès
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <span className="text-purple-800 font-medium">Codes créés</span>
              <span className="text-2xl font-bold text-purple-600">{safeAccessCodes.length}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <span className="text-green-800 font-medium">Codes actifs</span>
              <span className="text-2xl font-bold text-green-600">{activeCodes}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
              <span className="text-blue-800 font-medium">Codes utilisés</span>
              <span className="text-2xl font-bold text-blue-600">{safeRedemptions.length}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
              <span className="text-orange-800 font-medium">Taux d'utilisation</span>
              <span className="text-2xl font-bold text-orange-600">
                {safeAccessCodes.length > 0 ? ((safeRedemptions.length / safeAccessCodes.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique de croissance (simulation) */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-green-600" />
          Croissance de la Plateforme
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-blue-800">Acquisition</h4>
                <p className="text-blue-600 text-sm">Nouveaux utilisateurs</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">+{trialUsers}</div>
            <div className="text-blue-700 text-sm">En essai gratuit</div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-green-800">Conversion</h4>
                <p className="text-green-600 text-sm">Essai → Abonnement</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">{conversionRate.toFixed(1)}%</div>
            <div className="text-green-700 text-sm">Taux de conversion</div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-purple-800">Rétention</h4>
                <p className="text-purple-600 text-sm">Utilisateurs actifs</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">{activeUsers}</div>
            <div className="text-purple-700 text-sm">Abonnés fidèles</div>
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Zap className="w-6 h-6 text-orange-600" />
          Activité Récente
        </h3>

        <div className="space-y-4">
          {/* Nouveaux utilisateurs */}
          {safeUsers.slice(0, 5).map((user, index) => {
            const createdDate = user.created_at ? new Date(user.created_at) : new Date();
            
            return (
            <div
              key={user.id}
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 animate-fadeIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold">
                {user.email.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-gray-900">{user.email}</div>
                <div className="text-sm text-gray-600">
                  Inscrit le {createdDate.toLocaleDateString('fr-FR')}
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.subscription_status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : user.subscription_status === 'trial'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {user.subscription_status === 'active' ? '✅ Abonné' :
                 user.subscription_status === 'trial' ? '⏳ Essai' : '❌ Expiré'}
              </div>
            </div>
          );
          })}

          {safeUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune activité</h4>
              <p className="text-gray-500">L'activité des utilisateurs apparaîtra ici</p>
            </div>
          )}
        </div>
      </div>

      {/* Objectifs et KPIs */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-purple-600" />
          Objectifs et KPIs
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-gray-800 mb-4">Objectifs Mensuels</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nouveaux utilisateurs</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{ width: `${Math.min((trialUsers / 50) * 100, 100)}%` }}></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{trialUsers}/50</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Conversions</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: `${Math.min((activeUsers / 20) * 100, 100)}%` }}></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{activeUsers}/20</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenus</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: `${Math.min((totalRevenue / 1000) * 100, 100)}%` }}></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{totalRevenue.toFixed(0)}€/1000€</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 mb-4">Métriques Clés</h4>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                <div className="text-green-800 text-sm font-medium">Lifetime Value (LTV)</div>
                <div className="text-2xl font-bold text-green-600">
                  {activeUsers > 0 ? (totalRevenue * 12 / activeUsers).toFixed(0) : 0}€
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3">
                <div className="text-blue-800 text-sm font-medium">Churn Rate</div>
                <div className="text-2xl font-bold text-blue-600">{churnRate.toFixed(1)}%</div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
                <div className="text-purple-800 text-sm font-medium">Codes actifs</div>
                <div className="text-2xl font-bold text-purple-600">{activeCodes}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
