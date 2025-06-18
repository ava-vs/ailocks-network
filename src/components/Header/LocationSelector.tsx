import React, { useState } from 'react';
import { MapPin, Edit3, X, Check } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { userLocation, currentLanguage, setLocation, isClientInitialized } from '../../lib/store';

export default function LocationSelector() {
  const location = useStore(userLocation);
  const language = useStore(currentLanguage);
  const clientInitialized = useStore(isClientInitialized);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    city: location.city,
    country: location.country
  });

  // Don't render until client is initialized to prevent hydration mismatch
  if (!clientInitialized) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200">
        <MapPin className="w-4 h-4 text-blue-400" />
        <div className="text-left">
          <div className="text-sm font-medium text-white/90">
            📍 Loading...
          </div>
        </div>
      </div>
    );
  }

  const getTexts = () => {
    const texts = {
      en: {
        change: 'Change',
        location: 'Location',
        city: 'City',
        country: 'Country Code',
        save: 'Save',
        cancel: 'Cancel',
        placeholder: {
          city: 'Enter city name',
          country: 'e.g., US, DE, RU'
        }
      },
      ru: {
        change: 'Изменить',
        location: 'Местоположение',
        city: 'Город',
        country: 'Код страны',
        save: 'Сохранить',
        cancel: 'Отмена',
        placeholder: {
          city: 'Введите название города',
          country: 'например, US, DE, RU'
        }
      }
    };
    return texts[language as keyof typeof texts] || texts.en;
  };

  const texts = getTexts();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.city.trim() && formData.country.trim()) {
      setLocation({
        city: formData.city.trim(),
        country: formData.country.trim().toUpperCase(),
        timezone: location.timezone, // Keep existing timezone
        isDefault: false
      });
      setIsModalOpen(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      {/* Location Display Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 group"
      >
        <MapPin className="w-4 h-4 text-blue-400" />
        <div className="text-left">
          <div className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
            📍 {location.city}, {location.country}
          </div>
          {location.isDefault && (
            <div className="text-xs text-white/50">Default location</div>
          )}
        </div>
        <Edit3 className="w-3 h-3 text-white/60 group-hover:text-white/80 transition-colors" />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
            onClick={() => setIsModalOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <span>{texts.location}</span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white/60 hover:text-white" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    {texts.city}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder={texts.placeholder.city}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    {texts.country}
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder={texts.placeholder.country}
                    maxLength={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all uppercase"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white rounded-lg transition-all"
                  >
                    {texts.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{texts.save}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}