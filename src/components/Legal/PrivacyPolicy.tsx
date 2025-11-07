import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, Users, Cookie, Mail, FileText, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

export function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour à l'accueil</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  BookingFast
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Politique de Confidentialité
          </h1>
          <p className="text-lg text-gray-600">
            Dernière mise à jour : 15 janvier 2025
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 space-y-8">
          {/* Introduction */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">1. Introduction</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Chez BookingFast, nous prenons la protection de vos données personnelles très au sérieux. 
              Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et 
              protégeons vos informations personnelles conformément au Règlement Général sur la Protection 
              des Données (RGPD).
            </p>
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <p className="text-gray-700 font-medium">
                <strong>Notre engagement :</strong> Vos données vous appartiennent. Nous ne les vendons jamais 
                à des tiers et nous les utilisons uniquement pour vous fournir le meilleur service possible.
              </p>
            </div>
          </section>

          {/* Données collectées */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">2. Données que nous collectons</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">2.1 Données d'identification</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Nom et prénom</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Adresse email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Numéro de téléphone (optionnel)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Nom de l'entreprise</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">2.2 Données d'utilisation</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Informations sur vos réservations et rendez-vous</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Données de vos clients (nom, email, téléphone)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Historique des transactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Préférences et paramètres de compte</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">2.3 Données techniques</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Adresse IP</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Type de navigateur et appareil</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Données de connexion et d'utilisation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Cookies et technologies similaires</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Utilisation des données */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">3. Comment nous utilisons vos données</h2>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">Fourniture du service</h3>
                <p className="text-gray-700 text-sm">
                  Gérer votre compte, traiter vos réservations, envoyer des confirmations et rappels automatiques.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">Traitement des paiements</h3>
                <p className="text-gray-700 text-sm">
                  Faciliter les transactions via Stripe (nous ne stockons jamais vos données bancaires complètes).
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">Communication</h3>
                <p className="text-gray-700 text-sm">
                  Vous envoyer des notifications importantes, des mises à jour du service et du support client.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">Amélioration du service</h3>
                <p className="text-gray-700 text-sm">
                  Analyser l'utilisation pour améliorer nos fonctionnalités et votre expérience (données anonymisées).
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">Sécurité</h3>
                <p className="text-gray-700 text-sm">
                  Détecter et prévenir les fraudes, abus et violations de nos conditions d'utilisation.
                </p>
              </div>
            </div>
          </section>

          {/* Partage des données */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">4. Partage de vos données</h2>
            </div>

            <div className="bg-orange-50 rounded-xl p-6 border border-orange-200 mb-4">
              <p className="text-gray-700 font-medium mb-2">
                <strong>Principe fondamental :</strong> Nous ne vendons JAMAIS vos données personnelles.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Nous partageons vos données uniquement avec :</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <div>
                      <strong>Prestataires de services :</strong> Stripe (paiements), Supabase (hébergement), 
                      services d'email (notifications)
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <div>
                      <strong>Obligations légales :</strong> Autorités compétentes si requis par la loi
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <div>
                      <strong>Avec votre consentement :</strong> Toute autre partie avec votre autorisation explicite
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-gray-700 text-sm">
                  <strong>Note :</strong> Tous nos prestataires sont soumis à des accords stricts de confidentialité 
                  et ne peuvent utiliser vos données que pour les services qu'ils nous fournissent.
                </p>
              </div>
            </div>
          </section>

          {/* Sécurité */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">5. Sécurité de vos données</h2>
            </div>

            <p className="text-gray-700 mb-4">
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour 
              protéger vos données personnelles :
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-gray-900">Chiffrement SSL/TLS</h3>
                </div>
                <p className="text-gray-700 text-sm">
                  Toutes les communications sont chiffrées de bout en bout
                </p>
              </div>

              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-gray-900">Stockage sécurisé</h3>
                </div>
                <p className="text-gray-700 text-sm">
                  Données hébergées dans l'UE avec sauvegardes régulières
                </p>
              </div>

              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-gray-900">Accès restreint</h3>
                </div>
                <p className="text-gray-700 text-sm">
                  Seul le personnel autorisé peut accéder aux données
                </p>
              </div>

              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-gray-900">Surveillance 24/7</h3>
                </div>
                <p className="text-gray-700 text-sm">
                  Détection et réponse aux incidents de sécurité
                </p>
              </div>
            </div>
          </section>

          {/* Vos droits RGPD */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">6. Vos droits RGPD</h2>
            </div>

            <p className="text-gray-700 mb-4">
              Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
            </p>

            <div className="space-y-3">
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <h3 className="font-bold text-gray-900 mb-2">✓ Droit d'accès</h3>
                <p className="text-gray-700 text-sm">
                  Obtenir une copie de toutes vos données personnelles que nous détenons
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <h3 className="font-bold text-gray-900 mb-2">✓ Droit de rectification</h3>
                <p className="text-gray-700 text-sm">
                  Corriger ou mettre à jour vos données inexactes ou incomplètes
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <h3 className="font-bold text-gray-900 mb-2">✓ Droit à l'effacement</h3>
                <p className="text-gray-700 text-sm">
                  Demander la suppression de vos données personnelles (sous certaines conditions)
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <h3 className="font-bold text-gray-900 mb-2">✓ Droit à la portabilité</h3>
                <p className="text-gray-700 text-sm">
                  Recevoir vos données dans un format structuré et lisible par machine
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <h3 className="font-bold text-gray-900 mb-2">✓ Droit d'opposition</h3>
                <p className="text-gray-700 text-sm">
                  Vous opposer au traitement de vos données pour des raisons légitimes
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <h3 className="font-bold text-gray-900 mb-2">✓ Droit à la limitation</h3>
                <p className="text-gray-700 text-sm">
                  Demander la limitation du traitement de vos données dans certains cas
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mt-6">
              <p className="text-gray-700 font-medium">
                <strong>Comment exercer vos droits :</strong> Contactez-nous à{' '}
                <a href="mailto:privacy@bookingfast.com" className="text-blue-600 hover:underline">
                  privacy@bookingfast.com
                </a>
                {' '}avec votre demande. Nous répondrons sous 30 jours maximum.
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Cookie className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">7. Cookies et technologies similaires</h2>
            </div>

            <p className="text-gray-700 mb-4">
              Nous utilisons des cookies et technologies similaires pour améliorer votre expérience :
            </p>

            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">Cookies essentiels</h3>
                <p className="text-gray-700 text-sm">
                  Nécessaires au fonctionnement du site (authentification, sécurité). 
                  <strong> Non désactivables.</strong>
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">Cookies de performance</h3>
                <p className="text-gray-700 text-sm">
                  Nous aident à comprendre comment vous utilisez le site pour l'améliorer. 
                  <strong> Anonymisés.</strong>
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">Cookies de préférences</h3>
                <p className="text-gray-700 text-sm">
                  Mémorisent vos choix (langue, paramètres) pour personnaliser votre expérience.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 mt-4">
              <p className="text-gray-700 text-sm">
                <strong>Gestion des cookies :</strong> Vous pouvez gérer vos préférences de cookies 
                dans les paramètres de votre navigateur ou via notre bandeau de consentement.
              </p>
            </div>
          </section>

          {/* Conservation des données */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">8. Conservation des données</h2>
            </div>

            <p className="text-gray-700 mb-4">
              Nous conservons vos données personnelles uniquement le temps nécessaire aux finalités 
              pour lesquelles elles ont été collectées :
            </p>

            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span><strong>Données de compte :</strong> Pendant toute la durée de votre abonnement + 3 ans</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span><strong>Données de facturation :</strong> 10 ans (obligation légale)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span><strong>Données de réservation :</strong> 3 ans après la dernière réservation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span><strong>Logs techniques :</strong> 12 mois maximum</span>
              </li>
            </ul>
          </section>

          {/* Modifications */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">9. Modifications de cette politique</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Nous pouvons mettre à jour cette politique de confidentialité occasionnellement. 
              Nous vous informerons de tout changement important par email et/ou via une notification 
              sur notre service. La date de "dernière mise à jour" en haut de cette page indique 
              quand cette politique a été révisée pour la dernière fois.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Questions sur vos données ?</h2>
            <p className="mb-4 leading-relaxed">
              Pour toute question concernant cette politique de confidentialité ou vos données personnelles :
            </p>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <strong>Email :</strong>
                <a href="mailto:privacy@bookingfast.com" className="hover:underline font-medium">
                  privacy@bookingfast.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <strong>DPO (Délégué à la Protection des Données) :</strong>
                <a href="mailto:dpo@bookingfast.com" className="hover:underline font-medium">
                  dpo@bookingfast.com
                </a>
              </p>
              <p className="text-sm opacity-90 mt-4">
                Délai de réponse : 30 jours maximum<br />
                Vous avez également le droit de déposer une plainte auprès de la CNIL (Commission Nationale 
                de l'Informatique et des Libertés) si vous estimez que vos droits ne sont pas respectés.
              </p>
            </div>
          </section>
        </div>

        {/* Back to home button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-bold flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à l'accueil
          </button>
        </div>
      </main>
    </div>
  );
}
