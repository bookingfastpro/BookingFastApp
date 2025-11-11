# Configuration SMS avec Twilio - Guide Complet

Ce guide vous explique comment configurer et utiliser la fonctionnalité d'envoi de SMS automatiques via Twilio dans votre application de réservation.

## Prérequis

- Un compte Twilio (créez-en un sur [twilio.com](https://www.twilio.com))
- Un numéro de téléphone Twilio pour l'envoi de SMS
- Accès à votre base de données Supabase

## Étape 1: Créer un compte Twilio

1. Allez sur [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Créez un compte gratuit
3. Vérifiez votre numéro de téléphone
4. Récupérez vos identifiants:
   - **Account SID**: Trouvable sur votre tableau de bord Twilio
   - **Auth Token**: Cliquez sur "Show" pour le révéler
5. Achetez un numéro de téléphone Twilio ou utilisez le numéro d'essai

## Étape 2: Appliquer la migration SQL

Exécutez la migration SQL sur votre base de données pour créer les tables nécessaires:

```bash
# Si vous utilisez Supabase CLI
supabase db push

# Ou exécutez directement le fichier SQL
psql -h <votre-host> -U <votre-user> -d <votre-db> -f supabase/migrations/20251111_add_sms_functionality.sql
```

Cette migration va créer:
- Les colonnes Twilio dans `business_settings`
- La table `sms_workflows`
- La table `sms_templates`
- La table `sms_logs`
- Les index et politiques RLS

## Étape 3: Déployer la fonction Edge Twilio

Déployez la fonction Edge `send-twilio-sms`:

```bash
# Si vous utilisez Supabase CLI
supabase functions deploy send-twilio-sms

# Ou utilisez l'outil MCP Supabase fourni
# La fonction sera automatiquement déployée
```

**Note**: La fonction Edge utilise les credentials Twilio stockés dans votre base de données (table `business_settings`), donc aucune variable d'environnement supplémentaire n'est nécessaire.

## Étape 4: Configurer Twilio dans l'application

1. Connectez-vous à votre application
2. Allez dans **Paramètres** > Onglet **SMS**
3. Activez "Activer l'envoi de SMS via Twilio"
4. Remplissez les champs:
   - **Account SID Twilio**: Collez votre Account SID (commence par AC...)
   - **Auth Token Twilio**: Collez votre Auth Token
   - **Numéro de téléphone Twilio**: Format international (ex: +33612345678)
5. Cliquez sur "Sauvegarder les paramètres SMS"

## Étape 5: Créer des templates SMS

1. Allez dans **Workflows** > Sélectionnez **SMS**
2. Cliquez sur l'onglet **Templates**
3. Cliquez sur "Nouveau Template SMS"
4. Remplissez le formulaire:
   - **Nom**: Ex: "Confirmation réservation"
   - **Description**: Brève description
   - **Contenu**: Votre message SMS (max 160 caractères)
5. Utilisez les variables disponibles (ex: `{{client_firstname}}`, `{{booking_date}}`)
6. Sauvegardez

### Exemples de templates SMS

**Template de confirmation:**
```
Bonjour {{client_firstname}}, votre réservation pour {{service_name}} le {{booking_date}} à {{booking_time}} est confirmée. À bientôt!
```

**Template de rappel:**
```
Rappel: RDV demain {{booking_date}} à {{booking_time}} pour {{service_name}}. À bientôt!
```

**Template de lien de paiement:**
```
Bonjour {{client_firstname}}, finalisez votre réservation: {{payment_link}}
```

## Étape 6: Créer des workflows SMS

1. Allez dans **Workflows** > Sélectionnez **SMS**
2. Cliquez sur l'onglet **Workflows**
3. Cliquez sur "Nouveau Workflow SMS"
4. Configurez le workflow:
   - **Nom**: Ex: "SMS de confirmation"
   - **Déclencheur**: Sélectionnez l'événement (nouvelle réservation, rappel 24h, etc.)
   - **Template SMS**: Choisissez un template créé précédemment
   - **Délai**: Temps d'attente avant envoi (0 = immédiat)
   - **Actif**: Cochez pour activer le workflow
5. Sauvegardez

## Variables disponibles pour les templates

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{client_firstname}}` | Prénom du client | Jean |
| `{{client_lastname}}` | Nom du client | Dupont |
| `{{client_phone}}` | Téléphone du client | +33612345678 |
| `{{service_name}}` | Nom du service | Coupe de cheveux |
| `{{booking_date}}` | Date de réservation (format court) | 15/11 |
| `{{booking_time}}` | Heure de réservation | 14:30 |
| `{{booking_quantity}}` | Nombre de participants | 2 |
| `{{total_amount}}` | Montant total | 45.00 |
| `{{payment_link}}` | Lien de paiement | https://... |
| `{{business_name}}` | Nom de votre entreprise | BookingFast |

## Déclencheurs disponibles

- **Nouvelle réservation** (`booking_created`): Envoyé lors de la création d'une réservation
- **Réservation modifiée** (`booking_updated`): Envoyé lors de la modification
- **Réservation annulée** (`booking_cancelled`): Envoyé lors de l'annulation
- **Lien de paiement créé** (`payment_link_created`): Envoyé quand un lien de paiement est généré
- **Paiement effectué** (`payment_link_paid`): Envoyé après un paiement réussi
- **Rappel 24h avant** (`reminder_24h`): Rappel automatique 24h avant le RDV
- **Rappel 1h avant** (`reminder_1h`): Rappel automatique 1h avant le RDV

## Points importants

### Format des numéros de téléphone

⚠️ **IMPORTANT**: Les numéros de téléphone doivent TOUJOURS être au format international E.164:
- ✅ Correct: `+33612345678` (France)
- ✅ Correct: `+1234567890` (USA)
- ❌ Incorrect: `0612345678`
- ❌ Incorrect: `+33 6 12 34 56 78`

### Limite de caractères

- Les SMS standard sont limités à **160 caractères**
- Si vous dépassez 160 caractères, le SMS sera rejeté
- Utilisez le compteur de caractères dans l'éditeur de template

### Coûts

- Chaque SMS envoyé est facturé par Twilio
- Prix approximatif: 0,05€ par SMS (varie selon le pays)
- Consultez la [grille tarifaire Twilio](https://www.twilio.com/sms/pricing) pour votre pays

### Vérification des numéros

- Avec un compte d'essai Twilio, vous ne pouvez envoyer des SMS qu'aux numéros vérifiés
- Passez en compte payant pour envoyer à tous les numéros
- Vérifiez les numéros sur [Twilio Console](https://console.twilio.com/us1/develop/phone-numbers/manage/verified)

## Intégration avec les réservations

Les workflows SMS sont automatiquement déclenchés lors des événements de réservation, en parallèle des emails. Pour que les SMS fonctionnent:

1. **Le client doit avoir un numéro de téléphone** dans sa fiche
2. Le numéro doit être au **format international**
3. Twilio doit être **activé et configuré** dans les paramètres
4. Un **workflow SMS actif** doit correspondre au déclencheur

## Dépannage

### Les SMS ne sont pas envoyés

Vérifiez:
1. ✅ Twilio est activé dans Paramètres > SMS
2. ✅ Les credentials Twilio sont corrects
3. ✅ Le workflow SMS est actif
4. ✅ Le client a un numéro de téléphone au format international
5. ✅ Vous avez des crédits Twilio suffisants
6. ✅ La fonction Edge `send-twilio-sms` est déployée

### Erreur "Phone number must be in E.164 format"

Le numéro de téléphone du client n'est pas au format international. Corrigez-le:
- Format attendu: `+33612345678`
- Pas d'espaces, pas de parenthèses

### Erreur "SMS message exceeds 160 characters"

Votre template SMS est trop long. Réduisez le texte ou supprimez des variables.

### Les SMS arrivent mais le contenu est incorrect

Vérifiez que:
1. Les variables utilisées existent dans le template
2. Les données de la réservation sont complètes
3. Le template est bien associé au workflow

## Logs et suivi

Tous les envois de SMS sont enregistrés dans la table `sms_logs`:
- Statut d'envoi (envoyé, échoué)
- Message SID Twilio (pour le suivi)
- Messages d'erreur éventuels
- Horodatage

Vous pouvez consulter ces logs via SQL:

```sql
SELECT * FROM sms_logs
WHERE user_id = 'votre-user-id'
ORDER BY sent_at DESC
LIMIT 50;
```

## Support

Pour toute question sur:
- **Twilio**: [Support Twilio](https://support.twilio.com)
- **L'application**: Consultez la documentation principale ou contactez votre administrateur

## Ressources

- [Documentation Twilio SMS](https://www.twilio.com/docs/sms)
- [API Twilio](https://www.twilio.com/docs/usage/api)
- [Format E.164](https://www.twilio.com/docs/glossary/what-e164)
- [Tarification SMS](https://www.twilio.com/sms/pricing)
