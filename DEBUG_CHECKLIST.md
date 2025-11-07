# 🔍 CHECKLIST DE DÉBOGAGE - À FAIRE MAINTENANT

## 1️⃣ **VÉRIFIER LES LOGS SUPABASE** (PRIORITÉ ABSOLUE)

### Comment accéder aux logs :
1. Allez sur **https://supabase.com/dashboard**
2. Sélectionnez votre projet **BookingFast**
3. Menu **Edge Functions** → **create-plugin-checkout**
4. Onglet **Logs**
5. Cliquez sur **"S'abonner"** dans votre app
6. **REGARDEZ LES LOGS EN TEMPS RÉEL**

### Ce que vous devez chercher :
- ✅ `🎯 === DÉBUT EDGE FUNCTION ===` → La fonction démarre
- ✅ `✅ Stripe initialisé` → Stripe fonctionne
- ❌ **ERREUR EXACTE** → Le vrai problème sera là !

---

## 2️⃣ **VÉRIFIER LA BASE DE DONNÉES**

### Vérifier que le Price ID existe :

```sql
SELECT 
  id,
  name,
  stripe_price_id,
  base_price
FROM plugins
WHERE id = '8858455d-0c3c-44c3-bc6a-76dff1a32a93';
```

**Résultat attendu :**
- `stripe_price_id` doit être rempli (format: `price_xxxxx`)
- Si NULL → **C'EST LE PROBLÈME !**

### Si le Price ID est NULL, ajoutez-le :

```sql
UPDATE plugins
SET stripe_price_id = 'price_VOTRE_PRICE_ID_ICI'
WHERE id = '8858455d-0c3c-44c3-bc6a-76dff1a32a93';
```

**Comment trouver votre Price ID :**
1. Allez sur **https://dashboard.stripe.com/products**
2. Cliquez sur votre produit "Système POS"
3. Copiez le **Price ID** (commence par `price_`)

---

## 3️⃣ **VÉRIFIER LA CLÉ STRIPE**

### Test direct de la clé :

Ouvrez la console de votre navigateur et testez :

```javascript
const testStripeKey = async () => {
  const response = await fetch('https://api.stripe.com/v1/customers', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer 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'
    }
  });
  
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Réponse:', data);
};

testStripeKey();
```

**Résultat attendu :**
- Status: `200` → ✅ Clé valide
- Status: `401` → ❌ Clé invalide

---

## 4️⃣ **VÉRIFIER LE DÉPLOIEMENT**

### L'Edge Function est-elle déployée ?

1. Dans Supabase Dashboard → **Edge Functions**
2. Vérifiez que **create-plugin-checkout** apparaît
3. Vérifiez la **date de déploiement** (doit être récente)

### Si pas déployée, déployez :

```bash
supabase functions deploy create-plugin-checkout
```

---

## 5️⃣ **TESTER AVEC CURL**

### Test direct de l'Edge Function :

```bash
curl -X POST \
  https://bookingfast.hevolife.fr/functions/v1/create-plugin-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1OTE0MzE4MCwiZXhwIjo0OTE0ODE2NzgwLCJyb2xlIjoiYW5vbiJ9.22-nq4kNYY01DSSZ0XCVrWFLkItpxVESIWPBAJlS4SU" \
  -d '{
    "userId": "9222ceae-5bf3-4b00-ae12-ac7f83e248a1",
    "pluginId": "8858455d-0c3c-44c3-bc6a-76dff1a32a93"
  }'
```

**Résultat attendu :**
- Status `200` + URL Stripe → ✅ Fonctionne
- Erreur → Vous verrez le message exact

---

## 6️⃣ **VÉRIFIER LES VARIABLES D'ENVIRONNEMENT**

### Dans Supabase Dashboard :

1. **Settings** → **Edge Functions**
2. Vérifiez que ces variables existent :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## 🎯 **ACTIONS IMMÉDIATES**

### Faites dans cet ordre :

1. ✅ **Vérifiez les logs Supabase** (5 min)
2. ✅ **Vérifiez le Price ID dans la base** (2 min)
3. ✅ **Testez la clé Stripe** (2 min)
4. ✅ **Testez avec CURL** (3 min)

**L'un de ces tests va révéler le vrai problème !**

---

## 📞 **APRÈS LES TESTS**

Envoyez-moi :
1. **Les logs Supabase** (copier-coller)
2. **Le résultat de la requête SQL** (Price ID)
3. **Le résultat du test CURL**

**Avec ça, je saurai EXACTEMENT où est le problème !** 🎯
