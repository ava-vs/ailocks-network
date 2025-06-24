import { useStore } from '@nanostores/react';
import { currentLanguage } from '../lib/store';
import { useState, useEffect } from 'react';

interface SystemStatus {
  database: 'connected' | 'error' | 'loading';
  aiService: 'available' | 'unavailable' | 'loading';
  embedding: 'healthy' | 'error' | 'loading';
  coverage?: number;
  lastChecked?: string;
}

export default function StatusBar() {
  const language = useStore(currentLanguage);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'loading',
    aiService: 'loading',
    embedding: 'loading'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkSystemHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);
    
    // Listen for user changes to refresh system status
    const handleUserChanged = () => {
      checkSystemHealth();
    };
    
    window.addEventListener('userChanged', handleUserChanged);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('userChanged', handleUserChanged);
    };
  }, []);

  const checkSystemHealth = async () => {
    setIsRefreshing(true);
    try {
      const [dbResponse, aiResponse, embeddingResponse] = await Promise.all([
        fetch('/.netlify/functions/db-status').catch(() => ({ ok: false, json: () => ({ database: 'error' }) })),
        fetch('/.netlify/functions/ai-health-check').catch(() => ({ ok: false, json: () => ({ status: 'error' }) })),
        fetch('/.netlify/functions/embedding-health').catch(() => ({ ok: false, json: () => ({ status: 'error' }) }))
      ]);

      const [dbData, aiData, embeddingData] = await Promise.all([
        dbResponse.json(),
        aiResponse.json(), 
        embeddingResponse.json()
      ]);

      setSystemStatus({
        database: dbData.database === 'connected' ? 'connected' : 'error',
        aiService: aiData.status === 'ok' && aiData.testResponse === 'success' ? 'available' : 'unavailable',
        embedding: embeddingData.status === 'healthy' ? 'healthy' : 'error',
        coverage: embeddingData.embeddingCoverage?.coverage || 0,
        lastChecked: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Failed to check system health:', error);
      setSystemStatus({
        database: 'error',
        aiService: 'unavailable', 
        embedding: 'error',
        lastChecked: new Date().toLocaleTimeString()
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    if (!isRefreshing) {
      checkSystemHealth();
    }
  };

  const getTexts = () => {
    const texts = {
      en: {
        multiModelAI: 'Multi-Model AI',
        secureConnection: 'Secure Connection',
        version: 'Ailocks v1.0 • Ai2Ai Network',
        builtOnBolt: 'Built on Bolt',
        databaseConnected: 'Database',
        embeddingService: 'Vector Search',
        loading: 'Loading...',
        connected: 'Connected',
        available: 'Available',
        unavailable: 'Unavailable',
        error: 'Error',
        healthy: 'Healthy',
        refreshing: 'Refreshing...',
        clickToRefresh: 'Click to refresh'
      },
      ru: {
        multiModelAI: 'Мульти-модельный ИИ',
        secureConnection: 'Безопасное соединение',
        version: 'Ailocks v1.0 • Ai2Ai Network',
        builtOnBolt: 'Создано на Bolt',
        databaseConnected: 'База данных',
        embeddingService: 'Векторный поиск',
        loading: 'Загрузка...',
        connected: 'Подключено',
        available: 'Доступен',
        unavailable: 'Недоступен',
        error: 'Ошибка',
        healthy: 'Работает',
        refreshing: 'Обновление...',
        clickToRefresh: 'Нажмите для обновления'
      }
    };
    return texts[language as keyof typeof texts] || texts.en;
  };

  const texts = getTexts();

  const getStatusInfo = (status: string, label: string) => {
    if (isRefreshing && status !== 'loading') {
      return {
        color: 'bg-yellow-400',
        text: `${label} (${texts.refreshing})`,
        animate: 'animate-pulse'
      };
    }

    switch (status) {
      case 'connected':
      case 'available':
      case 'healthy':
        return {
          color: 'bg-emerald-400',
          text: label,
          animate: 'animate-pulse'
        };
      case 'loading':
        return {
          color: 'bg-yellow-400',
          text: `${label} (${texts.loading})`,
          animate: 'animate-pulse'
        };
      case 'error':
      case 'unavailable':
        return {
          color: 'bg-red-400',
          text: `${label} (${status === 'error' ? texts.error : texts.unavailable})`,
          animate: ''
        };
      default:
        return {
          color: 'bg-gray-400',
          text: label,
          animate: ''
        };
    }
  };

  const dbInfo = getStatusInfo(systemStatus.database, `💾 ${texts.databaseConnected}`);
  const aiInfo = getStatusInfo(systemStatus.aiService, `⚡ ${texts.multiModelAI}`);
  const embeddingInfo = getStatusInfo(systemStatus.embedding, `🔍 ${texts.embeddingService}`);

  return (
    <div className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex-shrink-0">
      <div className="flex items-center justify-between text-xs">
        <div 
          className="flex items-center space-x-6 text-white/60 cursor-pointer hover:text-white/80 transition-colors"
          onClick={handleManualRefresh}
          title={`${texts.clickToRefresh}${systemStatus.lastChecked ? ` • Last checked: ${systemStatus.lastChecked}` : ''}`}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 ${dbInfo.color} rounded-full ${dbInfo.animate}`}></div>
            <span>{dbInfo.text}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 ${aiInfo.color} rounded-full ${aiInfo.animate}`}></div>
            <span>{aiInfo.text}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 ${embeddingInfo.color} rounded-full ${embeddingInfo.animate}`}></div>
            <span>
              {embeddingInfo.text}
              {systemStatus.embedding === 'healthy' && systemStatus.coverage !== undefined && 
                ` (${systemStatus.coverage}%)`
              }
            </span>
          </div>
          {systemStatus.lastChecked && (
            <div className="text-white/40 text-xs">
              • {systemStatus.lastChecked}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4 text-white/40">
          <span>{texts.version}</span>
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