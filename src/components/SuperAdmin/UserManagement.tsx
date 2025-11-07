import React, { useState } from 'react';
import { Users, Search, Edit, Trash2, Crown, Clock, CheckCircle, XCircle, Calendar, Mail, Shield } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { User } from '../../types/admin';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';

export function UserManagement() {
  const { users, loading, updateUserStatus, deleteUser } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    is_super_admin: false,
    subscription_status: 'trial' as const,
    trial_ends_at: ''
  });

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      is_super_admin: user.is_super_admin,
      subscription_status: user.subscription_status,
      trial_ends_at: user.trial_ends_at ? user.trial_ends_at.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      await updateUserStatus(editingUser.id, {
        full_name: formData.full_name,
        is_super_admin: formData.is_super_admin,
        subscription_status: formData.subscription_status,
        trial_ends_at: formData.trial_ends_at ? new Date(formData.trial_ends_at).toISOString() : undefined
      });
      setShowEditModal(false);
      setEditingUser(null);
    } catch (error) {
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Supprimer définitivement l'utilisateur ${user.email} ?`)) {
      try {
        await deleteUser(user.id);
      } catch (error) {
        alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trial':
        return 'from-blue-100 to-cyan-100 text-blue-700 border-blue-200';
      case 'active':
        return 'from-green-100 to-emerald-100 text-green-700 border-green-200';
      case 'expired':
        return 'from-red-100 to-pink-100 text-red-700 border-red-200';
      case 'cancelled':
        return 'from-gray-100 to-gray-200 text-gray-700 border-gray-200';
      default:
        return 'from-gray-100 to-gray-200 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'trial':
        return <Clock className="w-4 h-4" />;
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRemainingTrialDays = (trialEndsAt?: string) => {
    if (!trialEndsAt) return 0;
    const now = new Date();
    const endDate = new Date(trialEndsAt);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="text-gray-600">Chargement des utilisateurs...</p>
          <p className="text-gray-500 text-sm mt-2">Nombre d'utilisateurs trouvés: {users.length}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              Gestion des Utilisateurs
            </h2>
            <p className="text-gray-600 mt-1">{users.length} utilisateur(s) enregistré(s)</p>
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 w-full sm:w-80"
            />
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8" />
              <div className="text-2xl font-bold">{users.length}</div>
            </div>
            <div className="text-blue-100">Total utilisateurs</div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8" />
              <div className="text-2xl font-bold">{users.filter(u => u.subscription_status === 'active').length}</div>
            </div>
            <div className="text-green-100">Abonnés actifs</div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8" />
              <div className="text-2xl font-bold">{users.filter(u => u.subscription_status === 'trial').length}</div>
            </div>
            <div className="text-orange-100">En essai gratuit</div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Crown className="w-8 h-8" />
              <div className="text-2xl font-bold">{users.filter(u => u.is_super_admin).length}</div>
            </div>
            <div className="text-purple-100">Super admins</div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-purple-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Utilisateur</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Statut</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Essai</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Inscription</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 transition-all duration-300 animate-fadeIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                          user.is_super_admin 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        }`}>
                          {user.is_super_admin ? <Crown className="w-5 h-5" /> : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {user.full_name || user.email}
                            {user.is_super_admin && (
                              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border bg-gradient-to-r ${getStatusColor(user.subscription_status)}`}>
                        {getStatusIcon(user.subscription_status)}
                        {user.subscription_status === 'trial' ? 'Essai gratuit' :
                         user.subscription_status === 'active' ? 'Abonné' :
                         user.subscription_status === 'expired' ? 'Expiré' : 'Annulé'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {user.subscription_status === 'trial' ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getRemainingTrialDays(user.trial_ends_at)} jour(s) restant(s)
                          </div>
                          <div className="text-xs text-gray-500">
                            Expire le {formatDate(user.trial_ends_at)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">-</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(user.created_at)}</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-110"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!user.is_super_admin && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-110"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur dans la base'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Aucun utilisateur ne correspond à votre recherche' 
                  : `Total dans auth.users: ${users.length} | Recherche: "${searchTerm}"`
                }
              </p>
              {!searchTerm && users.length === 0 && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Debug:</strong> Vérifiez la console pour les logs de chargement des utilisateurs.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'édition */}
      {showEditModal && editingUser && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Modifier l'utilisateur"
          size="md"
        >
          <div className="space-y-6">
            {/* Informations utilisateur */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {editingUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{editingUser.email}</div>
                  <div className="text-sm text-gray-600">ID: {editingUser.id.slice(0, 8)}...</div>
                </div>
              </div>
            </div>

            {/* Formulaire */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  placeholder="Nom complet de l'utilisateur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut d'abonnement
                </label>
                <select
                  value={formData.subscription_status}
                  onChange={(e) => setFormData(prev => ({ ...prev, subscription_status: e.target.value as any }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                >
                  <option value="trial">Essai gratuit</option>
                  <option value="active">Abonné actif</option>
                  <option value="expired">Expiré</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>

              {formData.subscription_status === 'trial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fin de l'essai gratuit
                  </label>
                  <input
                    type="date"
                    value={formData.trial_ends_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, trial_ends_at: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_super_admin"
                  checked={formData.is_super_admin}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_super_admin: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="is_super_admin" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-600" />
                  Super Administrateur
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveUser}
                className="flex-1"
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
