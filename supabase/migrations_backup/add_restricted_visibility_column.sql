/*
  # Ajouter la colonne restricted_visibility à team_members

  1. Modifications
    - Ajoute la colonne `restricted_visibility` (boolean, default false)
    - Permet de restreindre la visibilité des réservations pour certains membres

  2. Sécurité
    - Valeur par défaut : false (pas de restriction)
    - Les membres existants ne seront pas affectés
*/

-- Ajouter la colonne restricted_visibility
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS restricted_visibility boolean DEFAULT false;

-- Commentaire pour documentation
COMMENT ON COLUMN team_members.restricted_visibility IS 'Si true, le membre ne voit que les réservations qui lui sont assignées';
