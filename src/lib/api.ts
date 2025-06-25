const API_BASE = '/.netlify/functions';

export const searchIntents = async (query: string) => {
  try {
    const userLocation = JSON.parse(localStorage.getItem('userLocation') || '{}');
    const response = await fetch(`${API_BASE}/intents-list?query=${encodeURIComponent(query)}&userCountry=${userLocation.country || ''}&userCity=${userLocation.city || ''}`);
    if (!response.ok) throw new Error('Failed to fetch intents');
    const data = await response.json();
    return data.intents || [];
  } catch (error) {
    console.error('Search intents error:', error);
    return [];
  }
};

export const createIntent = async (intentData: any) => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const response = await fetch(`${API_BASE}/intents-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        intentData: {
          title: intentData.title,
          description: intentData.description,
          category: intentData.category,
          requiredSkills: Array.isArray(intentData.requiredSkills) 
            ? intentData.requiredSkills 
            : intentData.requiredSkills.split(',').map((s: string) => s.trim())
        },
        userId 
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create intent');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Create intent error:', error);
    throw error;
  }
};

export const getAilockProfile = async () => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const response = await fetch(`${API_BASE}/ailock-profile?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch Ailock profile');
    return await response.json();
  } catch (error) {
    console.error('Get Ailock profile error:', error);
    throw error;
  }
};

export const gainAilockXp = async (eventType: string, context: Record<string, any> = {}) => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    const response = await fetch(`${API_BASE}/ailock-gain-xp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        eventType,
        context
      })
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Gain XP error:', error);
  }
}; 