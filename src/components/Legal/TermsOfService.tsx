import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Scale, Shield, CreditCard, Users, Mail, Building2 } from 'lucide-react';

export function TermsOfService() {
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
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Conditions Générales d'Utilisation
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
              <h2 className="text-2xl font-bold text-gray-900">1. Acceptation des conditions</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              En accédant et en utilisant BookingFast (ci-après "le Service"), vous acceptez d'être lié par les présentes 
              Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le Service.
            </p>
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <p className="text-gray-700 font-medium">
                <strong>Important :</strong> Ces CGU constituent un contrat juridiquement contraignant entre vous et BookingFast. 
                Veuillez les lire attentivement.
              </p>
            </div>
          </section>

          {/* Définitions */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">2. Définitions</h2>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">Service</h3>
                <p className="text-gray-700 text-sm">
                  Désigne la plateforme BookingFast, incluant l'application web, l'application mobile (PWA), 
                  et tous les services associés.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">Utilisateur</h3>
                <p className="text-gray-700 text-sm">
                  Toute personne physique ou morale utilisant le Service, qu'elle soit en période d'essai ou abonnée.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">Compte</h3>
                <p className="text-gray-700 text-sm">
                  Espace personnel créé par l'Utilisateur pour accéder au Service et gérer ses réservations.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">Contenu</h3>
                <p className="text-gray-700 text-sm">
                  Toutes les données, informations, textes, images et autres éléments créés ou téléchargés par l'Utilisateur.
                </p>
              </div>
            </div>
          </section>

          {/* Inscription et compte */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">3. Inscription et compte utilisateur</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">3.1 Création de compte</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Vous devez avoir au moins 18 ans pour créer un compte</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Les informations fournies doivent être exactes et à jour</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Vous êtes responsable de la confidentialité de vos identifiants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Un compte par personne ou entreprise</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">3.2 Sécurité du compte</h3>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <p className="text-gray-700 text-sm">
                    <strong>Vous êtes responsable de :</strong>
                  </p>
                  <ul className="mt-2 space-y-1 text-gray-700 text-sm">
                    <li>• Maintenir la confidentialité de votre mot de passe</li>
                    <li>• Toutes les activités effectuées depuis votre compte</li>
                    <li>• Nous informer immédiatement de toute utilisation non autorisée</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">3.3 Suspension ou résiliation</h3>
                <p className="text-gray-700 mb-2">
                  Nous nous réservons le droit de suspendre ou résilier votre compte en cas de :
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Violation des présentes CGU</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Activité frauduleuse ou illégale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Non-paiement des frais d'abonnement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Utilisation abusive du Service</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Abonnement et paiement */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">4. Abonnement et paiement</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">4.1 Période d'essai</h3>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>7 jours d'essai gratuit sans engagement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Aucune carte bancaire requise pendant l'essai</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Accès complet à toutes les fonctionnalités</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Annulation possible à tout moment</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">4.2 Tarifs et facturation</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-bold text-gray-900 mb-2">Plan Mensuel</h4>
                    <p className="text-gray-700 text-sm mb-2">59,99€ HT/mois (71,99€ TTC)</p>
                    <ul className="space-y-1 text-gray-700 text-sm">
                      <li>• Facturation mensuelle automatique</li>
                      <li>• Résiliation possible à tout moment</li>
                      <li>• Pas de frais d'engagement</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-bold text-gray-900 mb-2">Plan Annuel</h4>
                    <p className="text-gray-700 text-sm mb-2">499,99€ HT/an (599,99€ TTC)</p>
                    <ul className="space-y-1 text-gray-700 text-sm">
                      <li>• Économie de 17% (2 mois gratuits)</li>
                      <li>• Facturation annuelle</li>
                      <li>• Support prioritaire inclus</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">4.3 Modalités de paiement</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Paiements sécurisés via Stripe</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Cartes bancaires acceptées : Visa, Mastercard, American Express</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Renouvellement automatique sauf résiliation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Factures disponibles dans votre espace client</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">4.4 Résiliation et remboursement</h3>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold mt-0.5">→</span>
                      <span>Résiliation possible à tout moment depuis votre compte</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold mt-0.5">→</span>
                      <span>Accès maintenu jusqu'à la fin de la période payée</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold mt-0.5">→</span>
                      <span>Aucun remboursement pour les périodes non utilisées</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold mt-0.5">→</span>
                      <span>Remboursement intégral si résiliation dans les 7 premiers jours</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Utilisation du service */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">5. Utilisation du service</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">5.1 Utilisation autorisée</h3>
                <p className="text-gray-700 mb-3">Vous vous engagez à utiliser le Service uniquement pour :</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Gérer vos réservations et rendez-vous professionnels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Communiquer avec vos clients de manière professionnelle</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Encaisser des paiements pour vos services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Gérer votre activité professionnelle légalement</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">5.2 Utilisation interdite</h3>
                <p className="text-gray-700 mb-3">Il est strictement interdit de :</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Utiliser le Service à des fins illégales ou frauduleuses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Tenter d'accéder aux comptes d'autres utilisateurs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Diffuser des virus, malwares ou codes malveillants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Copier, modifier ou distribuer le Service sans autorisation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Utiliser des robots ou scripts automatisés</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Surcharger ou perturber le fonctionnement du Service</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Scale className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">6. Propriété intellectuelle</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">6.1 Propriété de BookingFast</h3>
                <p className="text-gray-700 mb-3">
                  Le Service, incluant son code source, design, logos, marques et contenus, est la propriété 
                  exclusive de BookingFast et est protégé par les lois sur la propriété intellectuelle.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">6.2 Votre contenu</h3>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-gray-700 text-sm mb-2">
                    <strong>Vous conservez tous les droits sur votre contenu.</strong> En utilisant le Service, vous nous accordez :
                  </p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Une licence pour stocker et traiter votre contenu</li>
                    <li>• Le droit de sauvegarder vos données pour assurer le service</li>
                    <li>• L'autorisation d'utiliser vos données de manière anonymisée pour améliorer le Service</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Responsabilités */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">7. Limitation de responsabilité</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <h3 className="font-bold text-gray-900 mb-3">7.1 Disponibilité du service</h3>
                <p className="text-gray-700 text-sm mb-2">
                  Nous nous efforçons de maintenir le Service disponible 24/7, mais nous ne garantissons pas :
                </p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• Une disponibilité ininterrompue du Service</li>
                  <li>• L'absence d'erreurs ou de bugs</li>
                  <li>• La compatibilité avec tous les appareils et navigateurs</li>
                </ul>
              </div>

              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <h3 className="font-bold text-gray-900 mb-3">7.2 Limitation de responsabilité</h3>
                <p className="text-gray-700 text-sm">
                  Dans les limites autorisées par la loi, BookingFast ne pourra être tenu responsable des dommages 
                  indirects, accessoires, spéciaux ou consécutifs résultant de l'utilisation ou de l'impossibilité 
                  d'utiliser le Service.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">7.3 Vos responsabilités</h3>
                <p className="text-gray-700 mb-2">Vous êtes responsable de :</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>La sauvegarde régulière de vos données</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>La conformité de votre utilisation avec les lois applicables</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Les relations avec vos clients et le respect de leurs droits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>La sécurité de votre compte et de vos identifiants</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Modifications */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">8. Modifications des CGU</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nous nous réservons le droit de modifier ces CGU à tout moment. Les modifications entreront en vigueur 
              dès leur publication sur le Service. Votre utilisation continue du Service après la publication des 
              modifications constitue votre acceptation des nouvelles CGU.
            </p>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <p className="text-gray-700 text-sm">
                <strong>Important :</strong> Nous vous notifierons par email des modifications importantes des CGU 
                au moins 30 jours avant leur entrée en vigueur.
              </p>
            </div>
          </section>

          {/* Droit applicable */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Scale className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">9. Droit applicable et juridiction</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Les présentes CGU sont régies par le droit français. En cas de litige, et après tentative de résolution 
              amiable, les tribunaux français seront seuls compétents.
            </p>
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">Médiation</h3>
              <p className="text-gray-700 text-sm">
                Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, nous proposons un dispositif 
                de médiation de la consommation. L'entité de médiation retenue est : [Nom du médiateur à définir].
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Questions sur les CGU ?</h2>
            <p className="mb-4 leading-relaxed">
              Pour toute question concernant ces Conditions Générales d'Utilisation :
            </p>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <a href="mailto:legal@bookingfast.com" className="hover:underline font-medium">
                  legal@bookingfast.com
                </a>
              </p>
              <p className="text-sm opacity-90">
                Service Juridique<br />
                BookingFast<br />
                Réponse sous 48h ouvrées
              </p>
            </div>
          </section>
        </div>

        {/* Back to home button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-bold flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à l'accueil
          </button>
        </div>
      </main>
    </div>
  );
}
