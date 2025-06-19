import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { db } from '../../src/lib/db';
import { ailocks, ailockSkills } from '../../src/lib/schema';
import { eq, and } from 'drizzle-orm';

// Skill tree definitions
interface SkillDefinition {
  name: string;
  description: string;
  maxLevel: number;
  dependencies: string[];
  effects: string[];
}

interface SkillBranch {
  name: string;
  color: string;
  skills: Record<string, SkillDefinition>;
}

const SKILL_TREE: Record<string, SkillBranch> = {
  research: {
    name: 'Research Branch',
    color: 'blue',
    skills: {
      basic_search: {
        name: 'Basic Search',
        description: 'Enhanced web search capabilities',
        maxLevel: 3,
        dependencies: [],
        effects: ['Better search results', 'More sources', 'Faster processing']
      },
      deep_research: {
        name: 'Deep Research',
        description: 'Advanced research with multiple sources and analysis',
        maxLevel: 3,
        dependencies: ['basic_search'],
        effects: ['Multi-source analysis', 'Pattern recognition', 'Insight generation']
      },
      proactive_analysis: {
        name: 'Proactive Analysis',
        description: 'AI monitors trends and provides unsolicited insights',
        maxLevel: 3,
        dependencies: ['deep_research'],
        effects: ['Trend monitoring', 'Automatic reports', 'Predictive insights']
      }
    }
  },
  collaboration: {
    name: 'Collaboration Branch',
    color: 'green',
    skills: {
      basic_matching: {
        name: 'Basic Matching',
        description: 'Find collaborators based on simple criteria',
        maxLevel: 3,
        dependencies: [],
        effects: ['Location matching', 'Skill matching', 'Category filtering']
      },
      predictive_matching: {
        name: 'Predictive Matching',
        description: 'AI predicts ideal collaboration partners',
        maxLevel: 3,
        dependencies: ['basic_matching'],
        effects: ['Compatibility scoring', 'Success prediction', 'Personality matching']
      },
      network_effects: {
        name: 'Network Effects',
        description: 'Leverage network connections for better matches',
        maxLevel: 3,
        dependencies: ['predictive_matching'],
        effects: ['Social graph analysis', 'Introduction facilitation', 'Community building']
      }
    }
  },
  convenience: {
    name: 'Convenience Branch',
    color: 'purple',
    skills: {
      smart_templates: {
        name: 'Smart Templates',
        description: 'AI generates templates and examples',
        maxLevel: 3,
        dependencies: [],
        effects: ['Intent templates', 'Message suggestions', 'Quick actions']
      },
      visual_idea_board: {
        name: 'Visual Idea Board',
        description: 'Transform ideas into visual diagrams',
        maxLevel: 3,
        dependencies: ['smart_templates'],
        effects: ['Mermaid diagrams', 'Flowcharts', 'Mind maps']
      },
      automation_suite: {
        name: 'Automation Suite',
        description: 'Automate repetitive tasks and workflows',
        maxLevel: 3,
        dependencies: ['visual_idea_board'],
        effects: ['Workflow automation', 'Smart notifications', 'Task scheduling']
      }
    }
  }
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
    const { userId, skillId } = JSON.parse(event.body || '{}');

    if (!userId || !skillId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'userId and skillId are required' })
      };
    }

    // Find skill definition
    let skillDefinition: SkillDefinition | null = null;
    let skillBranch = '';
    
    for (const [branchKey, branch] of Object.entries(SKILL_TREE)) {
      if (skillId in branch.skills) {
        skillDefinition = branch.skills[skillId];
        skillBranch = branchKey;
        break;
      }
    }

    if (!skillDefinition) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: `Unknown skill: ${skillId}` })
      };
    }

    // Get Ailock profile
    const ailockResult = await db.select().from(ailocks)
      .where(eq(ailocks.userId, userId))
      .limit(1);

    if (ailockResult.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Ailock profile not found' })
      };
    }

    const ailock = ailockResult[0];
    const skillPoints = ailock.skillPoints ?? 0;

    // Check if user has enough skill points
    if (skillPoints < 1) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Not enough skill points',
          availablePoints: skillPoints 
        })
      };
    }

    // Get or create skill record
    let skillRecord = await db.select().from(ailockSkills)
      .where(and(
        eq(ailockSkills.ailockId, ailock.id),
        eq(ailockSkills.skillId, skillId)
      ))
      .limit(1);

    let newSkillLevel = 1;
    let wasUnlocked = false;

    if (skillRecord.length === 0) {
      // Create new skill
      await db.insert(ailockSkills).values({
        ailockId: ailock.id,
        skillId,
        skillName: skillDefinition.name,
        skillLevel: 1,
        skillBranch,
        isUnlocked: true,
        timesUsed: 0,
        unlockedAt: new Date()
      });
      
      newSkillLevel = 1;
      wasUnlocked = true;
    } else {
      // Upgrade existing skill
      const currentSkill = skillRecord[0];
      const currentSkillLevel = currentSkill.skillLevel ?? 0;
      
      if (currentSkillLevel >= skillDefinition.maxLevel) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            error: 'Skill is already at maximum level',
            currentLevel: currentSkillLevel,
            maxLevel: skillDefinition.maxLevel 
          })
        };
      }

      newSkillLevel = currentSkillLevel + 1;
      
      await db.update(ailockSkills)
        .set({
          skillLevel: newSkillLevel,
          updatedAt: new Date()
        })
        .where(eq(ailockSkills.id, currentSkill.id));
    }

    // Spend skill point
    await db.update(ailocks)
      .set({
        skillPoints: skillPoints - 1,
        updatedAt: new Date()
      })
      .where(eq(ailocks.id, ailock.id));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        skillId,
        skillName: skillDefinition.name,
        newLevel: newSkillLevel,
        maxLevel: skillDefinition.maxLevel,
        wasUnlocked,
        remainingSkillPoints: skillPoints - 1,
        effects: skillDefinition.effects.slice(0, newSkillLevel),
        message: wasUnlocked ? 
          `Unlocked ${skillDefinition.name}!` :
          `Upgraded ${skillDefinition.name} to level ${newSkillLevel}!`
      })
    };

  } catch (error) {
    console.error('Ailock upgrade skill error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to upgrade skill',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 