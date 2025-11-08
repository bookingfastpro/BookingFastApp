import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  CreditCard, 
  Mail, 
  Clock, 
  Star, 
  CheckCircle, 
  ArrowRight,
  Building2,
  Smartphone,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  Heart,
  Award,
  Target,
  Sparkles,
  Settings,
  BarChart3,
  Bell,
  Lock,
  Palette,
  MessageSquare,
  Rocket,
  Crown,
  Gift,
  Infinity,
  MousePointer,
  Laptop,
  ChevronRight,
  Play,
  Check,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ LandingPage - Utilisateur authentifié détecté, redirection vers /dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: Calendar,
      title: "Planning Intelligent",
      description: "Gérez vos créneaux avec un calendrier intuitif et des notifications automatiques. Synchronisation en temps réel avec votre équipe.",
      color: "from-blue-500 to-cyan-500",
      image: "https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auto=compress&cs=tinysrgb&w=1200",
      benefits: [
        "Vue calendrier intuitive",
        "Synchronisation temps réel",
        "Notifications automatiques",
        "Gestion des disponibilités"
      ]
    },
    {
      icon: CreditCard,
      title: "Paiements Sécurisés",
      description: "Encaissez en ligne avec Stripe, générez des liens de paiement instantanés. Sécurité bancaire maximale garantie.",
      color: "from-green-500 to-emerald-500",
      image: "https://images.pexels.com/photos/4968630/pexels-photo-4968630.jpeg?auto=compress&cs=tinysrgb&w=1200",
      benefits: [
        "Paiements Stripe sécurisés",
        "Liens de paiement instantanés",
        "Facturation automatique",
        "Suivi des transactions"
      ]
    },
    {
      icon: Mail,
      title: "Emails Automatiques",
      description: "Confirmations, rappels et suivis envoyés automatiquement à vos clients. Personnalisez vos messages et workflows.",
      color: "from-purple-500 to-pink-500",
      image: "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=1200",
      benefits: [
        "Confirmations automatiques",
        "Rappels personnalisés",
        "Workflows sur mesure",
        "Templates professionnels"
      ]
    },
    {
      icon: Users,
      title: "Gestion d'Équipe",
      description: "Collaborez efficacement avec votre équipe, gérez les accès et permissions. Tableau de bord centralisé pour tous.",
      color: "from-orange-500 to-red-500",
      image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200",
      benefits: [
        "Gestion des rôles",
        "Permissions granulaires",
        "Tableau de bord équipe",
        "Communication intégrée"
      ]
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Créez votre compte",
      description: "Inscription en 30 secondes, sans carte bancaire. Configurez votre entreprise et vos services.",
      icon: Rocket,
      color: "from-blue-500 to-cyan-500",
      image: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800",
      details: [
        "Inscription gratuite et rapide",
        "Configuration guidée pas à pas",
        "Import de vos données existantes",
        "Personnalisation complète"
      ]
    },
    {
      step: 2,
      title: "Configurez vos services",
      description: "Ajoutez vos services, définissez vos tarifs et horaires. Personnalisez selon vos besoins.",
      icon: Settings,
      color: "from-purple-500 to-pink-500",
      image: "https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg?auto=compress&cs=tinysrgb&w=800",
      details: [
        "Catalogue de services illimité",
        "Tarification flexible",
        "Horaires personnalisables",
        "Options et extras"
      ]
    },
    {
      step: 3,
      title: "Partagez votre lien",
      description: "Recevez votre lien de réservation unique. Intégrez-le sur votre site ou partagez-le directement.",
      icon: Globe,
      color: "from-green-500 to-emerald-500",
      image: "https://images.pexels.com/photos/3184639/pexels-photo-3184639.jpeg?auto=compress&cs=tinysrgb&w=800",
      details: [
        "Lien personnalisé unique",
        "Widget intégrable",
        "QR Code généré",
        "Partage multi-canaux"
      ]
    },
    {
      step: 4,
      title: "Gérez et développez",
      description: "Suivez vos réservations, analysez vos performances et développez votre activité.",
      icon: TrendingUp,
      color: "from-orange-500 to-red-500",
      image: "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800",
      details: [
        "Dashboard temps réel",
        "Rapports détaillés",
        "Insights clients",
        "Croissance mesurable"
      ]
    }
  ];

  const comparisons = [
    { feature: "Réservations illimitées", us: true, others: false },
    { feature: "Paiements en ligne", us: true, others: true },
    { feature: "Sans commission", us: true, others: false },
    { feature: "Support 24/7", us: true, others: false },
    { feature: "Multi-utilisateurs", us: true, others: true },
    { feature: "Personnalisation complète", us: true, others: false },
    { feature: "Rappels automatiques", us: true, others: true },
    { feature: "Application mobile", us: true, others: false },
    { feature: "Intégrations illimitées", us: true, others: false },
    { feature: "Formation gratuite", us: true, others: false }
  ];

  const testimonials = [
    {
      name: "Marie Dubois",
      business: "Salon de beauté Le Chic",
      text: "BookingFast a révolutionné ma gestion ! Plus de double réservations, paiements automatiques. Mon chiffre d'affaires a augmenté de 40% en 3 mois. Je recommande à 100% !",
      rating: 5,
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200",
      image: "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1200",
      stats: "+40% CA"
    },
    {
      name: "Thomas Martin",
      business: "Coach sportif Pro Fitness",
      text: "Interface intuitive, clients ravis. Le système de rappels automatiques a réduit mes no-shows de 80% ! Gain de temps énorme, je peux me concentrer sur mes clients.",
      rating: 5,
      avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200",
      image: "https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=1200",
      stats: "-80% absences"
    },
    {
      name: "Sophie Laurent",
      business: "Cabinet de thérapie Zen",
      text: "Parfait pour mon cabinet ! Les liens de paiement facilitent tout. Support client exceptionnel, réponse en moins de 2h. Mes patients adorent la simplicité de réservation.",
      rating: 5,
      avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200",
      image: "https://images.pexels.com/photos/3759657/pexels-photo-3759657.jpeg?auto=compress&cs=tinysrgb&w=1200",
      stats: "5/5 satisfaction"
    }
  ];

  const stats = [
    { number: "15,000+", label: "Réservations gérées", icon: Calendar, color: "from-blue-500 to-cyan-500" },
    { number: "800+", label: "Professionnels satisfaits", icon: Users, color: "from-purple-500 to-pink-500" },
    { number: "99.9%", label: "Temps de disponibilité", icon: Shield, color: "from-green-500 to-emerald-500" },
    { number: "24/7", label: "Support client", icon: Heart, color: "from-red-500 to-orange-500" }
  ];

  const useCases = [
    {
      title: "Salons de beauté",
      description: "Gérez vos rendez-vous coiffure, esthétique et bien-être avec élégance",
      icon: Sparkles,
      image: "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      title: "Coachs sportifs",
      description: "Planifiez vos séances individuelles et collectives en toute simplicité",
      icon: Target,
      image: "https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=800",
      gradient: "from-orange-500 to-amber-500"
    },
    {
      title: "Thérapeutes",
      description: "Organisez vos consultations avec professionnalisme et sérénité",
      icon: Heart,
      image: "https://images.pexels.com/photos/3759657/pexels-photo-3759657.jpeg?auto=compress&cs=tinysrgb&w=800",
      gradient: "from-green-500 to-teal-500"
    },
    {
      title: "Consultants",
      description: "Gérez vos rendez-vous clients professionnels avec efficacité",
      icon: Award,
      image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800",
      gradient: "from-blue-500 to-indigo-500"
    }
  ];

  const advantages = [
    {
      icon: Rocket,
      title: "Démarrage rapide",
      description: "Configuration en 5 minutes, formation gratuite incluse"
    },
    {
      icon: Shield,
      title: "Sécurité maximale",
      description: "Données cryptées, conformité RGPD, hébergement sécurisé"
    },
    {
      icon: Zap,
      title: "Performance optimale",
      description: "99.9% de disponibilité, vitesse ultra-rapide"
    },
    {
      icon: Heart,
      title: "Support dédié",
      description: "Équipe disponible 24/7, réponse en moins de 2h"
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);

    // Auto-advance steps
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % howItWorks.length);
    }, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page h-full bg-white overflow-y-auto">
      {/* Navigation Premium */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl animate-glow">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  BookingFast
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block font-medium">Réservation professionnelle</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-700 hover:text-blue-600 font-semibold transition-colors">
                Comment ça marche
              </button>
              <button onClick={() => scrollToSection('features')} className="text-gray-700 hover:text-blue-600 font-semibold transition-colors">
                Fonctionnalités
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-700 hover:text-blue-600 font-semibold transition-colors">
                Tarifs
              </button>
              <button onClick={() => scrollToSection('testimonials')} className="text-gray-700 hover:text-blue-600 font-semibold transition-colors">
                Témoignages
              </button>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 shadow-lg font-bold relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Connexion
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section Premium */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Contenu gauche */}
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-bold mb-8 shadow-xl animate-glow">
                <Gift className="w-5 h-5" />
                Essai gratuit 7 jours - Sans carte bancaire
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-tight mb-8">
                Gérez vos réservations
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">
                  comme un pro
                </span>
              </h1>
              
              <p className="text-2xl text-gray-700 mb-10 leading-relaxed font-medium">
                La solution <span className="text-purple-600 font-bold">tout-en-un</span> pour gérer vos rendez-vous, encaisser vos paiements et fidéliser vos clients. 
                <span className="block mt-2 text-xl text-gray-600">Simple. Puissant. Professionnel.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 shadow-xl font-black text-xl flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Rocket className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                    Commencer
                    <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="bg-white text-gray-900 px-10 py-5 rounded-2xl hover:bg-gray-50 transition-all duration-300 border-2 border-gray-300 font-bold text-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <Play className="w-6 h-6" />
                  Voir la démo
                </button>
              </div>

              {/* Trust indicators premium */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center gap-2 bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                  <Shield className="w-8 h-8 text-green-500" />
                  <span className="text-sm font-bold text-gray-900">Sécurisé SSL</span>
                </div>
                <div className="flex flex-col items-center gap-2 bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                  <CheckCircle className="w-8 h-8 text-blue-500" />
                  <span className="text-sm font-bold text-gray-900">RGPD Conforme</span>
                </div>
                <div className="flex flex-col items-center gap-2 bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                  <Star className="w-8 h-8 text-yellow-500" />
                  <span className="text-sm font-bold text-gray-900">Support 24/7</span>
                </div>
              </div>
            </div>

            {/* Image droite - Dashboard Premium */}
            <div className="relative">
              <div className="relative z-10">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white transform hover:scale-105 transition-all duration-500">
                  <img 
                    src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1400" 
                    alt="Dashboard BookingFast Premium"
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent"></div>
                </div>
                
                {/* Floating stats cards */}
                <div className="absolute -bottom-8 -left-8 bg-white rounded-3xl shadow-2xl p-6 animate-float border-4 border-green-100">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-black text-gray-900">+127%</div>
                      <div className="text-sm font-bold text-gray-600">Réservations</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -top-8 -right-8 bg-white rounded-3xl shadow-2xl p-6 animate-float border-4 border-yellow-100" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-black text-gray-900">4.9/5</div>
                      <div className="text-sm font-bold text-gray-600">Satisfaction</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl blur-3xl opacity-30 -z-10 animate-pulse"></div>
            </div>
          </div>

          {/* Stats Section Premium */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 text-center shadow-xl border-2 border-gray-100 transform hover:scale-110 transition-all duration-300 animate-fadeIn hover:shadow-2xl group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-black text-gray-900 mb-3">{stat.number}</div>
                <div className="text-gray-700 font-bold text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - NEW */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '3s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-bold mb-8 shadow-xl">
              <MousePointer className="w-5 h-5" />
              Simple et intuitif
            </div>
            <h2 className="text-5xl font-black text-gray-900 mb-6">
              Comment ça marche ?
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
              Démarrez en 4 étapes simples et transformez votre activité
            </p>
          </div>

          {/* Steps Timeline */}
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 transform -translate-y-1/2 hidden lg:block"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
              {howItWorks.map((step, index) => (
                <div
                  key={index}
                  className={`relative group cursor-pointer transition-all duration-500 ${
                    activeStep === index ? 'scale-105' : 'scale-100 opacity-80 hover:opacity-100'
                  }`}
                  onClick={() => setActiveStep(index)}
                >
                  {/* Step Card */}
                  <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-gray-100">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={step.image} 
                        alt={step.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${step.color} opacity-60 group-hover:opacity-40 transition-opacity`}></div>
                      
                      {/* Step Number */}
                      <div className="absolute top-4 left-4">
                        <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg ${
                          activeStep === index ? 'animate-bounce-soft' : ''
                        }`}>
                          <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {step.step}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                        <step.icon className="w-7 h-7 text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-black text-gray-900 mb-3">
                        {step.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 font-medium">
                        {step.description}
                      </p>

                      {/* Details List */}
                      <div className={`space-y-2 overflow-hidden transition-all duration-500 ${
                        activeStep === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        {step.details.map((detail, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Connector Arrow (desktop only) */}
                  {index < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                      <ChevronRight className={`w-8 h-8 ${
                        activeStep === index ? 'text-purple-600 animate-pulse' : 'text-gray-300'
                      }`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Demo Button */}
          <div className="text-center mt-16">
            <button
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-12 py-6 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 shadow-xl font-black text-2xl inline-flex items-center gap-4 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-4">
                <Laptop className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                Essayer maintenant
                <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <p className="text-gray-600 mt-4 font-medium">
              ✨ Aucune carte bancaire requise • Configuration en 5 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Section - NEW */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-900 mb-6">
              BookingFast vs La concurrence
            </h2>
            <p className="text-2xl text-gray-600 font-medium">
              Pourquoi nous sommes le meilleur choix pour votre entreprise
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100">
            <div className="grid grid-cols-3 bg-gradient-to-r from-gray-50 to-white">
              <div className="p-6 font-bold text-gray-700">Fonctionnalités</div>
              <div className="p-6 text-center bg-gradient-to-br from-blue-50 to-purple-50 border-x-2 border-gray-100">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  <Crown className="w-4 h-4" />
                  BookingFast
                </div>
              </div>
              <div className="p-6 text-center font-bold text-gray-500">Autres solutions</div>
            </div>

            {comparisons.map((item, index) => (
              <div
                key={index}
                className={`grid grid-cols-3 border-t border-gray-100 hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <div className="p-6 font-medium text-gray-700">{item.feature}</div>
                <div className="p-6 text-center bg-gradient-to-br from-blue-50/50 to-purple-50/50 border-x-2 border-gray-100">
                  {item.us ? (
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                      <X className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                </div>
                <div className="p-6 text-center">
                  {item.others ? (
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                      <X className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-900 mb-6">
              Pourquoi choisir BookingFast ?
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
              Des avantages qui font la différence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {advantages.map((advantage, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-100"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <advantage.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">{advantage.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section Premium */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-gray-900 mb-6">
              Parfait pour votre activité
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
              Des centaines de professionnels nous font confiance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="group bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-2 border-gray-100"
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={useCase.image} 
                    alt={useCase.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${useCase.gradient} opacity-60 group-hover:opacity-40 transition-opacity`}></div>
                  <div className="absolute bottom-6 left-6">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-xl">
                      <useCase.icon className="w-8 h-8 text-gray-900" />
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-black text-gray-900 mb-3">{useCase.title}</h3>
                  <p className="text-gray-600 leading-relaxed font-medium">{useCase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section Premium */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-gray-900 mb-6">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
              Une suite complète d'outils professionnels pour transformer votre activité
            </p>
          </div>

          <div className="space-y-32">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${feature.color} text-white px-6 py-3 rounded-full text-sm font-bold mb-8 shadow-xl`}>
                    <feature.icon className="w-5 h-5" />
                    Fonctionnalité Premium
                  </div>
                  
                  <h3 className="text-4xl font-black text-gray-900 mb-6">
                    {feature.title}
                  </h3>
                  
                  <p className="text-xl text-gray-700 mb-8 leading-relaxed font-medium">
                    {feature.description}
                  </p>

                  <ul className="space-y-4">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-4 bg-gradient-to-r from-gray-50 to-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all">
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                        <span className="text-gray-900 font-bold text-lg">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="relative group">
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white transform group-hover:scale-105 transition-all duration-500">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-full h-auto"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${feature.color} opacity-20 group-hover:opacity-10 transition-opacity`}></div>
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-3xl blur-3xl opacity-30 -z-10 group-hover:opacity-50 transition-opacity`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section Premium */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-gray-900 mb-6">
              Tarifs transparents
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
              Commencez gratuitement, évoluez selon vos besoins
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan Starter */}
            <div className="bg-white rounded-3xl shadow-2xl border-4 border-green-400 hover:border-green-600 transition-all duration-300 transform hover:scale-105 relative pt-16">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-30">
                <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-full text-sm font-black shadow-2xl whitespace-nowrap block">
                  🚀 Idéal pour démarrer
                </span>
              </div>

              <div className="p-10">
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-6">Starter</h3>
                  <div className="text-6xl font-black text-green-600 mb-3">29,99€</div>
                  <div className="text-gray-600 font-bold text-lg">par mois</div>
                </div>

                <div className="space-y-5 mb-10">
                  {[
                    '100 réservations par mois',
                    'Gestion des clients',
                    'Calendrier intégré',
                    'Notifications email',
                    'Support email',
                    'Idéal pour démarrer'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-4 bg-green-50 p-4 rounded-2xl">
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                      <span className="text-gray-900 font-bold">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 px-6 rounded-2xl font-black text-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-xl"
                >
                  Commencer
                </button>
              </div>
            </div>

            {/* Plan Pro Mensuel */}
            <div className="bg-white rounded-3xl shadow-2xl border-4 border-blue-400 hover:border-blue-600 transition-all duration-300 transform hover:scale-110 relative pt-16">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-30">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-full text-sm font-black shadow-2xl animate-glow whitespace-nowrap block">
                  ⭐ Le plus populaire
                </span>
              </div>

              <div className="p-10">
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-6">Pro Mensuel</h3>
                  <div className="text-6xl font-black text-blue-600 mb-3">49,99€</div>
                  <div className="text-gray-600 font-bold text-lg">par mois</div>
                </div>

                <div className="space-y-5 mb-10">
                  {[
                    'Réservations illimitées',
                    'Paiements en ligne Stripe',
                    'Workflows email automatiques',
                    'Jusqu\'à 10 membres d\'équipe',
                    'Support prioritaire',
                    'Rapports avancés'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-4 bg-blue-50 p-4 rounded-2xl">
                      <CheckCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
                      <span className="text-gray-900 font-bold">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-5 px-6 rounded-2xl font-black text-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-xl"
                >
                  Commencer
                </button>
              </div>
            </div>

            {/* Plan Pro Annuel */}
            <div className="bg-white rounded-3xl shadow-2xl border-4 border-purple-400 hover:border-purple-600 transition-all duration-300 transform hover:scale-105 relative pt-16">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-30">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full text-sm font-black shadow-2xl whitespace-nowrap block">
                  🎉 Économisez 17%
                </span>
              </div>

              <div className="p-10">
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-6">Pro Annuel</h3>
                  <div className="text-6xl font-black text-purple-600 mb-3">41,66€</div>
                  <div className="text-gray-600 font-bold text-lg">par mois</div>
                  <div className="text-sm text-green-600 font-black mt-3 bg-green-50 px-4 py-2 rounded-full inline-block">
                    Soit 499,99€/an
                  </div>
                </div>

                <div className="space-y-5 mb-10">
                  {[
                    'Tout du plan Pro',
                    '2 mois gratuits',
                    'Support prioritaire 24/7',
                    'Fonctionnalités avancées',
                    'Accès aux bêtas',
                    'Formation personnalisée'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-4 bg-purple-50 p-4 rounded-2xl">
                      <CheckCircle className="w-6 h-6 text-purple-500 flex-shrink-0" />
                      <span className="text-gray-900 font-bold">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 px-6 rounded-2xl font-black text-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-xl"
                >
                  Commencer
                </button>
              </div>
            </div>
          </div>

          {/* Pack Société Premium */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-10 border-4 border-orange-300 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
              <div className="relative z-10 flex items-start gap-8">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-xl">
                  <Infinity className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-black text-gray-900 mb-4">
                    🚀 Pack Société - Membres illimités
                  </h3>
                  <p className="text-xl text-gray-700 mb-6 leading-relaxed font-medium">
                    Besoin de plus de 10 membres d'équipe ? Activez le <strong>Pack Société</strong> pour débloquer un nombre illimité de collaborateurs et des fonctionnalités entreprise.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border-2 border-orange-200 shadow-lg">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <span className="font-black text-gray-900">Membres illimités</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border-2 border-orange-200 shadow-lg">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <span className="font-black text-gray-900">Gestion multi-sites</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border-2 border-orange-200 shadow-lg">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <span className="font-black text-gray-900">Support dédié</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Premium */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-gray-900 mb-6">
              Ils nous font confiance
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
              Découvrez pourquoi des centaines de professionnels choisissent BookingFast
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 overflow-hidden animate-fadeIn border-2 border-gray-100"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="relative h-56">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.business}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow-xl">
                    <span className="text-sm font-black text-gray-900">{testimonial.stats}</span>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full border-4 border-white shadow-xl"
                    />
                    <div>
                      <div className="font-black text-gray-900 text-lg">{testimonial.name}</div>
                      <div className="text-sm text-gray-600 font-bold">{testimonial.business}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-gray-700 italic leading-relaxed font-medium text-lg">"{testimonial.text}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section Premium */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl font-black text-white mb-8">
            Prêt à transformer votre activité ?
          </h2>
          <p className="text-2xl text-white/95 mb-12 max-w-2xl mx-auto font-medium">
            Rejoignez des centaines de professionnels qui ont déjà choisi BookingFast
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-purple-600 px-12 py-6 rounded-2xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-110 shadow-2xl font-black text-2xl flex items-center gap-4 group"
            >
              <Rocket className="w-8 h-8 group-hover:rotate-12 transition-transform" />
              Commencer
              <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </button>
            
            <div className="text-white/90 text-lg font-bold bg-white/10 backdrop-blur-sm px-6 py-4 rounded-2xl">
              ✓ Aucune carte bancaire requise
              <br />
              ✓ Configuration en 5 minutes
            </div>
          </div>
        </div>
      </section>

      {/* Footer Premium */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">BookingFast</h3>
                  <p className="text-gray-400 text-sm font-bold">Réservation professionnelle</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md font-medium text-lg">
                La solution complète pour gérer vos réservations, automatiser vos paiements et fidéliser vos clients.
              </p>
            </div>
            
            <div>
              <h4 className="font-black mb-6 text-xl">Fonctionnalités</h4>
              <ul className="space-y-3 text-gray-400 font-medium">
                <li className="hover:text-white transition-colors cursor-pointer">Planning intelligent</li>
                <li className="hover:text-white transition-colors cursor-pointer">Paiements en ligne</li>
                <li className="hover:text-white transition-colors cursor-pointer">Emails automatiques</li>
                <li className="hover:text-white transition-colors cursor-pointer">Gestion d'équipe</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black mb-6 text-xl">Légal</h4>
              <ul className="space-y-3 text-gray-400 font-medium">
                <li>
                  <button 
                    onClick={() => navigate('/privacy-policy')}
                    className="hover:text-white transition-colors"
                  >
                    Politique de confidentialité
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/terms-of-service')}
                    className="hover:text-white transition-colors"
                  >
                    Conditions d'utilisation
                  </button>
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">Support 24/7</li>
                <li className="hover:text-white transition-colors cursor-pointer">Formation gratuite</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p className="font-bold">&copy; 2025 BookingFast. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(99, 102, 241, 0.8);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
