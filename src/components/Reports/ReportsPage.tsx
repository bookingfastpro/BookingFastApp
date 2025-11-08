import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Euro, 
  Calendar,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Clock,
  Star,
  Target,
  Activity,
  CreditCard,
  Wallet,
  Building2,
  Smartphone,
  UserCheck,
  TrendingDown
} from 'lucide-react';
import { useBookings } from '../../hooks/useBookings';
import { useServices } from '../../hooks/useServices';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { calculatePriceHT } from '../../lib/taxCalculations';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

type Period = 'week' | 'month' | 'quarter' | 'year';

const PAYMENT_METHOD_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  cash: { label: 'Espèces', icon: Wallet, color: '#10b981' },
  card: { label: 'Carte bancaire', icon: CreditCard, color: '#3b82f6' },
  transfer: { label: 'Virement', icon: Building2, color: '#8b5cf6' },
  stripe: { label: 'Paiement en ligne', icon: Smartphone, color: '#f59e0b' }
};

export function ReportsPage() {
  const { bookings, loading: bookingsLoading } = useBookings();
  const { services } = useServices();
  const { settings } = useBusinessSettings();
  const { teamMembers } = useTeamMembers();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('all');

  useEffect(() => {
    // Définir la plage de dates par défaut selon la période
    const end = new Date();
    const start = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  }, [selectedPeriod]);

  // Filtrer les réservations par période et membre d'équipe
  const filteredBookings = bookings.filter(b => {
    if (!dateRange.start || !dateRange.end) return true;
    const dateMatch = b.date >= dateRange.start && b.date <= dateRange.end;
    const teamMatch = selectedTeamMember === 'all' || b.assigned_user_id === selectedTeamMember;
    return dateMatch && teamMatch;
  });

  // Calculer le taux de TVA
  const taxRate = settings?.tax_rate || 20;

  // Calculer les statistiques
  const stats = {
    totalRevenueTTC: filteredBookings.reduce((sum, b) => sum + b.total_amount, 0),
    totalRevenueHT: filteredBookings.reduce((sum, b) => sum + calculatePriceHT(b.total_amount, taxRate), 0),
    totalBookings: filteredBookings.length,
    averageBookingValue: filteredBookings.length > 0 
      ? filteredBookings.reduce((sum, b) => sum + b.total_amount, 0) / filteredBookings.length 
      : 0,
    uniqueClients: new Set(filteredBookings.map(b => b.client_email)).size,
    completedBookings: filteredBookings.filter(b => b.booking_status === 'confirmed').length,
    cancelledBookings: filteredBookings.filter(b => b.booking_status === 'cancelled').length,
    pendingPayments: filteredBookings.filter(b => b.payment_status === 'pending').length,
    completedPayments: filteredBookings.filter(b => b.payment_status === 'completed').length
  };

  // Analyse des paiements par méthode
  const paymentMethodStats = filteredBookings.reduce((acc, booking) => {
    if (booking.transactions) {
      booking.transactions
        .filter(t => t.status === 'completed')
        .forEach(transaction => {
          if (!acc[transaction.method]) {
            acc[transaction.method] = {
              method: transaction.method,
              totalTTC: 0,
              totalHT: 0,
              count: 0
            };
          }
          acc[transaction.method].totalTTC += transaction.amount;
          acc[transaction.method].totalHT += calculatePriceHT(transaction.amount, taxRate);
          acc[transaction.method].count += 1;
        });
    }
    return acc;
  }, {} as Record<string, { method: string; totalTTC: number; totalHT: number; count: number }>);

  const paymentMethodData = Object.values(paymentMethodStats).map(stat => ({
    ...stat,
    label: PAYMENT_METHOD_LABELS[stat.method]?.label || stat.method,
    color: PAYMENT_METHOD_LABELS[stat.method]?.color || '#6b7280'
  }));

  // Analyse par membre d'équipe
  const teamMemberStats = filteredBookings.reduce((acc, booking) => {
    const memberId = booking.assigned_user_id || 'unassigned';
    
    if (!acc[memberId]) {
      const member = teamMembers.find(m => m.user_id === memberId);
      acc[memberId] = {
        id: memberId,
        name: member ? `${member.firstname} ${member.lastname}` : 'Non assigné',
        totalTTC: 0,
        totalHT: 0,
        bookings: 0,
        paymentMethods: {} as Record<string, { totalTTC: number; totalHT: number; count: number }>
      };
    }

    acc[memberId].totalTTC += booking.total_amount;
    acc[memberId].totalHT += calculatePriceHT(booking.total_amount, taxRate);
    acc[memberId].bookings += 1;

    // Analyser les paiements par méthode pour ce membre
    if (booking.transactions) {
      booking.transactions
        .filter(t => t.status === 'completed')
        .forEach(transaction => {
          if (!acc[memberId].paymentMethods[transaction.method]) {
            acc[memberId].paymentMethods[transaction.method] = {
              totalTTC: 0,
              totalHT: 0,
              count: 0
            };
          }
          acc[memberId].paymentMethods[transaction.method].totalTTC += transaction.amount;
          acc[memberId].paymentMethods[transaction.method].totalHT += calculatePriceHT(transaction.amount, taxRate);
          acc[memberId].paymentMethods[transaction.method].count += 1;
        });
    }

    return acc;
  }, {} as Record<string, {
    id: string;
    name: string;
    totalTTC: number;
    totalHT: number;
    bookings: number;
    paymentMethods: Record<string, { totalTTC: number; totalHT: number; count: number }>;
  }>);

  const teamMemberData = Object.values(teamMemberStats)
    .sort((a, b) => b.totalTTC - a.totalTTC);

  // Données pour le graphique de revenus par jour
  const revenueByDay = filteredBookings.reduce((acc, booking) => {
    const date = booking.date;
    if (!acc[date]) {
      acc[date] = { date, revenueTTC: 0, revenueHT: 0, bookings: 0 };
    }
    acc[date].revenueTTC += booking.total_amount;
    acc[date].revenueHT += calculatePriceHT(booking.total_amount, taxRate);
    acc[date].bookings += 1;
    return acc;
  }, {} as Record<string, { date: string; revenueTTC: number; revenueHT: number; bookings: number }>);

  const revenueChartData = Object.values(revenueByDay)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      'CA TTC': d.revenueTTC,
      'CA HT': d.revenueHT,
      bookings: d.bookings
    }));

  // Données pour le graphique des services
  const serviceStats = services.map(service => {
    const serviceBookings = filteredBookings.filter(b => b.service_id === service.id);
    const totalTTC = serviceBookings.reduce((sum, b) => sum + b.total_amount, 0);
    return {
      name: service.name,
      bookings: serviceBookings.length,
      revenueTTC: totalTTC,
      revenueHT: calculatePriceHT(totalTTC, taxRate)
    };
  }).filter(s => s.bookings > 0)
    .sort((a, b) => b.revenueTTC - a.revenueTTC);

  // Données pour le graphique des statuts de paiement
  const paymentStatusData = [
    { name: 'Payé', value: stats.completedPayments, color: '#10b981' },
    { name: 'En attente', value: stats.pendingPayments, color: '#f59e0b' },
    { name: 'Partiel', value: filteredBookings.filter(b => b.payment_status === 'partial').length, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  // Top clients
  const clientStats = filteredBookings.reduce((acc, booking) => {
    const key = `${booking.client_firstname} ${booking.client_name}`;
    if (!acc[key]) {
      acc[key] = {
        name: key,
        email: booking.client_email,
        bookings: 0,
        revenueTTC: 0,
        revenueHT: 0
      };
    }
    acc[key].bookings += 1;
    acc[key].revenueTTC += booking.total_amount;
    acc[key].revenueHT += calculatePriceHT(booking.total_amount, taxRate);
    return acc;
  }, {} as Record<string, { name: string; email: string; bookings: number; revenueTTC: number; revenueHT: number }>);

  const topClients = Object.values(clientStats)
    .sort((a, b) => b.revenueTTC - a.revenueTTC)
    .slice(0, 10);

  // Taux de conversion
  const conversionRate = stats.totalBookings > 0 
    ? (stats.completedBookings / stats.totalBookings) * 100 
    : 0;

  // Exporter les données
  const exportToCSV = () => {
    const headers = ['Date', 'Client', 'Service', 'Montant TTC', 'Montant HT', 'Statut', 'Paiement', 'Membre assigné'];
    const rows = filteredBookings.map(b => {
      const member = teamMembers.find(m => m.user_id === b.assigned_user_id);
      return [
        b.date,
        `${b.client_firstname} ${b.client_name}`,
        services.find(s => s.id === b.service_id)?.name || '',
        b.total_amount.toFixed(2),
        calculatePriceHT(b.total_amount, taxRate).toFixed(2),
        b.booking_status,
        b.payment_status,
        member ? `${member.firstname} ${member.lastname}` : 'Non assigné'
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapports_${dateRange.start}_${dateRange.end}.csv`;
    a.click();
  };

  if (bookingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className=" bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8" style={{ paddingBottom: 'max(6rem, calc(6rem + env(safe-area-inset-bottom)))' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Rapports Avancés</h1>
                <p className="text-white/90 text-base sm:text-lg">Analyse détaillée de votre activité</p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="w-full sm:w-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              Exporter CSV
            </button>
          </div>

          {/* Sélecteur de période */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
            {[
              { key: 'week', label: '7 derniers jours' },
              { key: 'month', label: '30 derniers jours' },
              { key: 'quarter', label: '3 derniers mois' },
              { key: 'year', label: '12 derniers mois' }
            ].map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as Period)}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base ${
                  selectedPeriod === period.key
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Plage de dates personnalisée */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">Période personnalisée :</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 text-sm sm:text-base"
              />
              <span className="hidden sm:inline">→</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Filtre par membre d'équipe */}
          {teamMembers.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">Membre d'équipe :</span>
              </div>
              <select
                value={selectedTeamMember}
                onChange={e => setSelectedTeamMember(e.target.value)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm sm:text-base"
              >
                <option value="all" className="text-gray-900">Tous les membres</option>
                {teamMembers.map(member => (
                  <option key={member.user_id} value={member.user_id} className="text-gray-900">
                    {member.firstname} {member.lastname}
                  </option>
                ))}
                <option value="unassigned" className="text-gray-900">Non assigné</option>
              </select>
            </div>
          )}
        </div>

        {/* KPIs principaux */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <KPICard
            title="CA TTC"
            value={`${stats.totalRevenueTTC.toFixed(2)}€`}
            icon={Euro}
            color="from-green-500 to-emerald-500"
            subtitle={`HT: ${stats.totalRevenueHT.toFixed(2)}€`}
          />
          <KPICard
            title="Réservations"
            value={stats.totalBookings.toString()}
            icon={Calendar}
            color="from-blue-500 to-cyan-500"
            trend={8.3}
          />
          <KPICard
            title="Clients uniques"
            value={stats.uniqueClients.toString()}
            icon={Users}
            color="from-purple-500 to-pink-500"
            trend={15.7}
          />
          <KPICard
            title="Panier moyen"
            value={`${stats.averageBookingValue.toFixed(2)}€`}
            icon={Target}
            color="from-orange-500 to-red-500"
            trend={-3.2}
          />
        </div>

        {/* Analyse des paiements */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            Analyse des paiements par méthode
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Graphique en camembert */}
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="totalTTC"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)}€`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Détails par méthode */}
            <div className="space-y-3">
              {paymentMethodData.map(method => {
                const Icon = PAYMENT_METHOD_LABELS[method.method]?.icon || Wallet;
                return (
                  <div key={method.method} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: method.color + '20' }}>
                          <Icon className="w-5 h-5" style={{ color: method.color }} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{method.label}</div>
                          <div className="text-xs text-gray-600">{method.count} transaction(s)</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg" style={{ color: method.color }}>
                          {method.totalTTC.toFixed(2)}€
                        </div>
                        <div className="text-xs text-gray-600">
                          HT: {method.totalHT.toFixed(2)}€
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(method.totalTTC / stats.totalRevenueTTC) * 100}%`,
                          backgroundColor: method.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Performance par membre d'équipe */}
        {teamMemberData.length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              Performance par membre d'équipe
            </h3>

            <div className="space-y-6">
              {teamMemberData.map((member, index) => (
                <div key={member.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-600">{member.bookings} réservation(s)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        {member.totalTTC.toFixed(2)}€
                      </div>
                      <div className="text-sm text-gray-600">
                        HT: {member.totalHT.toFixed(2)}€
                      </div>
                    </div>
                  </div>

                  {/* Détail par méthode de paiement */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {Object.entries(member.paymentMethods).map(([method, data]) => {
                      const Icon = PAYMENT_METHOD_LABELS[method]?.icon || Wallet;
                      const color = PAYMENT_METHOD_LABELS[method]?.color || '#6b7280';
                      return (
                        <div key={method} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4" style={{ color }} />
                            <span className="text-xs font-medium text-gray-700">
                              {PAYMENT_METHOD_LABELS[method]?.label || method}
                            </span>
                          </div>
                          <div className="font-bold text-gray-900">{data.totalTTC.toFixed(2)}€</div>
                          <div className="text-xs text-gray-600">HT: {data.totalHT.toFixed(2)}€</div>
                          <div className="text-xs text-gray-500">{data.count} paiement(s)</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Graphiques principaux */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Évolution du CA */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              Évolution du chiffre d'affaires
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="CA TTC" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="CA TTC (€)"
                />
                <Line 
                  type="monotone" 
                  dataKey="CA HT" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="CA HT (€)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Réservations par service */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              Performance par service
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenueTTC" fill="#3b82f6" name="CA TTC (€)" />
                <Bar dataKey="revenueHT" fill="#93c5fd" name="CA HT (€)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statuts et analyses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Statuts de paiement */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              Statuts de paiement
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Taux de conversion */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
              Taux de conversion
            </h3>
            <div className="flex flex-col items-center justify-center h-[250px]">
              <div className="relative w-48 h-48">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#10b981"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${(conversionRate / 100) * 502.4} 502.4`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</div>
                    <div className="text-xs sm:text-sm text-gray-600">Confirmées</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="text-xs sm:text-sm text-gray-600">
                  {stats.completedBookings} / {stats.totalBookings} réservations
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              Statistiques clés
            </h3>
            <div className="space-y-4">
              <StatItem
                label="Réservations confirmées"
                value={stats.completedBookings}
                total={stats.totalBookings}
                color="green"
              />
              <StatItem
                label="Réservations annulées"
                value={stats.cancelledBookings}
                total={stats.totalBookings}
                color="red"
              />
              <StatItem
                label="Paiements complétés"
                value={stats.completedPayments}
                total={stats.totalBookings}
                color="blue"
              />
              <StatItem
                label="Paiements en attente"
                value={stats.pendingPayments}
                total={stats.totalBookings}
                color="orange"
              />
            </div>
          </div>
        </div>

        {/* Top clients */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
            Top 10 clients
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 sm:px-4 font-bold text-gray-700 text-sm sm:text-base">Rang</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-bold text-gray-700 text-sm sm:text-base">Client</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-bold text-gray-700 text-sm sm:text-base hidden sm:table-cell">Email</th>
                  <th className="text-right py-3 px-2 sm:px-4 font-bold text-gray-700 text-sm sm:text-base">RDV</th>
                  <th className="text-right py-3 px-2 sm:px-4 font-bold text-gray-700 text-sm sm:text-base">CA TTC</th>
                  <th className="text-right py-3 px-2 sm:px-4 font-bold text-gray-700 text-sm sm:text-base hidden lg:table-cell">CA HT</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((client, index) => (
                  <tr key={client.email} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 sm:px-4">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-white text-xs sm:text-sm ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4 font-medium text-gray-900 text-sm sm:text-base">{client.name}</td>
                    <td className="py-3 px-2 sm:px-4 text-gray-600 text-sm sm:text-base hidden sm:table-cell">{client.email}</td>
                    <td className="py-3 px-2 sm:px-4 text-right font-medium text-sm sm:text-base">{client.bookings}</td>
                    <td className="py-3 px-2 sm:px-4 text-right font-bold text-green-600 text-sm sm:text-base">
                      {client.revenueTTC.toFixed(2)}€
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-right font-medium text-blue-600 text-sm sm:text-base hidden lg:table-cell">
                      {client.revenueHT.toFixed(2)}€
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  trend?: number;
  subtitle?: string;
}

function KPICard({ title, value, icon: Icon, color, trend, subtitle }: KPICardProps) {
  return (
    <div className={`bg-gradient-to-r ${color} rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white transform hover:scale-105 transition-all duration-300 shadow-lg`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${
            trend >= 0 ? 'text-white' : 'text-white/80'
          }`}>
            {trend >= 0 ? <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-bold mb-2">{value}</div>
      <div className="text-white/80 text-xs sm:text-sm">{title}</div>
      {subtitle && (
        <div className="text-white/70 text-xs mt-1">{subtitle}</div>
      )}
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: number;
  total: number;
  color: 'green' | 'red' | 'blue' | 'orange';
}

function StatItem({ label, value, total, color }: StatItemProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colors = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs sm:text-sm font-bold text-gray-900">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colors[color]} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
