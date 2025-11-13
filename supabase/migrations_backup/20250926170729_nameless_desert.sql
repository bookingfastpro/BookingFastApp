/*
  # Système d'Affiliation BookingPro

  1. Nouvelles Tables
    - `affiliate_settings`
      - Configuration globale du système d'affiliation
      - Pourcentage de commission, durée d'essai étendue
    - `affiliates`
      - Comptes d'affiliation des utilisateurs
      - Code unique, lien de partage, statistiques
    - `affiliate_referrals`
      - Suivi des parrainages
      - Lien entre parrain et filleul
    - `affiliate_commissions`
      - Historique des commissions
      - Montants, statuts, paiements

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques d'accès appropriées
    - Super admin peut tout gérer

  3. Fonctionnalités
    - Génération automatique de codes d'affiliation
    - Calcul automatique des commissions
    - Suivi des conversions
    - Interface de gestion pour super admin
*/

-- Table des paramètres d'affiliation (gérée par super admin)
CREATE TABLE IF NOT EXISTS affiliate_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_percentage integer DEFAULT 10 NOT NULL,
  extended_trial_days integer DEFAULT 15 NOT NULL,
  minimum_payout_amount numeric(10,2) DEFAULT 50.00 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des comptes d'affiliation
CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code text UNIQUE NOT NULL,
  total_referrals integer DEFAULT 0 NOT NULL,
  successful_conversions integer DEFAULT 0 NOT NULL,
  total_commissions numeric(10,2) DEFAULT 0.00 NOT NULL,
  pending_commissions numeric(10,2) DEFAULT 0.00 NOT NULL,
  paid_commissions numeric(10,2) DEFAULT 0.00 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des parrainages
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code text NOT NULL,
  conversion_date timestamptz,
  subscription_status text DEFAULT 'trial' NOT NULL,
  total_paid numeric(10,2) DEFAULT 0.00 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(affiliate_id, referred_user_id)
);

-- Table des commissions
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES affiliate_referrals(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  commission_month date NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT affiliate_commissions_status_check CHECK (status IN ('pending', 'paid', 'cancelled'))
);

-- Indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_user_id ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_code ON affiliate_referrals(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_month ON affiliate_commissions(commission_month);

-- Enable RLS
ALTER TABLE affiliate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour affiliate_settings
CREATE POLICY "Super admins can manage affiliate settings"
  ON affiliate_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.is_super_admin = true
  ));

-- Politiques RLS pour affiliates
CREATE POLICY "Users can view own affiliate account"
  ON affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own affiliate account"
  ON affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own affiliate account"
  ON affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can view all affiliates"
  ON affiliates
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.is_super_admin = true
  ));

-- Politiques RLS pour affiliate_referrals
CREATE POLICY "Affiliates can view own referrals"
  ON affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM affiliates 
    WHERE affiliates.id = affiliate_referrals.affiliate_id 
    AND affiliates.user_id = auth.uid()
  ));

CREATE POLICY "System can create referrals"
  ON affiliate_referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Super admins can view all referrals"
  ON affiliate_referrals
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.is_super_admin = true
  ));

-- Politiques RLS pour affiliate_commissions
CREATE POLICY "Affiliates can view own commissions"
  ON affiliate_commissions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM affiliates 
    WHERE affiliates.id = affiliate_commissions.affiliate_id 
    AND affiliates.user_id = auth.uid()
  ));

CREATE POLICY "Super admins can manage all commissions"
  ON affiliate_commissions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.is_super_admin = true
  ));

-- Fonction pour générer un code d'affiliation unique
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    -- Générer un code de 8 caractères
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Vérifier s'il existe déjà
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = code) INTO exists;
    
    -- Si le code n'existe pas, le retourner
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les commissions mensuelles
CREATE OR REPLACE FUNCTION calculate_monthly_commissions()
RETURNS void AS $$
DECLARE
  referral_record RECORD;
  commission_amount numeric(10,2);
  settings_record RECORD;
  current_month date;
BEGIN
  -- Récupérer les paramètres d'affiliation
  SELECT * INTO settings_record FROM affiliate_settings WHERE is_active = true LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  current_month := date_trunc('month', CURRENT_DATE)::date;
  
  -- Parcourir tous les parrainages actifs avec abonnement payant
  FOR referral_record IN 
    SELECT ar.*, us.subscription_status
    FROM affiliate_referrals ar
    JOIN user_subscriptions us ON ar.referred_user_id = us.user_id
    WHERE ar.is_active = true 
    AND ar.conversion_date IS NOT NULL
    AND us.status = 'active'
  LOOP
    -- Calculer la commission (10% par défaut)
    commission_amount := 59.99 * (settings_record.commission_percentage / 100.0);
    
    -- Vérifier si la commission pour ce mois n'existe pas déjà
    IF NOT EXISTS (
      SELECT 1 FROM affiliate_commissions 
      WHERE referral_id = referral_record.id 
      AND commission_month = current_month
    ) THEN
      -- Créer la commission
      INSERT INTO affiliate_commissions (
        affiliate_id,
        referral_id,
        amount,
        commission_month,
        status
      ) VALUES (
        referral_record.affiliate_id,
        referral_record.id,
        commission_amount,
        current_month,
        'pending'
      );
      
      -- Mettre à jour les totaux de l'affilié
      UPDATE affiliates 
      SET 
        pending_commissions = pending_commissions + commission_amount,
        total_commissions = total_commissions + commission_amount,
        updated_at = now()
      WHERE id = referral_record.affiliate_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les statistiques d'affiliation
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS trigger AS $$
BEGIN
  -- Mettre à jour les statistiques de l'affilié
  UPDATE affiliates 
  SET 
    total_referrals = (
      SELECT COUNT(*) FROM affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id
    ),
    successful_conversions = (
      SELECT COUNT(*) FROM affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id 
      AND conversion_date IS NOT NULL
    ),
    updated_at = now()
  WHERE id = NEW.affiliate_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur affiliate_referrals
CREATE TRIGGER update_affiliate_stats_trigger
  AFTER INSERT OR UPDATE ON affiliate_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_stats();

-- Trigger pour updated_at
CREATE TRIGGER update_affiliate_settings_updated_at
  BEFORE UPDATE ON affiliate_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_referrals_updated_at
  BEFORE UPDATE ON affiliate_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_commissions_updated_at
  BEFORE UPDATE ON affiliate_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insérer les paramètres par défaut
INSERT INTO affiliate_settings (
  commission_percentage,
  extended_trial_days,
  minimum_payout_amount,
  is_active
) VALUES (
  10,  -- 10% de commission
  15,  -- 15 jours d'essai au lieu de 7
  50.00, -- Minimum 50€ pour un paiement
  true
) ON CONFLICT DO NOTHING;
