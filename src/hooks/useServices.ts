import { useState, useEffect } from 'react';
import { supabase, isNetworkError, retryRequest } from '../lib/supabase';
import { Service } from '../types';
import { useAuth } from '../contexts/AuthContext';

const DEMO_CUSTOM_SERVICE_UUID = '00000000-0000-0000-0000-000000000001';

export function useServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createCustomServiceTemplate = (id: string): Service => ({
    id,
    name: 'Service personnalisé',
    price_ht: 0,
    price_ttc: 0,
    image_url: null,
    description: 'Service personnalisé',
    duration_minutes: 60,
    capacity: 1,
    unit_name: 'participants',
    availability_hours: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const fetchServices = async () => {
    if (!user) {
      setServices([]);
      setLoading(false);
      return;
    }

    if (!supabase) {
      const defaultServices = [
        {
          id: 'demo-1',
          user_id: user?.id || 'demo',
          name: 'Massage relaxant',
          price_ht: 66.67,
          price_ttc: 80.00,
          image_url: 'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg',
          description: 'Massage de détente de 60 minutes pour évacuer le stress',
          duration_minutes: 60,
          capacity: 1,
          unit_name: 'personnes',
          availability_hours: {
            monday: { ranges: [{ start: '09:00', end: '17:00' }], closed: false },
            tuesday: { ranges: [{ start: '09:00', end: '17:00' }], closed: false },
            wednesday: { ranges: [{ start: '09:00', end: '17:00' }], closed: false },
            thursday: { ranges: [{ start: '09:00', end: '17:00' }], closed: false },
            friday: { ranges: [{ start: '09:00', end: '17:00' }], closed: false },
            saturday: { ranges: [{ start: '10:00', end: '16:00' }], closed: false },
            sunday: { ranges: [{ start: '10:00', end: '16:00' }], closed: true }
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-2',
          user_id: user?.id || 'demo',
          name: 'Soin du visage',
          price_ht: 41.67,
          price_ttc: 50.00,
          image_url: 'https://images.pexels.com/photos/3985360/pexels-photo-3985360.jpeg',
          description: 'Soin complet du visage avec nettoyage et hydratation',
          duration_minutes: 45,
          capacity: 1,
          unit_name: 'personnes',
          availability_hours: {
            monday: { ranges: [{ start: '10:00', end: '18:00' }], closed: false },
            tuesday: { ranges: [{ start: '10:00', end: '18:00' }], closed: false },
            wednesday: { ranges: [{ start: '10:00', end: '18:00' }], closed: false },
            thursday: { ranges: [{ start: '10:00', end: '18:00' }], closed: false },
            friday: { ranges: [{ start: '10:00', end: '18:00' }], closed: false },
            saturday: { ranges: [{ start: '11:00', end: '17:00' }], closed: false },
            sunday: { ranges: [{ start: '11:00', end: '17:00' }], closed: true }
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setServices(defaultServices);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setError(null);
      
      // Déterminer l'ID utilisateur pour lequel charger les données
      let targetUserId = user.id;
      
      // Vérifier si l'utilisateur est membre d'une équipe
      try {
        const { data: membershipData, error: membershipError } = await retryRequest(
          () => supabase
            .from('team_members')
            .select('owner_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle(),
          3,
          1000
        );

        if (!membershipError && membershipData?.owner_id) {
          targetUserId = membershipData.owner_id;
          console.log('👥 Membre d\'équipe - chargement services du propriétaire:', targetUserId);
        } else {
          console.log('👑 Propriétaire - chargement services propres:', targetUserId);
        }
      } catch (teamError) {
        console.warn('⚠️ Erreur vérification équipe, utilisation ID utilisateur:', teamError);
      }

      const { data: userServices, error: userServicesError } = await retryRequest(
        () => supabase
          .from('services')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: true }),
        3,
        1000
      );
      
      console.log('📊 Services chargés:', userServices?.length || 0);
      
      console.log('📊 Résultat requête services:', {
        data: userServices,
        error: userServicesError,
        count: userServices?.length || 0
      });
      
      if (userServices && userServices.length > 0) {
        console.log('📋 Services trouvés:', userServices.map((s: any) => ({
          id: s.id,
          name: s.name,
          user_id: s.user_id,
          description: s.description,
          unit_name: s.unit_name
        })));
      }

      if (userServicesError) {
        throw userServicesError;
      }

      setServices(userServices || []);
      console.log('✅ Services définis dans l\'état:', userServices?.length || 0);
    } catch (err) {
      console.error('Erreur lors de la récupération des services:', err);
      
      // Gestion spécifique des erreurs réseau
      if (isNetworkError(err)) {
        console.warn('🌐 useServices: Erreur réseau détectée - utilisation des services par défaut');
        setError('Connexion réseau indisponible. Services par défaut chargés.');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
        setError(errorMessage);
      }
      
      // Charger les services par défaut en cas d'erreur
      const defaultServices = [
        {
          id: 'demo-1',
          name: 'Massage relaxant',
          price_ht: 66.67,
          price_ttc: 80.00,
          image_url: 'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg',
          description: 'Massage de détente de 60 minutes pour évacuer le stress',
          duration_minutes: 60,
          capacity: 1,
          unit_name: 'personnes',
          availability_hours: {
            monday: { ranges: [{ start: '09:00', end: '17:00' }], closed: false },
            tuesday: { ranges: [{ start: '09:00', end: '17:00' }], closed: false },
            wednesday: { ranges: [{ start: '09:00', end: '17:00' }], closed: false },
            thursday: { ranges: [{ start: '09:00', end: '17:00' }], closed: false },
            friday: { ranges: [{ start: '09:00', end: '17:00' }], closed: false },
            saturday: { ranges: [{ start: '10:00', end: '16:00' }], closed: false },
            sunday: { ranges: [{ start: '10:00', end: '16:00' }], closed: true }
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-2',
          name: 'Soin du visage',
          price_ht: 41.67,
          price_ttc: 50.00,
          image_url: 'https://images.pexels.com/photos/3985360/pexels-photo-3985360.jpeg',
          description: 'Soin complet du visage avec nettoyage et hydratation',
          duration_minutes: 45,
          capacity: 1,
          unit_name: 'personnes',
          availability_hours: {
            monday: { ranges: [{ start: '10:00', end: '18:00' }], closed: false },
            tuesday: { ranges: [{ start: '10:00', end: '18:00' }], closed: false },
            wednesday: { ranges: [{ start: '10:00', end: '18:00' }], closed: false },
            thursday: { ranges: [{ start: '10:00', end: '18:00' }], closed: false },
            friday: { ranges: [{ start: '10:00', end: '18:00' }], closed: false },
            saturday: { ranges: [{ start: '11:00', end: '17:00' }], closed: false },
            sunday: { ranges: [{ start: '11:00', end: '17:00' }], closed: true }
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setServices(defaultServices);
    } finally {
      setLoading(false);
    }
  };

  const ensureCustomServiceExists = async (): Promise<Service> => {
    if (!user?.id) {
      console.error('❌ Pas d\'utilisateur connecté pour créer le service personnalisé');
      throw new Error('Utilisateur non connecté');
    }

    try {
      console.log('🔍 Recherche service personnalisé existant pour user:', user.id);
      
      // Chercher un service personnalisé existant pour cet utilisateur
      const { data: existingServices, error: searchError } = await supabase!
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .eq('description', 'Service personnalisé')
        .limit(1);

      if (searchError) {
        console.error('❌ Erreur recherche service personnalisé:', searchError);
        throw searchError;
      }

      if (existingServices && existingServices.length > 0) {
        console.log('✅ Service personnalisé existant trouvé:', existingServices[0].id);
        return existingServices[0];
      }

      console.log('➕ Création nouveau service personnalisé pour user:', user.id);

      const customServiceData = {
        user_id: user.id, // CRITIQUE : Ajouter explicitement le user_id
        name: 'Service personnalisé',
        price_ht: 0,
        price_ttc: 0,
        image_url: null,
        description: 'Service personnalisé',
        duration_minutes: 60,
        capacity: 1,
        unit_name: 'participants',
        availability_hours: null
      };

      console.log('📤 Données service à créer:', customServiceData);

      const { data: newService, error: createError } = await supabase!
        .from('services')
        .insert([customServiceData])
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur création service personnalisé:', createError);
        throw createError;
      }

      console.log('✅ Service personnalisé créé avec succès:', newService.id);
      
      // Mettre à jour la liste des services
      setServices(prev => [...prev, newService]);
      
      return newService;
    } catch (err) {
      console.error('❌ Erreur lors de la création du service personnalisé:', err);
      throw err;
    }
  };

  const addService = async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }

    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{ 
          ...service, 
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setServices(prev => [...prev, data]);
        return data;
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout du service:', err);
      throw err;
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setServices(prev => prev.map(s => s.id === id ? data : s));
        return data;
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du service:', err);
      throw err;
    }
  };

  const deleteService = async (id: string) => {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Erreur lors de la suppression du service:', err);
      throw err;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const loadServices = async () => {
      if (mounted && user) {
        setLoading(true);
        await fetchServices();
      }
    };
    
    if (user) {
      loadServices();
    }
    
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return {
    services,
    loading,
    error,
    refetch: fetchServices,
    addService,
    updateService,
    deleteService,
    ensureCustomServiceExists
  };
}
