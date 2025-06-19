import { useState, useEffect, useMemo, useRef } from 'react';
import type { NodeObject, LinkObject } from 'react-force-graph-2d';
import { SKILL_TREE, BRANCH_COLORS, canUnlockSkill } from '@/lib/ailock/skills';
import type { AilockSkill } from '@/lib/ailock/core';

interface SkillTreeCanvasProps {
  skills: AilockSkill[];
  skillPoints: number;
  onSkillUpgrade: (skillId: string) => void;
  onSkillHover: (skillId: string | null) => void;
}

interface SkillNode extends NodeObject {
  id: string;
  name: string;
  branch: string;
  level: number;
  maxLevel: number;
  unlocked: boolean;
  canUpgrade: boolean;
  isMaxed: boolean;
}

export default function SkillTreeCanvas({ skills, skillPoints, onSkillUpgrade, onSkillHover }: SkillTreeCanvasProps) {
  const fgRef = useRef<any>();
  const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null);
  const [ForceGraph2D, setForceGraph2D] = useState<any>(null);

  // Dynamically import ForceGraph2D only on client side
  useEffect(() => {
    const loadForceGraph = async () => {
      try {
        const module = await import('react-force-graph-2d');
        setForceGraph2D(() => module.default);
      } catch (error) {
        console.error('Failed to load ForceGraph2D:', error);
      }
    };

    loadForceGraph();
  }, []);

  const graphData = useMemo(() => {
    const nodes: SkillNode[] = [];
    const links: LinkObject[] = [];
    const unlockedSkillIds = skills.filter(s => s.currentLevel > 0).map(s => s.skillId);

    Object.entries(SKILL_TREE).forEach(([skillId, skillDef]) => {
      const userSkill = skills.find(s => s.skillId === skillId);
      const currentLevel = userSkill?.currentLevel || 0;
      const isUnlocked = currentLevel > 0;
      
      const canBeUpgraded = skillPoints > 0 && 
                            currentLevel < skillDef.maxLevel &&
                            (isUnlocked || canUnlockSkill(skillId, unlockedSkillIds));

      nodes.push({
        id: skillId,
        name: skillDef.name,
        branch: skillDef.branch,
        level: currentLevel,
        maxLevel: skillDef.maxLevel,
        unlocked: isUnlocked,
        canUpgrade: canBeUpgraded,
        isMaxed: currentLevel === skillDef.maxLevel,
      });

      if (skillDef.prerequisites) {
        skillDef.prerequisites.forEach(prereqId => {
          links.push({ source: prereqId, target: skillId });
        });
      }
    });

    return { nodes, links };
  }, [skills, skillPoints]);

  useEffect(() => {
    if (fgRef.current && ForceGraph2D) {
      fgRef.current.d3Force('charge').strength(-1200);
      fgRef.current.d3Force('link').distance(150);
      fgRef.current.d3Force('center', fgRef.current.d3Force.center());
    }
  }, [ForceGraph2D]);
  
  const handleNodeClick = (node: NodeObject) => {
    const skillNode = node as SkillNode;
    if (skillNode.canUpgrade) {
      onSkillUpgrade(skillNode.id);
    }
  };
  
  const handleNodeHover = (node: NodeObject | null) => {
    onSkillHover(node ? (node as SkillNode).id : null);
    setHoveredNode(node as SkillNode | null);
  };
  
  const drawNode = (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const skillNode = node as SkillNode;
    const { x, y, name, branch, level, maxLevel, unlocked, canUpgrade, isMaxed } = skillNode;

    if (x === undefined || y === undefined) return;
    
    const isHovered = hoveredNode?.id === skillNode.id;
    const radius = isHovered ? 28 : 24;
    const branchColor = BRANCH_COLORS[branch as keyof typeof BRANCH_COLORS];

    // Glow for unlocked nodes
    if (unlocked) {
      ctx.shadowColor = branchColor;
      ctx.shadowBlur = isHovered ? 20 : 10;
    }
    
    // Node body
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = unlocked ? `rgba(${hexToRgb(branchColor)}, 0.2)` : '#1e293b';
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Border
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.strokeStyle = canUpgrade ? '#facc15' : (unlocked ? branchColor : '#475569');
    ctx.lineWidth = canUpgrade ? 3 : 1.5;
    ctx.stroke();

    // Level indicator ring
    if (unlocked) {
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.75, -Math.PI / 2, -Math.PI / 2 + (level / maxLevel) * 2 * Math.PI);
      ctx.strokeStyle = isMaxed ? '#fde047' : '#fafafa';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Icon / Level text
    ctx.fillStyle = '#f8fafc';
    ctx.font = `bold ${radius / 2}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${level}`, x, y);
    
    // Node Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = `${12 / globalScale}px Inter, sans-serif`;
    ctx.fillText(name, x, y + radius + 10);
    
    // Upgrade arrow
    if (canUpgrade) {
      ctx.fillStyle = '#facc15';
      ctx.font = `bold ${20 / globalScale}px Inter, sans-serif`;
      ctx.fillText('⬆', x, y - radius - 10);
    }
  };

  const drawLink = (link: LinkObject, ctx: CanvasRenderingContext2D) => {
    const sourceNode = link.source as SkillNode;
    const targetNode = link.target as SkillNode;
    
    if (!sourceNode.x || !sourceNode.y || !targetNode.x || !targetNode.y) return;

    ctx.beginPath();
    ctx.moveTo(sourceNode.x, sourceNode.y);
    ctx.lineTo(targetNode.x, targetNode.y);
    ctx.strokeStyle = targetNode.unlocked ? `rgba(${hexToRgb(BRANCH_COLORS[targetNode.branch as keyof typeof BRANCH_COLORS])}, 0.5)` : 'rgba(100, 116, 139, 0.25)';
    ctx.lineWidth = targetNode.unlocked ? 1.5 : 0.5;
    ctx.stroke();
  };

  // Show loading state while ForceGraph2D is being loaded
  if (!ForceGraph2D) {
    return (
      <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10 w-full h-[600px] flex items-center justify-center">
        <div className="text-white/60">Loading skill tree...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10 w-full h-[600px]">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel=""
        nodeCanvasObject={drawNode}
        linkCanvasObject={drawLink}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={100}
        onEngineStop={() => fgRef.current.zoomToFit(400, 100)}
        height={550}
        backgroundColor="#0f172a"
      />
    </div>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
}