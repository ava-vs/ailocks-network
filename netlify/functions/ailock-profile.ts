import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { db } from '../../src/lib/db';
import { ailocks, ailockSkills, ailockAchievements, ailockXpHistory } from '../../src/lib/schema';
import { eq, desc } from 'drizzle-orm';

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'GET') {
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
    const { searchParams } = new URL(event.rawUrl);
    const userId = searchParams.get('userId');

    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'userId parameter is required' })
      };
    }

    // Get or create Ailock profile
    let ailock = await db.select().from(ailocks).where(eq(ailocks.userId, userId)).limit(1);
    
    if (ailock.length === 0) {
      // Create new Ailock for this user
      const [newAilock] = await db.insert(ailocks).values({
        userId,
        name: 'Ailock',
        level: 1,
        xp: 0,
        skillPoints: 1, // Start with 1 skill point
        insight: 10,
        efficiency: 10,
        creativity: 10,
        collaboration: 10
      }).returning();
      
      ailock = [newAilock];
    }

    const ailockProfile = ailock[0];

    // Get skills
    const skills = await db.select().from(ailockSkills)
      .where(eq(ailockSkills.ailockId, ailockProfile.id));

    // Get recent achievements
    const achievements = await db.select().from(ailockAchievements)
      .where(eq(ailockAchievements.ailockId, ailockProfile.id))
      .orderBy(desc(ailockAchievements.unlockedAt))
      .limit(10);

    // Get recent XP history
    const xpHistory = await db.select().from(ailockXpHistory)
      .where(eq(ailockXpHistory.ailockId, ailockProfile.id))
      .orderBy(desc(ailockXpHistory.createdAt))
      .limit(20);

    // Safe defaults for calculations
    const level = ailockProfile.level ?? 1;
    const xp = ailockProfile.xp ?? 0;

    // Calculate progress to next level
    const currentLevelXp = (level - 1) * 100;
    const nextLevelXp = level * 100;
    const progressToNextLevel = Math.max(0, Math.min(100, 
      ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    ));

    // Calculate avatar evolution stage
    const avatarStage = getAvatarStage(level);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        ailock: {
          ...ailockProfile,
          level,
          xp,
          avatarStage,
          progressToNextLevel: Math.round(progressToNextLevel),
          nextLevelXp: nextLevelXp - xp
        },
        skills: skills.map(skill => ({
          ...skill,
          isMaxLevel: (skill.skillLevel ?? 0) >= 3,
          nextLevelCost: (skill.skillLevel ?? 0) + 1
        })),
        achievements,
        recentActivity: xpHistory.map(activity => ({
          ...activity,
          timeAgo: getTimeAgo(activity.createdAt)
        })),
        stats: {
          totalSkills: skills.length,
          unlockedSkills: skills.filter(s => s.isUnlocked).length,
          totalAchievements: achievements.length,
          totalXpGained: xp
        }
      })
    };

  } catch (error) {
    console.error('Ailock profile error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to get Ailock profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

function getAvatarStage(level: number): string {
  if (level >= 50) return 'singularity'; // ✨
  if (level >= 30) return 'master';       // ⭐
  if (level >= 20) return 'strategist';   // 🧠
  if (level >= 10) return 'analyst';      // 🔬
  return 'robot';                         // 🤖
}

function getTimeAgo(date: Date | null): string {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
} 