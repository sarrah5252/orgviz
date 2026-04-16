import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { TreeNode, FilterState } from '../types';
import { useOrgStore } from '../store/useOrgStore';

const NODE_WIDTH = 260;
const NODE_HEIGHT = 100;
const H_GAP = 50;
const V_GAP = 80;

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

function filterTree(node: TreeNode, filters: FilterState): TreeNode | null {
  const hasActiveFilters =
    filters.departments.length > 0 ||
    filters.locations.length > 0 ||
    filters.clients.length > 0 ||
    filters.experience.length > 0;

  if (!hasActiveFilters) return node;

  const filteredChildren = node.children
    .map(child => filterTree(child, filters))
    .filter(Boolean) as TreeNode[];

  function getExpRange(y: number | undefined | null) {
    if (y === undefined || y === null) return null;
    if (y < 2) return '< 2 years';
    if (y < 4) return '2-4 years';
    if (y < 8) return '4-8 years';
    if (y < 16) return '8-16 years';
    return '16+ years';
  }

  const expRange = getExpRange(node.yearsOfExperience);

  const matches =
    (filters.departments.length === 0 || filters.departments.includes(node.department)) &&
    (filters.locations.length === 0 || filters.locations.includes(node.location)) &&
    (filters.clients.length === 0 || (node.client && node.client !== '—' && filters.clients.includes(node.client))) &&
    (filters.experience.length === 0 || (expRange && filters.experience.includes(expRange)));

  if (matches || filteredChildren.length > 0) {
    return { ...node, children: filteredChildren };
  }

  return null;
}

function computeSubtreeBreadth(
  node: TreeNode,
  expandedNodes: Set<string>,
  orientation: 'vertical' | 'horizontal'
): number {
  const isVertical = orientation === 'vertical';
  const nodeBreadth = isVertical ? NODE_WIDTH : NODE_HEIGHT;
  const gap = isVertical ? H_GAP : V_GAP;

  if (!expandedNodes.has(node.id) || node.children.length === 0) {
    return nodeBreadth;
  }

  const childrenBreadth = node.children.reduce(
    (sum, child) => sum + computeSubtreeBreadth(child, expandedNodes, orientation) + gap,
    -gap
  );
  return Math.max(nodeBreadth, childrenBreadth);
}

function layoutTree(
  node: TreeNode,
  breadthPos: number,
  depthPos: number,
  expandedNodes: Set<string>,
  highlightedPath: Set<string>,
  searchQuery: string,
  orientation: 'vertical' | 'horizontal',
  nodes: Node[],
  edges: Edge[],
  parentId?: string
): void {
  const isVertical = orientation === 'vertical';
  const isHighlighted = highlightedPath.has(node.id);
  const isSearchMatch = searchQuery
    ? node.name.toLowerCase().includes(searchQuery.toLowerCase())
    : false;

  // Swap coordinates based on orientation
  const position = isVertical 
    ? { x: breadthPos, y: depthPos } 
    : { x: depthPos, y: breadthPos };

  nodes.push({
    id: node.id,
    type: 'orgNode',
    position,
    data: {
      employee: node,
      hasChildren: node.children.length > 0,
      isExpanded: expandedNodes.has(node.id),
      isHighlighted,
      isSearchMatch,
      childCount: node.children.length,
      orientation,
    },
  });

  if (parentId) {
    edges.push({
      id: `${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      type: 'smoothstep',
      style: {
        stroke: isHighlighted ? '#3b82f6' : '#334155',
        strokeWidth: isHighlighted ? 2.5 : 1.5,
      },
      animated: isHighlighted,
    });
  }

  if (!expandedNodes.has(node.id) || node.children.length === 0) return;

  const childrenBreadths = node.children.map(c => computeSubtreeBreadth(c, expandedNodes, orientation));
  const gap = isVertical ? H_GAP : V_GAP;
  const totalBreadth = childrenBreadths.reduce((s, w) => s + w + gap, -gap);
  
  const nodeBreadth = isVertical ? NODE_WIDTH : NODE_HEIGHT;
  const nodeDepth = isVertical ? NODE_HEIGHT : NODE_WIDTH;
  const depthGap = isVertical ? V_GAP : H_GAP;

  let currentBreadth = breadthPos + nodeBreadth / 2 - totalBreadth / 2;

  node.children.forEach((child, i) => {
    const childBreadth = currentBreadth + childrenBreadths[i] / 2 - nodeBreadth / 2;
    layoutTree(
      child,
      childBreadth,
      depthPos + nodeDepth + depthGap,
      expandedNodes,
      highlightedPath,
      searchQuery,
      orientation,
      nodes,
      edges,
      node.id
    );
    currentBreadth += childrenBreadths[i] + gap;
  });
}

/**
 * Recursively search a tree node for descendants matching the selectedNames.
 * Returns a pruned copy of the subtree keeping only the paths to matched nodes,
 * preserving their full subtrees below the match.
 * Always preserves the top 2 levels (Root and Level 1 directors) regardless of match.
 */
function pruneSubtree(node: TreeNode, selectedNames: string[], depth = 0): TreeNode | null {
  // If THIS node matches, include it with its full subtree
  if (selectedNames.includes(node.name)) {
    return node; // keep entire subtree below
  }

  // Otherwise, recurse into children looking for matches
  const prunedChildren = node.children
    .map(child => pruneSubtree(child, selectedNames, depth + 1))
    .filter(Boolean) as TreeNode[];

  // User requirement: Always keep Managing Director (depth 0) and specific Level 1 Heads pinned
  if (depth === 0) {
    return { ...node, children: prunedChildren };
  }

  if (depth === 1 && (node.name === 'Ali Bhuriwala' || node.name === 'Ajmal Bhatty')) {
    return { ...node, children: prunedChildren };
  }

  // For deeper nodes, only keep them if they lead to a match
  if (prunedChildren.length > 0) {
    return { ...node, children: prunedChildren };
  }

  return null;
}

/**
 * Collect all node IDs in a tree (for auto-expansion).
 */
function collectTreeIds(node: TreeNode): string[] {
  const ids = [node.id];
  node.children.forEach(child => ids.push(...collectTreeIds(child)));
  return ids;
}

export function useTreeLayout(): LayoutResult {
  const tree = useOrgStore(s => s.tree);
  const activeFilters = useOrgStore(s => s.activeFilters);
  const expandedNodes = useOrgStore(s => s.expandedNodes);
  const highlightedPath = useOrgStore(s => s.highlightedPath);
  const searchQuery = useOrgStore(s => s.searchQuery);
  const orientation = useOrgStore(s => s.orientation);

  return useMemo(() => {
    if (!tree) return { nodes: [], edges: [] };

    let filteredRoot = filterTree(tree, activeFilters);
    if (!filteredRoot) return { nodes: [], edges: [] };

    // When direct reports are selected, prune the tree but always keep
    // the full chain: Managing Director → Executive Director → Selected Person → subtree
    let effectiveExpanded = expandedNodes;
    if (activeFilters.directReports && activeFilters.directReports.length > 0) {
      const pruned = pruneSubtree(filteredRoot, activeFilters.directReports);
      if (!pruned) return { nodes: [], edges: [] };
      filteredRoot = pruned;
      // Auto-expand all nodes in the pruned tree so the full chain is visible
      effectiveExpanded = new Set([...expandedNodes, ...collectTreeIds(filteredRoot)]);
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    layoutTree(filteredRoot, 0, 0, effectiveExpanded, highlightedPath, searchQuery, orientation, nodes, edges);

    return { nodes, edges };
  }, [tree, activeFilters, expandedNodes, highlightedPath, searchQuery, orientation]);
}
