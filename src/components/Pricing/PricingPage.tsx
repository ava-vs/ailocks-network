import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Crown, Zap, Star, Database, Brain, Sparkles, X } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { currentLanguage, isClientInitialized } from '../../lib/store';
import Header from '../Header';
import StatusBar from '../StatusBar';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  popular?: boolean;
  stripePriceId?: string;
  limits: {
    queries: number | 'unlimited';
    aiModels: string[];
    storage: string;
    support: string;
  };
}

export default function PricingPage() {
  const language = useStore(currentLanguage);
  const clientInitialized = useStore(isClientInitialized);
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const getTexts = () => {
    const texts = {
      en: {
        title: 'Choose Your AI Collaboration Plan',
        subtitle: 'Unlock the full potential of AI-powered networking and collaboration',
        monthly: 'Monthly',
        yearly: 'Yearly',
        save: 'Save 20%',
        popular: 'Most Popular',
        currentPlan: 'Current Plan',
        upgrade: 'Upgrade Now',
        getStarted: 'Get Started',
        backToApp: 'Back to App',
        features: 'Features',
        whatYouGet: 'What you get:',
        faq: 'Frequently Asked Questions',
        contact: 'Contact Sales',
        freeTrial: '14-day free trial',
        noCommitment: 'No commitment, cancel anytime',
        plans: {
          free: {
            name: 'Free',
            description: 'Perfect for getting started with AI collaboration',
            features: [
              '100 AI queries per month',
              'Basic intent matching',
              'Standard chat interface',
              'Community support',
              'Basic analytics'
            ]
          },
          pro: {
            name: 'Pro',
            description: 'Advanced features for serious collaborators',
            features: [
              '2,000 AI queries per month',
              'Semantic search with embeddings',
              'Smart chain decomposition',
              'Voice chat interface',
              'Priority AI models (GPT-4, Claude)',
              'Advanced analytics',
              'Email support',
              'Custom integrations'
            ]
          },
          enterprise: {
            name: 'Premium',
            description: 'Full-scale solution for organizations',
            features: [
              'Unlimited AI queries',
              'All premium AI models',
              'Video chat interface',
              'Better custom AI training',
              'White-label solution',
              'Dedicated account manager',
              'SLA guarantee',
              'Custom integrations',
              'Advanced security'
            ]
          }
        },
        faqItems: [
          {
            question: 'Can I change my plan anytime?',
            answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
          },
          {
            question: 'What AI models are included?',
            answer: 'Free plan uses cost-optimized models. Pro includes GPT-4, Claude, and premium models. Enterprise gets access to all models including custom training.'
          },
          {
            question: 'Is there a free trial?',
            answer: 'Yes! Pro and Enterprise plans come with a 14-day free trial. No credit card required to start.'
          },
          {
            question: 'How does billing work?',
            answer: 'You\'re billed monthly or yearly based on your choice. Yearly plans save 20%. All payments are secure via Stripe.'
          }
        ]
      },
      ru: {
        title: 'Выберите план ИИ-сотрудничества',
        subtitle: 'Раскройте весь потенциал сетевого взаимодействия и сотрудничества на основе ИИ',
        monthly: 'Ежемесячно',
        yearly: 'Ежегодно',
        save: 'Скидка 20%',
        popular: 'Самый популярный',
        currentPlan: 'Текущий план',
        upgrade: 'Обновить сейчас',
        getStarted: 'Начать',
        backToApp: 'Вернуться в приложение',
        features: 'Возможности',
        whatYouGet: 'Что вы получаете:',
        faq: 'Часто задаваемые вопросы',
        contact: 'Связаться с отделом продаж',
        freeTrial: '14-дневная бесплатная пробная версия',
        noCommitment: 'Без обязательств, отмена в любое время',
        plans: {
          free: {
            name: 'Бесплатный',
            description: 'Идеально для начала работы с ИИ-сотрудничеством',
            features: [
              '100 запросов к ИИ в месяц',
              'Базовое сопоставление интентов',
              'Стандартный чат-интерфейс',
              'Поддержка сообщества',
              'Базовая аналитика'
            ]
          },
          pro: {
            name: 'Про',
            description: 'Расширенные функции для серьезных коллабораторов',
            features: [
              '2,000 запросов к ИИ в месяц',
              'Семантический поиск с эмбеддингами',
              'Умная декомпозиция цепочек',
              'Приоритетные модели ИИ (GPT-4, Claude)',
              'Расширенная аналитика',
              'Поддержка по электронной почте',
              'Пользовательские интеграции'
            ]
          },
          enterprise: {
            name: 'Корпоративный',
            description: 'Полномасштабное решение для организаций',
            features: [
              'Неограниченные запросы к ИИ',
              'Все премиум модели ИИ',
              'Пользовательское обучение ИИ',
              'White-label решение',
              'Выделенный менеджер аккаунта',
              'Гарантия SLA',
              'Пользовательские интеграции',
              'Расширенная безопасность'
            ]
          }
        },
        faqItems: [
          {
            question: 'Могу ли я изменить план в любое время?',
            answer: 'Да, вы можете повысить или понизить свой план в любое время. Изменения вступают в силу немедленно.'
          },
          {
            question: 'Какие модели ИИ включены?',
            answer: 'Бесплатный план использует оптимизированные по стоимости модели. Pro включает GPT-4, Claude и премиум модели. Enterprise получает доступ ко всем моделям, включая пользовательское обучение.'
          },
          {
            question: 'Есть ли бесплатная пробная версия?',
            answer: 'Да! Планы Pro и Enterprise поставляются с 14-дневной бесплатной пробной версией. Кредитная карта не требуется для начала.'
          },
          {
            question: 'Как работает биллинг?',
            answer: 'Вы платите ежемесячно или ежегодно в зависимости от вашего выбора. Годовые планы экономят 20%. Все платежи безопасны через Stripe.'
          }
        ]
      }
    };
    return texts[language as keyof typeof texts] || texts.en;
  };

  const texts = getTexts();

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: texts.plans.free.name,
      price: 0,
      period: texts.monthly,
      description: texts.plans.free.description,
      features: texts.plans.free.features,
      limits: {
        queries: 100,
        aiModels: ['DeepSeek Free'],
        storage: '1GB',
        support: 'Community'
      }
    },
    {
      id: 'pro',
      name: texts.plans.pro.name,
      price: 29,
      period: texts.monthly,
      description: texts.plans.pro.description,
      features: texts.plans.pro.features,
      highlighted: true,
      popular: true,
      stripePriceId: 'price_pro_monthly',
      limits: {
        queries: 2000,
        aiModels: ['GPT-4', 'Claude-3.5', 'DeepSeek'],
        storage: '50GB',
        support: 'Email'
      }
    },
    {
      id: 'enterprise',
      name: texts.plans.enterprise.name,
      price: 99,
      period: texts.monthly,
      description: texts.plans.enterprise.description,
      features: texts.plans.enterprise.features,
      stripePriceId: 'price_enterprise_monthly',
      limits: {
        queries: 'unlimited',
        aiModels: ['All Models', 'Custom Training'],
        storage: 'Unlimited',
        support: 'Dedicated Manager'
      }
    }
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return;
    
    setIsLoading(true);
    setSelectedPlan(planId);
    
    try {
      // Here you would integrate with Stripe
      // For now, we'll show a modal
      setShowModal(true);
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToApp = () => {
    window.location.href = '/';
  };

  if (!isHydrated || !clientInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <div className="relative py-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            {/* Back Button */}
            <button
              onClick={goBackToApp}
              className="inline-flex items-center space-x-2 text-white/70 hover:text-white transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>{texts.backToApp}</span>
            </button>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              {texts.title}
            </h1>
            <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              {texts.subtitle}
            </p>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
                    plan.highlighted
                      ? 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border-2 border-blue-400/50 shadow-2xl shadow-blue-500/20'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2">
                        <Star className="w-4 h-4" />
                        <span>{texts.popular}</span>
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-white">${plan.price}</span>
                      <span className="text-white/60 ml-2">/{plan.period}</span>
                    </div>
                    <p className="text-white/70 text-sm">{plan.description}</p>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/80 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limits */}
                  <div className="border-t border-white/10 pt-6 mb-8">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/60">Queries/month:</span>
                        <span className="text-white font-medium">
                          {typeof plan.limits.queries === 'number' 
                            ? plan.limits.queries.toLocaleString() 
                            : plan.limits.queries}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">AI Models:</span>
                        <span className="text-white font-medium">{plan.limits.aiModels.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Storage:</span>
                        <span className="text-white font-medium">{plan.limits.storage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Support:</span>
                        <span className="text-white font-medium">{plan.limits.support}</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isLoading && selectedPlan === plan.id}
                    className={`w-full py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                        : plan.id === 'free'
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {isLoading && selectedPlan === plan.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {plan.id === 'free' ? (
                          <span>{texts.currentPlan}</span>
                        ) : (
                          <>
                            <Crown className="w-5 h-5" />
                            <span>{plan.id === 'pro' ? texts.upgrade : texts.getStarted}</span>
                          </>
                        )}
                      </>
                    )}
                  </button>

                  {plan.id !== 'free' && (
                    <p className="text-center text-white/50 text-xs mt-3">
                      {texts.freeTrial} • {texts.noCommitment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 px-6 bg-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-12">{texts.whatYouGet}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Advanced AI Models</h3>
                <p className="text-white/70">Access to GPT-4, Claude, and other premium AI models for superior collaboration insights.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Semantic Search</h3>
                <p className="text-white/70">Vector-powered search that understands context and meaning, not just keywords.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Smart Chains</h3>
                <p className="text-white/70">AI-powered project decomposition that breaks complex tasks into manageable steps.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-12">{texts.faq}</h2>
            <div className="space-y-6">
              {texts.faqItems.map((item, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">{item.question}</h3>
                  <p className="text-white/70">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Upgrade Modal */}
      {showModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" 
            onClick={() => setShowModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-blue-400" />
                  <span>Upgrade to {plans.find(p => p.id === selectedPlan)?.name}</span>
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white/60 hover:text-white" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">Stripe Integration Required</h4>
                  <p className="text-white/70 text-sm">
                    To complete your upgrade, please configure your Stripe integration with your API keys.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                    <h5 className="font-medium text-blue-400 mb-2">Next Steps:</h5>
                    <ol className="text-sm text-white/80 space-y-1">
                      <li>1. Set up your Stripe account</li>
                      <li>2. Configure API keys in environment</li>
                      <li>3. Create product pricing in Stripe</li>
                      <li>4. Return to complete upgrade</li>
                    </ol>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white rounded-lg transition-all"
                    >
                      Close
                    </button>
                    <a
                      href="https://bolt.new/setup/stripe"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all text-center font-medium"
                    >
                      Setup Stripe
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
