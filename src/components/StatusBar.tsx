import { useStore } from '@nanostores/react';
import { userLocation, currentLanguage } from '../lib/store';

export default function StatusBar() {
  const location = useStore(userLocation);
  const language = useStore(currentLanguage);

  const getTexts = () => {
    const texts = {
      en: {
        multiModelAI: 'Multi-Model AI Active',
        secureConnection: 'Secure Connection',
        defaultLocation: 'Default Location',
        userLocation: 'User Location',
        version: 'Ailocks v1.0 • Ai2Ai Network',
        builtOnBolt: 'Built on Bolt'
      },
      ru: {
        multiModelAI: 'Мульти-модельный ИИ активен',
        secureConnection: 'Безопасное соединение',
        defaultLocation: 'Местоположение по умолчанию',
        userLocation: 'Пользовательское местоположение',
        version: 'Ailocks v1.0 • Ai2Ai Network',
        builtOnBolt: 'Создано на Bolt'
      }
    };
    return texts[language as keyof typeof texts] || texts.en;
  };

  const texts = getTexts();

  return (
    <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex-shrink-0">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-6 text-white/60">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span>🌍 {location.city}, {location.country}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>⚡ {texts.multiModelAI}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span>🔒 {texts.secureConnection}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-white/40">
          <span>{texts.version} • {location.isDefault ? texts.defaultLocation : texts.userLocation}</span>
          <a 
            href="https://bolt.new" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 border border-blue-500/30 rounded-lg hover:from-blue-500/30 hover:to-indigo-600/30 transition-all duration-200 group"
          >
            <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold">⚡</span>
            </div>
            <span className="text-blue-400 group-hover:text-blue-300 font-medium">{texts.builtOnBolt}</span>
          </a>
        </div>
      </div>
    </div>
  );
}