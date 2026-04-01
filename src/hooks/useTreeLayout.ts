import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { TreeNode, FilterState } from '../types';
import { useOrgStore } from '../store/useOrgStore';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;
const H_GAP = 40;
const V_GAP = 80;

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

function filterTree(node: TreeNode, filters: FilterState): TreeNode | null {
  const hasActiveFilters =
    filters.departments.length > 0 ||
    filters.titles.length > 0 ||
    filters.locations.length > 0 ||
    filters.clients.length > 0;

  if (!hasActiveFilters) return node;

  const filteredChildren = node.children
    .map(child => filterTree(child, filters))
    .filter(Boolean) as TreeNode[];

  const matches =
    (filters.departments.length === 0 || filters.departments.includes(node.department)) &&
    (filters.titles.length === 0 || filters.titles.includes(node.title)) &&
    (filters.locations.length === 0 || filters.locations.includes(node.location)) &&
    (filters.clients.length === 0 || (node.client && node.client !== '—' && filters.clients.includes(node.client)));

  if (matches || filteredChildren.length > 0) {
    return { ...node, children: filteredChildren };
  }

  return null;
}

function computeSubtreeWidth(
  node: TreeNode,
  expandedNodes: Set<string>
): number {
  if (!expandedNodes.has(node.id) || node.children.length === 0) {
    return NODE_WIDTH;
  }
  const childrenWidth = node.children.reduce(
    (sum, child) => sum + computeSubtreeWidth(child, expandedNodes) + H_GAP,
    -H_GAP
  );
  return Math.max(NODE_WIDTH, childrenWidth);
}

function layoutTree(
  node: TreeNode,
  x: number,
  y: number,
  expandedNodes: Set<string>,
  highlightedPath: Set<string>,
  searchQuery: string,
  nodes: Node[],
  edges: Edge[],
  parentId?: string
): void {
  const isHighlighted = highlightedPath.has(node.id);
  const isSearchMatch = searchQuery
    ? node.name.toLowerCase().includes(searchQuery.toLowerCase())
    : false;

  nodes.push({
    id: node.id,
    type: 'orgNode',
    position: { x, y },
    data: {
      employee: node,
      hasChildren: node.children.length > 0,
      isExpanded: expandedNodes.has(node.id),
      isHighlighted,
      isSearchMatch,
      childCount: node.children.length,
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

  const childrenWidths = node.children.map(c => computeSubtreeWidth(c, expandedNodes));
  const totalWidth = childrenWidths.reduce((s, w) => s + w + H_GAP, -H_GAP);
  let currentX = x + NODE_WIDTH / 2 - totalWidth / 2;

  node.children.forEach((child, i) => {
    const childX = currentX + childrenWidths[i] / 2 - NODE_WIDTH / 2;
    layoutTree(
      child,
      childX,
      y + NODE_HEIGHT + V_GAP,
      expandedNodes,
      highlightedPath,
      searchQuery,
      nodes,
      edges,
      node.id
    );
    currentX += childrenWidths[i] + H_GAP;
  });
}

export function useTreeLayout(): LayoutResult {
  const tree = useOrgStore(s => s.tree);
  const activeFilters = useOrgStore(s => s.activeFilters);
  const expandedNodes = useOrgStore(s => s.expandedNodes);
  const highlightedPath = useOrgStore(s => s.highlightedPath);
  const searchQuery = useOrgStore(s => s.searchQuery);

  return useMemo(() => {
    if (!tree) return { nodes: [], edges: [] };

    const filteredRoot = filterTree(tree, activeFilters);
    if (!filteredRoot) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    layoutTree(filteredRoot, 0, 0, expandedNodes, highlightedPath, searchQuery, nodes, edges);

    return { nodes, edges };
  }, [tree, activeFilters, expandedNodes, highlightedPath, searchQuery]);
}
