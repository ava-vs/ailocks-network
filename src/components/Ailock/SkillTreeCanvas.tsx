import { useState } from 'react';
import { Search, Users, Wrench, Star, Lock, Zap, CheckCircle } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string;
  branch: string;
  level: number;
  maxLevel: number;
  isUnlocked: boolean;
  dependencies: string[];
  effects: string[];
  position: { x: number; y: number };
}

interface SkillTreeCanvasProps {
  skills: Skill[];
  availableSkillPoints: number;
  onSkillUpgrade: (skillId: string) => void;
  onSkillHover: (skill: Skill | null) => void;
}

interface SkillPosition {
  x: number;
  y: number;
}

interface SkillBranch {
  color: string;
  branch: string;
  icon: React.ComponentType<any>;
  skills: Record<string, SkillPosition>;
}

const SKILL_TREE_LAYOUT: Record<string, SkillBranch> = {
  research: {
    color: '#3b82f6',
    branch: 'Research',
    icon: Search,
    skills: {
      basic_search: { x: 150, y: 100 },
      deep_research: { x: 150, y: 200 },
      proactive_analysis: { x: 150, y: 300 }
    }
  },
  collaboration: {
    color: '#22c55e',
    branch: 'Collaboration',
    icon: Users,
    skills: {
      basic_matching: { x: 400, y: 100 },
      predictive_matching: { x: 400, y: 200 },
      network_effects: { x: 400, y: 300 }
    }
  },
  convenience: {
    color: '#9333ea',
    branch: 'Convenience',
    icon: Wrench,
    skills: {
      smart_templates: { x: 650, y: 100 },
      visual_idea_board: { x: 650, y: 200 },
      automation_suite: { x: 650, y: 300 }
    }
  }
};

export default function SkillTreeCanvas({
  skills,
  availableSkillPoints,
  onSkillUpgrade,
  onSkillHover
}: SkillTreeCanvasProps) {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [animatingSkill, setAnimatingSkill] = useState<string | null>(null);

  const getSkillData = (skillId: string): Skill | null => {
    return skills.find(s => s.id === skillId) || null;
  };

  const canUpgradeSkill = (skillId: string): boolean => {
    const skill = getSkillData(skillId);
    if (!skill) return false;
    
    if (availableSkillPoints < 1) return false;
    if (skill.level >= skill.maxLevel) return false;
    
    // Check dependencies
    for (const depId of skill.dependencies) {
      const depSkill = getSkillData(depId);
      if (!depSkill || !depSkill.isUnlocked) return false;
    }
    
    return true;
  };

  const handleSkillClick = (skillId: string) => {
    if (canUpgradeSkill(skillId)) {
      setAnimatingSkill(skillId);
      onSkillUpgrade(skillId);
      
      // Reset animation after delay
      setTimeout(() => setAnimatingSkill(null), 1000);
    }
  };

  const getSkillIcon = (branch: string, skill: Skill) => {
    if (skill.level >= skill.maxLevel) return CheckCircle;
    if (!skill.isUnlocked) return Lock;
    
    const branchIcons: Record<string, React.ComponentType<any>> = {
      research: Search,
      collaboration: Users,
      convenience: Wrench
    };
    
    return branchIcons[branch] || Star;
  };

  const renderSkillNode = (skillId: string, branch: string) => {
    const skill = getSkillData(skillId);
    const layout = SKILL_TREE_LAYOUT[branch];
    const position = layout?.skills[skillId];
    
    if (!skill || !position) return null;

    const SkillIcon = getSkillIcon(branch, skill);
    const isHovered = hoveredSkill === skillId;
    const isAnimating = animatingSkill === skillId;
    const canUpgrade = canUpgradeSkill(skillId);

    return (
      <div
        key={skillId}
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
          isAnimating ? 'scale-125' : isHovered ? 'scale-110' : 'scale-100'
        }`}
        style={{ 
          left: position.x, 
          top: position.y,
          filter: isAnimating ? `drop-shadow(0 0 20px ${layout.color})` : 'none'
        }}
        onMouseEnter={() => {
          setHoveredSkill(skillId);
          onSkillHover(skill);
        }}
        onMouseLeave={() => {
          setHoveredSkill(null);
          onSkillHover(null);
        }}
        onClick={() => handleSkillClick(skillId)}
      >
        {/* Skill circle */}
        <div
          className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-lg transition-all duration-300 ${
            skill.isUnlocked
              ? skill.level >= skill.maxLevel
                ? 'bg-yellow-100 border-yellow-400'
                : 'bg-white border-gray-300'
              : 'bg-gray-100 border-gray-400'
          } ${canUpgrade ? 'hover:shadow-xl border-blue-400' : ''}`}
          style={{
            borderColor: skill.isUnlocked ? layout.color : '#9ca3af',
            backgroundColor: skill.isUnlocked 
              ? skill.level >= skill.maxLevel ? '#fef3c7' : 'white'
              : '#f3f4f6'
          }}
        >
          <SkillIcon 
            className={`w-8 h-8 ${
              skill.isUnlocked 
                ? skill.level >= skill.maxLevel ? 'text-yellow-600' : 'text-gray-700'
                : 'text-gray-400'
            }`}
            style={{ color: skill.isUnlocked ? layout.color : '#9ca3af' }}
          />
        </div>

        {/* Skill level indicator */}
        {skill.isUnlocked && (
          <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {skill.level}
          </div>
        )}

        {/* Upgrade indicator */}
        {canUpgrade && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
          </div>
        )}

        {/* Skill name */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-sm font-medium text-gray-800 whitespace-nowrap">
            {skill.name}
          </div>
          <div className="text-xs text-gray-500">
            {skill.level}/{skill.maxLevel}
          </div>
        </div>
      </div>
    );
  };

  const renderDependencyLines = () => {
    const lines = [];
    
    for (const [, branch] of Object.entries(SKILL_TREE_LAYOUT)) {
      for (const [skillId, position] of Object.entries(branch.skills)) {
        const skill = getSkillData(skillId);
        if (!skill) continue;

        for (const depId of skill.dependencies) {
          const depPosition = findSkillPosition(depId);
          if (depPosition) {
            const depSkill = getSkillData(depId);
            lines.push(
              <line
                key={`${depId}-${skillId}`}
                x1={depPosition.x}
                y1={depPosition.y}
                x2={position.x}
                y2={position.y}
                stroke={depSkill?.isUnlocked ? branch.color : '#d1d5db'}
                strokeWidth={depSkill?.isUnlocked ? 2 : 1}
                strokeDasharray={depSkill?.isUnlocked ? 'none' : '5,5'}
                className="transition-all duration-300"
              />
            );
          }
        }
      }
    }
    
    return lines;
  };

  const findSkillPosition = (skillId: string): SkillPosition | null => {
    for (const branch of Object.values(SKILL_TREE_LAYOUT)) {
      const position = branch.skills[skillId];
      if (position) {
        return position;
      }
    }
    return null;
  };

  const renderBranchHeaders = () => {
    return Object.entries(SKILL_TREE_LAYOUT).map(([branchKey, branch]) => {
      const BranchIcon = branch.icon;
      const skillCount = Object.keys(branch.skills).length;
      const unlockedCount = Object.keys(branch.skills).filter(skillId => {
        const skill = getSkillData(skillId);
        return skill?.isUnlocked;
      }).length;

      return (
        <div
          key={branchKey}
          className="absolute transform -translate-x-1/2"
          style={{ 
            left: Object.values(branch.skills)[0].x, 
            top: 20 
          }}
        >
          <div 
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-lg border-2"
            style={{ borderColor: branch.color }}
          >
            <BranchIcon 
              className="w-8 h-8 mb-2" 
              style={{ color: branch.color }} 
            />
            <h3 className="font-bold text-gray-800">{branch.branch}</h3>
            <div className="text-sm text-gray-600">
              {unlockedCount}/{skillCount} unlocked
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="relative w-full h-96 bg-gradient-to-b from-indigo-900 via-purple-900 to-gray-900 rounded-lg overflow-hidden">
      {/* Stars background */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.8 + 0.2
            }}
          />
        ))}
      </div>

      {/* Dependency lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {renderDependencyLines()}
      </svg>

      {/* Branch headers */}
      {renderBranchHeaders()}

      {/* Skill nodes */}
      {Object.entries(SKILL_TREE_LAYOUT).map(([branchKey, branch]) =>
        Object.keys(branch.skills).map(skillId =>
          renderSkillNode(skillId, branchKey)
        )
      )}

      {/* Skill points indicator */}
      <div className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5" />
          <span className="font-bold">{availableSkillPoints} Points</span>
        </div>
      </div>

      {/* Instructions */}
      {availableSkillPoints > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg animate-bounce">
          <div className="text-sm font-medium text-center">
            Click on skills with ⚡ to upgrade!
          </div>
        </div>
      )}
    </div>
  );
} 