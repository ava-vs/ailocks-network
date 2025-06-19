import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { db } from '../../src/lib/db';
import { ailocks, ailockXpHistory, ailockAchievements } from '../../src/lib/schema';
import { eq } from 'drizzle-orm';

// XP rewards for different events
const XP_REWARDS: Record<string, number> = {
  chat_message: 5,
  intent_created: 25,
  skill_used: 15,
  achievement_unlocked: 50,
  first_intent: 100,
  collaboration_started: 30,
  project_completed: 200
};

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userId, eventType, context = {}, description } = JSON.parse(event.body || '{}');

    if (!userId || !eventType) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'userId and eventType are required' })
      };
    }

    // Get XP reward for event type
    const xpGained = XP_REWARDS[eventType] || 5;

    // Get or create Ailock profile
    let ailockResult = await db.select().from(ailocks)
      .where(eq(ailocks.userId, userId))
      .limit(1);

    if (ailockResult.length === 0) {
      // Create new Ailock for this user
      const [newAilock] = await db.insert(ailocks).values({
        userId,
        name: 'Ailock',
        level: 1,
        xp: 0,
        skillPoints: 1,
        insight: 10,
        efficiency: 10,
        creativity: 10,
        collaboration: 10
      }).returning();
      
      ailockResult = [newAilock];
    }

    const ailock = ailockResult[0];
    const currentXp = ailock.xp ?? 0;
    const currentLevel = ailock.level ?? 1;
    const newXp = currentXp + xpGained;

    // Calculate new level
    let newLevel = currentLevel;
    let skillPointsEarned = 0;
    let leveledUp = false;

    // Check if leveled up (every 100 XP)
    const newCalculatedLevel = Math.floor(newXp / 100) + 1;
    if (newCalculatedLevel > currentLevel) {
      leveledUp = true;
      skillPointsEarned = newCalculatedLevel - currentLevel;
      newLevel = newCalculatedLevel;
    }

    // Update Ailock profile
    await db.update(ailocks)
      .set({
        xp: newXp,
        level: newLevel,
        skillPoints: (ailock.skillPoints ?? 0) + skillPointsEarned,
        lastActiveAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(ailocks.id, ailock.id));

    // Add XP history record
    await db.insert(ailockXpHistory).values({
      ailockId: ailock.id,
      eventType,
      xpGained,
      context: JSON.stringify(context),
      description: description || `Gained ${xpGained} XP from ${eventType}`
    });

    // Check for achievements
    const achievements = await checkForAchievements(ailock.id, eventType, newXp, newLevel);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        xpGained,
        newXp,
        newLevel,
        leveledUp,
        skillPointsEarned,
        achievements,
        message: leveledUp ? 
          `Level up! You're now level ${newLevel} and earned ${skillPointsEarned} skill points!` :
          `+${xpGained} XP gained!`
      })
    };

  } catch (error) {
    console.error('Ailock gain XP error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to gain XP',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function checkForAchievements(ailockId: string, eventType: string, newXp: number, newLevel: number): Promise<any[]> {
  const newAchievements = [];

  try {
    // Check for level-based achievements
    if (newLevel === 5) {
      await unlockAchievement(ailockId, 'level_5', 'Rising Star', 'Reached level 5', 'common');
      newAchievements.push('Rising Star');
    }
    if (newLevel === 10) {
      await unlockAchievement(ailockId, 'level_10', 'AI Analyst', 'Reached level 10', 'rare');
      newAchievements.push('AI Analyst');
    }
    if (newLevel === 25) {
      await unlockAchievement(ailockId, 'level_25', 'AI Master', 'Reached level 25', 'epic');
      newAchievements.push('AI Master');
    }

    // Check for XP-based achievements
    if (newXp >= 1000) {
      await unlockAchievement(ailockId, 'xp_1000', 'XP Collector', 'Earned 1000 total XP', 'rare');
      newAchievements.push('XP Collector');
    }

    // Check for event-specific achievements
    if (eventType === 'intent_created') {
      await unlockAchievement(ailockId, 'first_intent', 'First Intent', 'Created your first intent', 'common');
      newAchievements.push('First Intent');
    }

  } catch (error) {
    console.error('Error checking achievements:', error);
  }

  return newAchievements;
}

async function unlockAchievement(ailockId: string, achievementId: string, name: string, description: string, rarity: string): Promise<void> {
  try {
    // Check if achievement already exists
    const existing = await db.select().from(ailockAchievements)
      .where(eq(ailockAchievements.ailockId, ailockId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(ailockAchievements).values({
        ailockId,
        achievementId,
        achievementName: name,
        description,
        rarity,
        unlockedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error unlocking achievement:', error);
  }
} 