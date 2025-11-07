import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Plus, X, Mail, Phone, Check, CreditCard as Edit } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { Client } from '../../types';
import { Button } from '../UI/Button';

interface ClientSearchProps {
  onClientSelect: (client: Client | null) => void;
  selectedClient: Client | null;
}

export function ClientSearch({ onClientSelect, selectedClient }: ClientSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [showEditClientForm, setShowEditClientForm] = useState(false);
  const [editClientData, setEditClientData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: ''
  });
  const [newClientData, setNewClientData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);
  const { clients, loading, addClient, updateClient } = useClients();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEditClientSubmit = async () => {
    if (!selectedClient) return;
    
    // Validation des champs requis
    if (!editClientData.firstname.trim() || !editClientData.lastname.trim() || 
        !editClientData.email.trim() || !editClientData.phone.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setSaving(true);
    
    try {
      console.log('🔍 Recherche du client réel par email:', editClientData.email);
      
      // Trouver le client réel dans la liste des clients par email
      const realClient = clients.find(c => c.email.toLowerCase() === selectedClient.email.toLowerCase());
      
      if (!realClient) {
        console.error('❌ Client non trouvé dans la base de données');
        alert('Client non trouvé dans la base de données. Veuillez réessayer.');
        return;
      }
      
      console.log('✅ Client réel trouvé:', realClient.id);
      
      // Mettre à jour avec l'ID réel
      const updatedClient = await updateClient(realClient.id, editClientData);
      
      if (!updatedClient) {
        throw new Error('Erreur lors de la modification du client');
      }
      
      onClientSelect(updatedClient);
      setSearchTerm(`${updatedClient.firstname} ${updatedClient.lastname}`);
      setShowEditClientForm(false);
      
      console.log('✅ Client modifié avec succès:', updatedClient.email);
    } catch (error) {
      console.error('Erreur lors de la modification du client:', error);
      alert(`Erreur lors de la modification du client: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredClients = clients.filter(client =>
    `${client.firstname} ${client.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleClientSelect = (client: Client) => {
    onClientSelect(client);
    setSearchTerm(`${client.firstname} ${client.lastname}`);
    setIsDropdownOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsDropdownOpen(true);
    
    // Si on efface la sélection, déselectionner le client
    if (selectedClient) {
      onClientSelect(null);
    }
    
    // Pré-remplir les données si l'utilisateur tape un nom
    if (value.includes(' ')) {
      const parts = value.split(' ');
      if (parts.length >= 2) {
        setNewClientData(prev => ({
          ...prev,
          firstname: parts[0],
          lastname: parts.slice(1).join(' ')
        }));
      }
    }
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleNewClientSubmit = async () => {
    // Validation des champs requis
    if (!newClientData.firstname.trim() || !newClientData.lastname.trim() || 
        !newClientData.email.trim() || !newClientData.phone.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setSaving(true);
    
    try {
      console.log('🔄 Début création client dans modal...');
      const newClient = await addClient(newClientData);
      
      if (!newClient) {
        throw new Error('Erreur lors de la création du client');
      }
      
      console.log('✅ Client créé, sélection du client...');
      onClientSelect(newClient);
      setSearchTerm(`${newClient.firstname} ${newClient.lastname}`);
      setNewClientData({ firstname: '', lastname: '', email: '', phone: '' });
      setShowNewClientForm(false);
      setIsDropdownOpen(false);
      
      console.log('✅ Client créé et sélectionné avec succès:', newClient.email);
    } catch (error) {
      console.error('❌ Erreur lors de la création du client:', error);
      alert(`Erreur lors de la création du client: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const clearSelection = () => {
    setSearchTerm('');
    onClientSelect(null);
    setIsDropdownOpen(true);
    inputRef.current?.focus();
  };

  const openNewClientModal = () => {
    setIsDropdownOpen(false);
    setShowNewClientForm(true);
  };

  const closeNewClientModal = () => {
    setShowNewClientForm(false);
    setNewClientData({ firstname: '', lastname: '', email: '', phone: '' });
  };

  // Initialiser avec le client sélectionné
  useEffect(() => {
    if (selectedClient) {
      setSearchTerm(`${selectedClient.firstname} ${selectedClient.lastname}`);
    }
  }, [selectedClient]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node) && !showNewClientForm) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNewClientForm]);

  // Fermer le modal avec Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showNewClientForm) {
        closeNewClientModal();
      }
    };

    if (showNewClientForm) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNewClientForm]);

  return (
    <>
      <div ref={searchRef} className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client *
        </label>
        
        {/* Input de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder="Rechercher ou créer un client..."
            className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-base bg-white"
            required
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSelection}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 z-10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          {/* Indicateur de client sélectionné */}
          {selectedClient && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-green-500 z-10">
              <Check className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Dropdown de recherche */}
        {isDropdownOpen && !showNewClientForm && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-80 overflow-hidden z-[100000]">
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <div>Chargement...</div>
              </div>
            ) : (
              <>
                {/* Bouton nouveau client - Toujours en premier */}
                <button
                  type="button"
                  onClick={openNewClientModal}
                  className="w-full px-4 py-4 text-left hover:bg-blue-50 flex items-center gap-4 border-b border-gray-100 transition-colors bg-gradient-to-r from-blue-50 to-purple-50"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-blue-600 text-base">Nouveau client</div>
                    <div className="text-sm text-blue-500">
                      {searchTerm ? `Créer "${searchTerm}"` : 'Créer un nouveau client'}
                    </div>
                  </div>
                </button>

                {/* Liste des clients existants */}
                <div className="max-h-64 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <div className="font-medium">Aucun client trouvé</div>
                      <div className="text-sm">Créez un nouveau client ci-dessus</div>
                    </div>
                  ) : (
                    filteredClients.map((client, index) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleClientSelect(client)}
                        className="w-full px-4 py-4 text-left hover:bg-gray-50 flex items-center gap-4 transition-colors animate-fadeIn border-b border-gray-50 last:border-b-0"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 truncate text-base">
                            {client.firstname} {client.lastname}
                          </div>
                          <div className="text-sm text-gray-500 truncate flex items-center gap-2 mt-1">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            {client.email}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            {client.phone}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bouton d'édition du client sélectionné */}
      {selectedClient && !showNewClientForm && !showEditClientForm && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              setEditClientData({
                firstname: selectedClient.firstname,
                lastname: selectedClient.lastname,
                email: selectedClient.email,
                phone: selectedClient.phone
              });
              setShowEditClientForm(true);
            }}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 font-medium text-sm"
          >
            <Edit className="w-4 h-4" />
            Modifier les informations de {selectedClient.firstname}
          </button>
        </div>
      )}

      {/* Formulaire édition client inline - SANS <form> */}
      {showEditClientForm && selectedClient && (
        <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-4 sm:p-6 animate-slideDown">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-green-800">Modifier le client</h3>
                <p className="text-green-600 text-xs sm:text-sm">Modifier les informations de {selectedClient.firstname}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEditClientForm(false)}
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors mobile-tap-target"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Formulaire - DIV au lieu de FORM */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={editClientData.firstname}
                  onChange={(e) => setEditClientData(prev => ({ ...prev, firstname: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-base"
                  placeholder="Prénom"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={editClientData.lastname}
                  onChange={(e) => setEditClientData(prev => ({ ...prev, lastname: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-base"
                  placeholder="Nom"
                  autoComplete="family-name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={editClientData.email}
                  onChange={(e) => setEditClientData(prev => ({ ...prev, email: e.target.value.toLowerCase() }))}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-base"
                  placeholder="email@exemple.com"
                  autoComplete="email"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={editClientData.phone}
                  onChange={(e) => setEditClientData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-base"
                  placeholder="06 12 34 56 78"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-green-200">
              <button
                type="button"
                onClick={() => setShowEditClientForm(false)}
                className="flex-1 bg-gray-500 text-white px-4 py-3 rounded-xl hover:bg-gray-600 transition-colors font-medium text-base"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleEditClientSubmit}
                disabled={saving || !editClientData.firstname || !editClientData.lastname || !editClientData.email || !editClientData.phone}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center justify-center gap-2 text-base"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Modification...
                  </>
                ) : (
                  <>
                    <Edit className="w-5 h-5" />
                    Modifier le client
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire nouveau client inline - SANS <form> */}
      {showNewClientForm && (
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-2xl p-4 sm:p-6 animate-slideDown">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-blue-800">Nouveau client</h3>
                <p className="text-blue-600 text-xs sm:text-sm">Créer un nouveau client</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeNewClientModal}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors mobile-tap-target"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Pré-remplissage depuis la recherche */}
          {searchTerm && !selectedClient && (
            <div className="bg-blue-100 border border-blue-300 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 text-blue-700 text-sm">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">i</span>
                </div>
                <span>Pré-rempli depuis votre recherche</span>
              </div>
            </div>
          )}

          {/* Formulaire - DIV au lieu de FORM */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={newClientData.firstname}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, firstname: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-base"
                  placeholder="Prénom"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={newClientData.lastname}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, lastname: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-base"
                  placeholder="Nom"
                  autoComplete="family-name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value.toLowerCase() }))}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-base"
                  placeholder="email@exemple.com"
                  autoComplete="email"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-base"
                  placeholder="06 12 34 56 78"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-blue-200">
              <button
                type="button"
                onClick={closeNewClientModal}
                className="flex-1 bg-gray-500 text-white px-4 py-3 rounded-xl hover:bg-gray-600 transition-colors font-medium text-base"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleNewClientSubmit}
                disabled={saving || !newClientData.firstname || !newClientData.lastname || !newClientData.email || !newClientData.phone}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center justify-center gap-2 text-base"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Créer le client
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
