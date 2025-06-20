import { db } from '../db';
import { ailocks, ailockSkills, ailockXpHistory, ailockAchievements, intents, chatSessions } from '../schema';
import { eq, desc, count } from 'drizzle-orm';
import { SKILL_TREE, canUnlockSkill } from './skills';

// Base profile stored in the 'ailocks' table
export interface AilockProfile {
  id: string;
  userId: string;
  name: string;
  level: number;
  xp: number;
  skillPoints: number;
  avatarPreset: string; // e.g., 'robot', 'analyst'
  characteristics: {
    velocity: number;
    insight: number;
    efficiency: number;
    economy: number;
    convenience: number;
  };
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
  totalIntentsCreated: number;
  totalChatMessages: number;
  totalSkillsUsed: number;
}

// Skill record from 'ailock_skills' table
export interface AilockSkill {
  id: string;
  ailockId: string;
  skillId: string;
  skillName: string;
  branch: string;
  currentLevel: number;
  usageCount: number;
  successRate: number; // 0 to 1
  lastUsedAt: Date | null;
  unlockedAt: Date | null;
}

// Achievement record from 'ailock_achievements' table
export interface AilockAchievement {
  id: string;
  ailockId: string;
  achievementId: string;
  achievementName: string;
  achievementDescription: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
}

// XP History record from 'ailock_xp_history'
export interface XpEvent {
  id: string;
  ailockId: string;
  eventType: string;
  xpGained: number;
  description: string;
  context: Record<string, any>;
  createdAt: Date;
}

// A complete profile with all related data for UI
export interface FullAilockProfile extends AilockProfile {
  skills: AilockSkill[];
  achievements: AilockAchievement[];
  recentXpHistory: XpEvent[];
  totalInteractions: number;
}

export type XpEventType = 
  | 'chat_message_sent'
  | 'intent_created'
  | 'skill_used_successfully'
  | 'achievement_unlocked'
  | 'project_started'
  | 'project_completed'
  | 'first_login_today';

const XP_REWARDS: Record<XpEventType, number> = {
  chat_message_sent: 5,
  intent_created: 25,
  skill_used_successfully: 15,
  achievement_unlocked: 50,
  project_started: 30,
  project_completed: 200,
  first_login_today: 10
};

// XP progression logic
export function calculateXpForNextLevel(level: number): number {
  if (level >= 20) return 0; // Max level
  return Math.floor(100 * Math.pow(1.2, level - 1));
}

export class AilockService {
  
  async getOrCreateAilock(userId: string): Promise<FullAilockProfile> {
    const baseProfile = await this.findOrCreateBaseProfile(userId);
    
    const [skills, achievements, recentXpHistory] = await Promise.all([
      this.getSkills(baseProfile.id),
      this.getAchievements(baseProfile.id),
      this.getRecentXpHistory(baseProfile.id, 10)
    ]);
    
    const totalInteractions = await this.countInteractions(baseProfile.id);

    return {
      ...baseProfile,
      skills,
      achievements,
      recentXpHistory,
      totalInteractions,
    };
  }

  private async mapToAilockProfile(dbObject: any): Promise<AilockProfile> {
    return {
      id: dbObject.id,
      userId: dbObject.userId,
      name: dbObject.name,
      level: dbObject.level,
      xp: dbObject.xp,
      skillPoints: dbObject.skillPoints,
      avatarPreset: dbObject.avatarPreset,
      characteristics: {
        velocity: dbObject.velocity,
        insight: dbObject.insight,
        efficiency: dbObject.efficiency,
        economy: dbObject.economy,
        convenience: dbObject.convenience,
      },
      lastActiveAt: dbObject.lastActiveAt,
      createdAt: dbObject.createdAt,
      updatedAt: dbObject.updatedAt,
      totalIntentsCreated: dbObject.totalIntentsCreated,
      totalChatMessages: dbObject.totalChatMessages,
      totalSkillsUsed: dbObject.totalSkillsUsed,
    };
  }

  private async findOrCreateBaseProfile(userId: string): Promise<AilockProfile> {
    if (!db) {
      console.error('Database client (db) is not initialized in ailockService.');
      throw new Error('Database connection is not available.');
    }

    console.log(`[AilockService] Attempting to find profile for userId: ${userId} using Drizzle ORM.`);
    
    try {
      const existingProfiles = await db.select()
        .from(ailocks)
        .where(eq(ailocks.userId, userId))
        .limit(1);

      const existingProfileData = existingProfiles.length > 0 ? existingProfiles[0] : null;

      if (existingProfileData) {
        console.log(`[AilockService] Found existing profile for userId: ${userId}`);
        return this.mapToAilockProfile(existingProfileData);
      }

      console.log(`[AilockService] No profile found. Creating new one for userId: ${userId}`);
      
      const newAilocks = await db.insert(ailocks).values({
        userId: userId,
        name: 'Ailock',
      }).returning();

      if (!newAilocks || newAilocks.length === 0) {
        throw new Error('Failed to create new Ailock profile.');
      }
      
      const newProfileData = newAilocks[0];
      console.log('[AilockService] Successfully created new profile:', newProfileData);
      return this.mapToAilockProfile(newProfileData);

    } catch (e) {
      console.error(`[AilockService] Database query failed for userId: ${userId}. Error object:`, JSON.stringify(e, null, 2));
      const errorMessage = e instanceof Error ? e.message : String(e);
      // Add more context to the error message
      if (errorMessage.includes('relation "ailocks" does not exist')) {
         throw new Error(`Database query failed. Drizzle might be generating incorrect SQL for the 'ailocks' table with the neon-http driver. Check table name and schema. Original error: ${errorMessage}`);
      }
      throw new Error(`Database query failed. Details: ${errorMessage}`);
    }
  }

  async gainXp(ailockId: string, eventType: XpEventType, context: Record<string, any> = {}) {
    const xpAmount = XP_REWARDS[eventType] || 0;
    if (xpAmount === 0) return { success: false };

    const ailock = await db.select().from(ailocks).where(eq(ailocks.id, ailockId)).limit(1);
    if (!ailock[0]) throw new Error('Ailock not found');

    const current = ailock[0];
    const newXp = (current.xp || 0) + xpAmount;
    
    let currentLevel = current.level || 1;
    let skillPointsGained = 0;
    
    const initialXp = current.xp || 0;
    let xpForLevelUp = calculateXpForNextLevel(currentLevel)
    
    while (newXp >= initialXp + xpForLevelUp) {
      currentLevel++;
      skillPointsGained++;
      xpForLevelUp += calculateXpForNextLevel(currentLevel);
    }
    
    await db.update(ailocks).set({
      xp: newXp,
      level: currentLevel,
      skillPoints: (current.skillPoints || 0) + skillPointsGained,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(ailocks.id, ailockId));

    await db.insert(ailockXpHistory).values({
      ailockId,
      eventType,
      xpGained: xpAmount,
      description: `Gained ${xpAmount} XP from ${eventType.replace(/_/g, ' ')}`,
      context,
    });
    
    // TODO: Achievement check
    const achievementsUnlocked = await this.checkAchievements(ailockId);

    return {
      success: true,
      xpGained: xpAmount,
      newXp,
      leveledUp: skillPointsGained > 0,
      newLevel: currentLevel,
      skillPointsGained,
      achievementsUnlocked,
    };
  }

  async upgradeSkill(ailockId: string, skillId: string): Promise<boolean> {
    const ailock = await db.select().from(ailocks).where(eq(ailocks.id, ailockId)).limit(1);
    if (!ailock[0] || (ailock[0].skillPoints || 0) < 1) {
      return false;
    }

    const skillDef = SKILL_TREE[skillId];
    if (!skillDef) return false;

    const userSkills = await this.getSkills(ailockId);
    const unlockedSkillIds = userSkills.filter(s => s.currentLevel > 0).map(s => s.skillId);
    
    if (!canUnlockSkill(skillId, unlockedSkillIds)) {
      return false;
    }

    const existingSkill = userSkills.find(s => s.skillId === skillId);

    if (existingSkill) {
      if (existingSkill.currentLevel >= skillDef.maxLevel) return false;
      await db.update(ailockSkills).set({
        currentLevel: existingSkill.currentLevel + 1,
        updatedAt: new Date(),
      }).where(eq(ailockSkills.id, existingSkill.id));
    } else {
      await db.insert(ailockSkills).values({
        ailockId,
        skillId,
        skillName: skillDef.name,
        branch: skillDef.branch,
        currentLevel: 1,
        unlockedAt: new Date(),
      });
    }

    // Deduct skill point
    await db.update(ailocks).set({
      skillPoints: (ailock[0].skillPoints || 0) - 1,
      updatedAt: new Date(),
    }).where(eq(ailocks.id, ailockId));

    return true;
  }

  async getSkills(ailockId: string): Promise<AilockSkill[]> {
    const skills = await db.select().from(ailockSkills).where(eq(ailockSkills.ailockId, ailockId));
    return skills.map(s => ({
      id: s.id,
      ailockId: s.ailockId,
      skillId: s.skillId,
      skillName: s.skillName || 'Unknown Skill',
      branch: s.branch || 'unknown',
      currentLevel: s.currentLevel || 0,
      usageCount: s.usageCount || 0,
      successRate: s.successRate || 0,
      lastUsedAt: s.lastUsedAt,
      unlockedAt: s.unlockedAt,
    }));
  }

  async getAchievements(ailockId: string): Promise<AilockAchievement[]> {
    const achievements = await db.select().from(ailockAchievements).where(eq(ailockAchievements.ailockId, ailockId));
    return achievements.map(a => ({
      id: a.id,
      ailockId: a.ailockId,
      achievementId: a.achievementId,
      achievementName: a.name || 'Unnamed Achievement',
      achievementDescription: a.description || '',
      icon: a.icon || '🏆',
      rarity: a.rarity as 'common' | 'rare' | 'epic' | 'legendary' || 'common',
      unlockedAt: a.unlockedAt || new Date(),
    }));
  }
  
  async getRecentXpHistory(ailockId: string, limit: number = 5): Promise<XpEvent[]> {
    const history = await db.select().from(ailockXpHistory)
      .where(eq(ailockXpHistory.ailockId, ailockId))
      .orderBy(desc(ailockXpHistory.createdAt))
      .limit(limit);
      
    return history.map(h => ({
      id: h.id,
      ailockId: h.ailockId,
      eventType: h.eventType || 'unknown',
      xpGained: h.xpGained || 0,
      description: h.description || '',
      context: h.context as Record<string, any> || {},
      createdAt: h.createdAt || new Date(),
    }));
  }
  
  private async countInteractions(ailockId: string): Promise<number> {
    const totalIntents = await db.select({ value: count() }).from(intents).where(eq(intents.userId, ailockId));
    const totalMessages = await db.select({ value: count() }).from(chatSessions).where(eq(chatSessions.userId, ailockId));
    return (totalIntents[0]?.value || 0) + (totalMessages[0]?.value || 0);
  }
  
  private async checkAchievements(ailockId: string): Promise<AilockAchievement[]> {
    // TODO: Implement achievement checking logic based on events and profile stats
    // For now, returning an empty array.
    // Example: Check if user created 10 intents, unlocked a skill branch, etc.
    return [];
  }
}

export const ailockService = new AilockService();
