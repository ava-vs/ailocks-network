import { db } from '../db';
import { ailocks, ailockSkills, ailockXpHistory, ailockAchievements } from '../schema';
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

  private async findOrCreateBaseProfile(userId: string): Promise<AilockProfile> {
    const existing = await db.select().from(ailocks).where(eq(ailocks.userId, userId)).limit(1);

    if (existing.length > 0) {
      const ailock = existing[0];
      return {
        id: ailock.id,
        userId: ailock.userId,
        name: ailock.name || 'Ailock',
        level: ailock.level || 1,
        xp: ailock.xp || 0,
        skillPoints: ailock.skillPoints || 0,
        avatarPreset: ailock.avatarPreset || 'robot',
        characteristics: {
          velocity: ailock.velocity || 10,
          insight: ailock.insight || 10,
          efficiency: ailock.efficiency || 10,
          economy: ailock.economy || 10,
          convenience: ailock.convenience || 10
        },
        lastActiveAt: ailock.lastActiveAt || new Date(),
        createdAt: ailock.createdAt || new Date(),
        updatedAt: ailock.updatedAt || new Date(),
      };
    }

    // Create a new Ailock profile
    const newAilocks = await db.insert(ailocks).values({
      userId,
      name: 'Ailock',
      level: 1,
      xp: 0,
      skillPoints: 1,
      avatarPreset: 'robot',
      velocity: 10,
      insight: 10,
      efficiency: 10,
      economy: 10,
      convenience: 10,
      lastActiveAt: new Date(),
    }).returning();
    
    const newAilock = newAilocks[0];

    return {
      id: newAilock.id,
      userId: newAilock.userId,
      name: newAilock.name || 'Ailock',
      level: newAilock.level || 1,
      xp: newAilock.xp || 0,
      skillPoints: newAilock.skillPoints || 0,
      avatarPreset: newAilock.avatarPreset || 'robot',
      characteristics: {
        velocity: newAilock.velocity || 10,
        insight: newAilock.insight || 10,
        efficiency: newAilock.efficiency || 10,
        economy: newAilock.economy || 10,
        convenience: newAilock.convenience || 10
      },
      lastActiveAt: newAilock.lastActiveAt || new Date(),
      createdAt: newAilock.createdAt || new Date(),
      updatedAt: newAilock.updatedAt || new Date(),
    };
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
    const achievementsUnlocked = await this.checkAchievements(ailockId, eventType);

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
    // This is a simplified count. A real implementation might be more complex.
    const result = await db
      .select({ value: count() })
      .from(ailockXpHistory)
      .where(eq(ailockXpHistory.ailockId, ailockId));
      
    return result[0]?.value ?? 0;
  }
  
  private async checkAchievements(ailockId: string, eventType: XpEventType): Promise<AilockAchievement[]> {
    // Placeholder for achievement logic
    return [];
  }
}

export const ailockService = new AilockService();
