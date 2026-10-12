import type { TreeNode, FilterState } from '../types';
import { getExpRange, isPinnedLevel1 } from './constants';

export const EMPTY_FILTERS: FilterState = {
  departments: [], directReports: [], locations: [], clients: [], experience: [],
};

export function hasAttributeFilters(filters: FilterState): boolean {
  return (
    filters.departments.length > 0 ||
    filters.locations.length > 0 ||
    filters.clients.length > 0 ||
    filters.experience.length > 0
  );
}

/** Does this employee match the department / location / client / experience filters? */
export function matchesAttributeFilters(node: TreeNode, filters: FilterState): boolean {
  const expRange = getExpRange(node.yearsOfExperience);
  return (
    (filters.departments.length === 0 || filters.departments.includes(node.department)) &&
    (filters.locations.length === 0 || filters.locations.includes(node.location)) &&
    (filters.clients.length === 0 || (!!node.client && node.client !== '—' && filters.clients.includes(node.client))) &&
    (filters.experience.length === 0 || (!!expRange && filters.experience.includes(expRange)))
  );
}

export function filterTree(node: TreeNode, filters: FilterState, depth = 0): TreeNode | null {
  if (!hasAttributeFilters(filters)) return node;

  const filteredChildren = node.children
    .map(child => filterTree(child, filters, depth + 1))
    .filter(Boolean) as TreeNode[];

  const matches = matchesAttributeFilters(node, filters);

  // Pin MD (depth 0) and specific Level 1 directors (depth 1)
  const isPinned = (depth === 0) || (depth === 1 && isPinnedLevel1(node.name));

  if (matches || filteredChildren.length > 0 || isPinned) {
    return { ...node, children: filteredChildren };
  }

  return null;
}

/**
 * Recursively search a tree node for descendants matching the selectedNames.
 * Returns a pruned copy of the subtree keeping only the paths to matched nodes,
 * preserving their full subtrees below the match.
 * Always preserves the top 2 levels (Root and Level 1 directors) regardless of match.
 */
export function pruneSubtree(node: TreeNode, selectedNames: string[], depth = 0): TreeNode | null {
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

  if (depth === 1 && isPinnedLevel1(node.name)) {
    return { ...node, children: prunedChildren };
  }

  // For deeper nodes, only keep them if they lead to a match
  if (prunedChildren.length > 0) {
    return { ...node, children: prunedChildren };
  }

  return null;
}
