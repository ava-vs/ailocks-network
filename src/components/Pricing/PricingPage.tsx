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
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const getTexts = () => {
    const texts = {
      en: {
        title: 'Choose Your Plan',
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
            description: 'Perfect for getting started',
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
            description: 'Advanced features',
            features: [
              '2,000 AI queries per month',
              'Semantic search with embeddings',
              'Smart chain decomposition',
              'Voice Agent Interface',
              'Priority AI models',
              'Advanced analytics',
              'Email support',
              'Custom integrations'
            ]
          },
          enterprise: {
            name: 'Premium',
            description: 'Full-scale solution',
            features: [
              'Unlimited AI queries',
              'All premium AI models',
              'Video Agent Interface',
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
        title: 'Выберите план',
        subtitle: 'Раскройте весь потенциал сетевого взаимодействия на основе ИИ',
        monthly: 'Ежемесячно',
        yearly: 'Ежегодно',
        save: 'Скидка 20%',
        popular: 'Популярный',
        currentPlan: 'Текущий план',
        upgrade: 'Обновить',
        getStarted: 'Начать',
        backToApp: 'Назад',
        features: 'Возможности',
        whatYouGet: 'Что вы получаете:',
        faq: 'Частые вопросы',
        contact: 'Связаться',
        freeTrial: '14-дневная пробная версия',
        noCommitment: 'Без обязательств',
        plans: {
          free: {
            name: 'Бесплатный',
            description: 'Для начала работы',
            features: [
              '100 запросов к ИИ в месяц',
              'Базовое сопоставление',
              'Стандартный интерфейс',
              'Поддержка сообщества',
              'Базовая аналитика'
            ]
          },
          pro: {
            name: 'Про',
            description: 'Расширенные функции',
            features: [
              '2,000 запросов к ИИ в месяц',
              'Семантический поиск',
              'Умная декомпозиция',
              'Голосовой интерфейс',
              'Приоритетные модели ИИ',
              'Расширенная аналитика',
              'Поддержка по email',
              'Интеграции'
            ]
          },
          enterprise: {
            name: 'Премиум',
            description: 'Полное решение',
            features: [
              'Неограниченные запросы',
              'Все премиум модели',
              'Видео-интерфейс',
              'Обучение ИИ',
              'White-label решение',
              'Выделенный менеджер',
              'Гарантия SLA',
              'Интеграции',
              'Безопасность'
            ]
          }
        },
        faqItems: [
          {
            question: 'Могу ли я изменить план?',
            answer: 'Да, вы можете повысить или понизить свой план в любое время. Изменения вступают в силу немедленно.'
          },
          {
            question: 'Какие модели ИИ включены?',
            answer: 'Бесплатный план использует оптимизированные модели. Pro включает GPT-4, Claude и премиум модели. Enterprise получает доступ ко всем моделям.'
          },
          {
            question: 'Есть ли бесплатная пробная версия?',
            answer: 'Да! Планы Pro и Enterprise поставляются с 14-дневной бесплатной пробной версией. Кредитная карта не требуется.'
          },
          {
            question: 'Как работает биллинг?',
            answer: 'Вы платите ежемесячно или ежегодно. Годовые планы экономят 20%. Все платежи безопасны через Stripe.'
          }
        ]
      }
    };
    return texts[language as keyof typeof texts] || texts.en;
  };

  const texts = getTexts();

  const getYearlyPrice = (monthlyPrice: number) => {
    const yearlyPrice = monthlyPrice * 12 * 0.8; // 20% discount
    return Math.floor(yearlyPrice / 12);
  };

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
      price: billingPeriod === 'monthly' ? 29 : getYearlyPrice(29),
      period: billingPeriod === 'monthly' ? texts.monthly : texts.yearly,
      description: texts.plans.pro.description,
      features: texts.plans.pro.features,
      highlighted: true,
      popular: true,
      stripePriceId: billingPeriod === 'monthly' ? 'price_pro_monthly' : 'price_pro_yearly',
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
      price: billingPeriod === 'monthly' ? 99 : getYearlyPrice(99),
      period: billingPeriod === 'monthly' ? texts.monthly : texts.yearly,
      description: texts.plans.enterprise.description,
      features: texts.plans.enterprise.features,
      stripePriceId: billingPeriod === 'monthly' ? 'price_enterprise_monthly' : 'price_enterprise_yearly',
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
        <div className="relative py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            {/* Back Button */}
            <button
              onClick={goBackToApp}
              className="inline-flex items-center space-x-2 text-white/70 hover:text-white transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>{texts.backToApp}</span>
            </button>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              {texts.title}
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              {texts.subtitle}
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-slate-800/80 p-1 rounded-lg inline-flex">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-4 py-2 text-sm rounded-md transition-all ${
                    billingPeriod === 'monthly'
                      ? 'bg-blue-500 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {texts.monthly}
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-4 py-2 text-sm rounded-md transition-all flex items-center gap-2 ${
                    billingPeriod === 'yearly'
                      ? 'bg-blue-500 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {texts.yearly}
                  <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                    {texts.save}
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-xl p-5 sm:p-6 transition-all duration-300 hover:scale-105 ${
                    plan.highlighted
                      ? 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-400/50 shadow-xl shadow-blue-500/10'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>{texts.popular}</span>
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-5">
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <div className="mb-3">
                      <span className="text-3xl font-bold text-white">${plan.price}</span>
                      <span className="text-white/60 ml-1 text-sm">/{plan.period}</span>
                    </div>
                    <p className="text-white/70 text-xs">{plan.description}</p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {plan.features.slice(0, 5).map((feature, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/80 text-xs">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 5 && (
                      <div className="text-center">
                        <button className="text-blue-400 text-xs hover:underline">
                          +{plan.features.length - 5} more features
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="border-t border-white/10 pt-4 mb-5">
                    <div className="space-y-2 text-xs">
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
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isLoading && selectedPlan === plan.id}
                    className={`w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-sm ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                        : plan.id === 'free'
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {isLoading && selectedPlan === plan.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {plan.id === 'free' ? (
                          <span>{texts.currentPlan}</span>
                        ) : (
                          <>
                            <Crown className="w-4 h-4" />
                            <span>{plan.id === 'pro' ? texts.upgrade : texts.getStarted}</span>
                          </>
                        )}
                      </>
                    )}
                  </button>

                  {plan.id !== 'free' && (
                    <p className="text-center text-white/50 text-xs mt-2">
                      {texts.freeTrial}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-10">{texts.whatYouGet}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Advanced AI Models</h3>
                <p className="text-white/70 text-sm">Access to GPT-4, Claude, and other premium AI models for superior collaboration insights.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Semantic Search</h3>
                <p className="text-white/70 text-sm">Vector-powered search that understands context and meaning, not just keywords.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Smart Chains</h3>
                <p className="text-white/70 text-sm">AI-powered project decomposition that breaks complex tasks into manageable steps.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">{texts.faq}</h2>
            <div className="space-y-4">
              {texts.faqItems.map((item, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-base font-semibold text-white mb-2">{item.question}</h3>
                  <p className="text-white/70 text-sm">{item.answer}</p>
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
            <div className="bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
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
              
              <div className="p-4">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Stripe Integration Required</h4>
                  <p className="text-white/70 text-sm">
                    To complete your upgrade, please configure your Stripe integration with your API keys.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                    <h5 className="font-medium text-blue-400 text-sm mb-2">Next Steps:</h5>
                    <ol className="text-xs text-white/80 space-y-1">
                      <li>1. Set up your Stripe account</li>
                      <li>2. Configure API keys in environment</li>
                      <li>3. Create product pricing in Stripe</li>
                      <li>4. Return to complete upgrade</li>
                    </ol>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white rounded-lg transition-all text-sm"
                    >
                      Close
                    </button>
                    <a
                      href="https://bolt.new/setup/stripe"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all text-center font-medium text-sm"
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