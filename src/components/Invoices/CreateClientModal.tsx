import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { User, Mail, Phone } from 'lucide-react';
import { useClients } from '../../hooks/useClients';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated?: (clientId: string) => void;
}

export function CreateClientModal({ isOpen, onClose, onClientCreated }: CreateClientModalProps) {
  const { addClient } = useClients();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstname || !formData.lastname || !formData.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Veuillez entrer une adresse email valide');
      return;
    }

    try {
      setLoading(true);

      const newClient = await addClient({
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email.toLowerCase(),
        phone: formData.phone
      });

      alert('✅ Client créé avec succès !');
      
      // Réinitialiser le formulaire
      setFormData({
        firstname: '',
        lastname: '',
        email: '',
        phone: ''
      });

      if (onClientCreated) {
        onClientCreated(newClient.id);
      }

      onClose();
    } catch (error) {
      console.error('Erreur création client:', error);
      alert('❌ Erreur lors de la création du client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer un client" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Prénom */}
        <div>
          <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
            <User className="w-4 h-4 mr-2 text-purple-600" />
            Prénom *
          </label>
          <input
            type="text"
            value={formData.firstname}
            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
            placeholder="Jean"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
          />
        </div>

        {/* Nom */}
        <div>
          <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
            <User className="w-4 h-4 mr-2 text-purple-600" />
            Nom *
          </label>
          <input
            type="text"
            value={formData.lastname}
            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
            placeholder="Dupont"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
            <Mail className="w-4 h-4 mr-2 text-blue-600" />
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="jean.dupont@example.com"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Téléphone */}
        <div>
          <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
            <Phone className="w-4 h-4 mr-2 text-green-600" />
            Téléphone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="06 12 34 56 78"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            💡 Le client sera automatiquement sélectionné après création
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer le client'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
