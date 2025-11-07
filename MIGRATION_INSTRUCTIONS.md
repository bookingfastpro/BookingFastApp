# 📋 Instructions pour appliquer la migration Google Calendar

## Étape 1 : Accéder au SQL Editor de Supabase

1. Connectez-vous à votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet **bookingfast**
3. Dans le menu de gauche, cliquez sur **SQL Editor**
4. Cliquez sur **New query**

## Étape 2 : Copier et exécuter le SQL

Copiez le contenu du fichier `supabase/migrations/20240101000000_google_calendar_integration.sql` et collez-le dans l'éditeur SQL.

Ou copiez directement ce SQL :

```sql
-- Création de la table google_calendar_tokens
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT google_calendar_tokens_user_id_key UNIQUE(user_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id 
  ON google_calendar_tokens(user_id);

-- RLS pour google_calendar_tokens
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Policy pour que les utilisateurs puissent gérer leurs propres tokens
DROP POLICY IF EXISTS "Users can manage their own Google Calendar tokens" ON google_calendar_tokens;
CREATE POLICY "Users can manage their own Google Calendar tokens"
  ON google_calendar_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_google_calendar_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_google_calendar_tokens_updated_at ON google_calendar_tokens;
CREATE TRIGGER update_google_calendar_tokens_updated_at
  BEFORE UPDATE ON google_calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_google_calendar_tokens_updated_at();

-- Ajout des colonnes Google Calendar dans business_settings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'google_calendar_enabled'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN google_calendar_enabled BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'google_calendar_id'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN google_calendar_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'google_calendar_sync_status'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN google_calendar_sync_status TEXT DEFAULT 'disconnected';
  END IF;
END $$;

-- Ajout de la colonne pour l'ID de l'événement Google Calendar dans bookings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'google_calendar_event_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN google_calendar_event_id TEXT;
  END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_bookings_google_calendar_event_id 
  ON bookings(google_calendar_event_id) 
  WHERE google_calendar_event_id IS NOT NULL;
```

## Étape 3 : Exécuter la requête

1. Cliquez sur le bouton **Run** (ou appuyez sur `Ctrl+Enter`)
2. Vérifiez qu'il n'y a pas d'erreurs dans la console en bas
3. Vous devriez voir un message de succès

## Étape 4 : Vérifier que la table existe

Dans le SQL Editor, exécutez cette requête pour vérifier :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'google_calendar_tokens';
```

Vous devriez voir une ligne avec `google_calendar_tokens`.

## Étape 5 : Vérifier les colonnes

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'google_calendar_tokens'
ORDER BY ordinal_position;
```

Vous devriez voir toutes les colonnes :
- id (uuid)
- user_id (uuid)
- access_token (text)
- refresh_token (text)
- token_expiry (timestamp with time zone)
- scope (text)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

## Étape 6 : Vérifier les RLS policies

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'google_calendar_tokens';
```

Vous devriez voir la policy "Users can manage their own Google Calendar tokens".

## ✅ Migration terminée !

Une fois la migration appliquée, retournez sur votre application et réessayez de connecter Google Calendar.

## 🔍 En cas de problème

Si vous avez toujours des erreurs 400, vérifiez dans le SQL Editor :

```sql
-- Vérifier que la table existe
SELECT * FROM google_calendar_tokens LIMIT 1;

-- Vérifier les colonnes de business_settings
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'business_settings' 
AND column_name LIKE 'google_calendar%';

-- Vérifier la colonne dans bookings
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'google_calendar_event_id';
```
