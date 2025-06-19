import { Target, MapPin, Clock, DollarSign, X, Check } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { currentLanguage } from '../../lib/store';
import { useI18n } from '../../hooks/useI18n';
import { useLocation } from '../../hooks/useLocation';

interface IntentPreviewProps {
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  location: { city: string; country: string };
  budget?: string;
  timeline?: string;
  priority: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function IntentPreview({ 
  title, 
  description, 
  category,
  requiredSkills, 
  location, 
  budget,
  timeline,
  priority,
  onConfirm, 
  onCancel, 
  isLoading = false 
}: IntentPreviewProps) {
  const language = useStore(currentLanguage);

  const getTexts = () => {
    const texts = {
      en: {
        preview: 'Create Intent Preview',
        title: 'Title',
        description: 'Description',
        category: 'Category',
        location: 'Location',
        skills: 'Required Skills',
        budget: 'Budget',
        timeline: 'Timeline',
        priority: 'Priority',
        create: 'Create Intent',
        creating: 'Creating...',
        cancel: 'Cancel',
        review: 'Review the details below and click "Create Intent" to publish your collaboration opportunity.'
      },
      ru: {
        preview: 'Предварительный просмотр интента',
        title: 'Заголовок',
        description: 'Описание',
        category: 'Категория',
        location: 'Местоположение',
        skills: 'Требуемые навыки',
        budget: 'Бюджет',
        timeline: 'Временные рамки',
        priority: 'Приоритет',
        create: 'Создать интент',
        creating: 'Создание...',
        cancel: 'Отмена',
        review: 'Просмотрите детали ниже и нажмите "Создать интент", чтобы опубликовать возможность сотрудничества.'
      }
    };
    return texts[language as keyof typeof texts] || texts.en;
  };

  const texts = getTexts();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{texts.preview}</h3>
        </div>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">{texts.review}</p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{texts.title}</label>
            <p className="text-gray-900 font-medium bg-white p-3 rounded-lg border">{title}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{texts.category}</label>
            <p className="text-gray-900 bg-white p-3 rounded-lg border">{category}</p>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">{texts.description}</label>
          <p className="text-gray-600 bg-white p-3 rounded-lg border leading-relaxed">{description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{texts.location}</label>
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="text-gray-900">{location.city}, {location.country}</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{texts.priority}</label>
            <div className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium ${getPriorityColor(priority)}`}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </div>
          </div>
        </div>
        
        {requiredSkills.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">{texts.skills}</label>
            <div className="flex flex-wrap gap-2">
              {requiredSkills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-lg border border-blue-200 font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {(budget || timeline) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budget && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">{texts.budget}</label>
                <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-gray-900">{budget}</span>
                </div>
              </div>
            )}
            
            {timeline && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">{texts.timeline}</label>
                <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-900">{timeline}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex gap-3 mt-6">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-medium"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {texts.creating}
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              {texts.create}
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
        >
          {texts.cancel}
        </button>
      </div>
    </div>
  );
}