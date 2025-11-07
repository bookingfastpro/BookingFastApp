# 🔥 INSTRUCTIONS URGENTES - DÉBLOCAGE IMMÉDIAT

## ❌ Problème
La route `/booking-debug` ne fonctionne pas malgré 4 tentatives de correction.

## ✅ Solution alternative : Requête SQL directe

### Étape 1 : Ouvre Supabase
1. Va sur https://supabase.com
2. Connecte-toi à ton projet
3. Clique sur **SQL Editor** dans le menu de gauche

### Étape 2 : Exécute la requête
1. Copie le contenu du fichier `debug-booking.sql`
2. Colle-le dans l'éditeur SQL
3. Clique sur **Run** (ou Ctrl+Enter)

### Étape 3 : Envoie-moi les résultats
Copie-colle les résultats des 2 requêtes :
- La première montre les données de la réservation
- La deuxième montre les paramètres du service et des dépôts

## 🎯 Ce qu'on cherche
On veut voir si le problème vient de :
- ❓ La valeur stockée dans `deposit_amount` (devrait être 1.00)
- ❓ Le calcul fait par le frontend
- ❓ Les paramètres de dépôt dans `business_settings`

## 📋 Résultats attendus
Tu devrais voir quelque chose comme :
```
id: 9222ceae-5bf3-4b00-ae12-ac7f83e2483a
total_amount: 50.00
payment_amount: 1.00
deposit_amount: ??? (c'est ça qu'on veut voir)
```

Une fois que tu m'envoies les résultats, je saurai exactement où est le bug ! 🎯
