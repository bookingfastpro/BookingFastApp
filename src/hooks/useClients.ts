import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Client } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    if (!user) {
      setClients([]);
      setError('Utilisateur non trouvé');
      return;
    }

    if (!supabase) {
      setClients([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Déterminer l'ID utilisateur pour lequel charger les données
      let targetUserId = user.id;
      
      // Vérifier si l'utilisateur est membre d'une équipe
      try {
        const { data: membershipData, error: membershipError } = await supabase
          .from('team_members')
          .select('owner_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!membershipError && membershipData?.owner_id) {
          targetUserId = membershipData.owner_id;
          console.log('👥 Membre d\'équipe - chargement clients du propriétaire:', targetUserId);
        } else {
          console.log('👑 Propriétaire - chargement clients propres:', targetUserId);
        }
      } catch (teamError) {
        console.warn('⚠️ Erreur vérification équipe, utilisation ID utilisateur:', teamError);
      }

      let query = supabase
        .from('clients')
        .select('*')
        .eq('user_id', targetUserId);

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des clients:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const searchClients = async (query: string): Promise<Client[]> => {
    if (!query.trim() || !supabase || !user) return [];

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .or(`firstname.ilike.%${query}%,lastname.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erreur lors de la recherche de clients:', err);
      return [];
    }
  };

  const getOrCreateClient = async (clientData: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
  }): Promise<Client> => {
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (!supabase) {
      const demoClient: Client = {
        id: `demo-${Date.now()}`,
        user_id: user.id,
        firstname: clientData.firstname,
        lastname: clientData.lastname,
        email: clientData.email.toLowerCase(),
        phone: clientData.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setClients(prev => [demoClient, ...prev]);
      console.log('✅ Client démo créé:', demoClient.email);
      return demoClient;
    }

    try {
      console.log('🔍 Recherche client existant:', clientData.email);
      
      const { data: existingClients, error: searchError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', clientData.email.toLowerCase())
        .eq('user_id', user.id)
        .limit(1);

      if (searchError) throw searchError;

      if (existingClients && existingClients.length > 0) {
        console.log('👤 Client existant trouvé, mise à jour...');
        const existingClient = existingClients[0];
        const { data: updatedClient, error: updateError } = await supabase
          .from('clients')
          .update({
            firstname: clientData.firstname,
            lastname: clientData.lastname,
            email: clientData.email.toLowerCase(),
            phone: clientData.phone,
            user_id: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingClient.id)
          .select()
          .single();

        if (updateError) throw updateError;
        
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
        
        console.log('✅ Client existant mis à jour:', updatedClient.email);
        return updatedClient;
      } else {
        console.log('➕ Création nouveau client...');
        const { data: newClient, error: createError } = await supabase
          .from('clients')
          .insert([{
            firstname: clientData.firstname,
            lastname: clientData.lastname,
            email: clientData.email.toLowerCase(),
            phone: clientData.phone,
            user_id: user.id
          }])
          .select()
          .single();

        if (createError) throw createError;
        
        setClients(prev => [newClient, ...prev]);
        
        console.log('✅ Nouveau client créé:', newClient.email);
        return newClient;
      }
    } catch (err) {
      console.error('❌ Erreur lors de la création/récupération du client:', err);
      throw err;
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Client> => {
    try {
      console.log('🔄 Début création client:', clientData.email);
      const result = await getOrCreateClient(clientData);
      console.log('✅ Client créé/récupéré avec succès:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Erreur dans addClient:', error);
      throw error;
    }
  };

  const updateClient = async (clientId: string, updates: Partial<Client>): Promise<Client> => {
    if (!supabase) {
      // Mode démo - mettre à jour localement
      const updatedClient = {
        ...clients.find(c => c.id === clientId)!,
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));
      console.log('✅ Client démo modifié:', updatedClient.email);
      return updatedClient;
    }

    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('clients')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      
      setClients(prev => prev.map(c => c.id === clientId ? data : c));
      console.log('✅ Client modifié avec succès:', data.email);
      return data;
    } catch (err) {
      console.error('Erreur lors de la modification du client:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  const deleteClient = async (clientId: string) => {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      
      setClients(prev => prev.filter(client => client.id !== clientId));
    } catch (err) {
      console.error('Erreur lors de la suppression du client:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user?.id]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    searchClients,
    getOrCreateClient,
    addClient,
    updateClient,
    deleteClient,
  };
}
