/**
 * Org-chart layout for native PowerPoint slides.
 *
 * Produces positioned cards / connector lines / group boxes (in inches, at
 * scale 1) that pptExport.ts draws as editable PowerPoint shapes.
 *
 * Visual rules (matching the Badri reference deck):
 *  - "MANAGEMENT" box: Managing Director (Hatim Maskawala) first, followed by
 *    pinned directors (Ajmal Bhatty, Ali Bhuriwala) in a single row.
 *  - Beside mode: sits beside the single department head on the same row,
 *    placed on the side with room (right or left) without expanding total width.
 *  - Children with multiple branches are laid out horizontally with a bus connector.
 *  - Frontline teams & leaf reports (up to 5) are stacked in a single vertical column.
 *  - 6+ leaf reports are stacked in two columns around a central spine.
 *  - Card border colour = total experience band. Dashed border = reports-to link.
 *  - Every chart is guaranteed to fit on exactly one slide.
 */
import type { TreeNode, FilterState } from '../types';
import { getExpColor, PINNED_LEVEL1_NAMES } from './constants';
import {
  EMPTY_FILTERS, filterTree, pruneSubtree, hasAttributeFilters, matchesAttributeFilters,
} from './treeFilters';

// ─── Output types ───────────────────────────────────────────
export interface LayoutCard {
  id: string;
  name: string;
  title: string;
  meta: string;
  x: number; y: number; w: number; h: number;
  borderColor: string; // hex without '#'
  dashed: boolean;
}

export interface LayoutLine { x1: number; y1: number; x2: number; y2: number }

export interface LayoutGroup { x: number; y: number; w: number; h: number; label: string; labelH: number }

export interface OrgSlideLayout {
  cards: LayoutCard[];
  lines: LayoutLine[];
  groups: LayoutGroup[];
  width: number;
  height: number;
  /** Font sizes (pt) at scale 1 */
  fonts: { name: number; title: number; meta: number; label: number };
}

export interface OrgSlidePage {
  layout: OrgSlideLayout;
  pageIndex: number;
  pageCount: number;
}

// ─── Constants (inches at scale 1) ──────────────────────────
const FONT_NAME = 9;
const FONT_TITLE = 7.5;
const FONT_META = 7;
const FONT_LABEL = 6.5;
const LINE_FACTOR = 1.22;            // line height = pt * factor / 72
const CARD_PAD_X = 0.08;
const CARD_PAD_Y = 0.06;
const MIN_CARD_W = 1.30;
const MAX_CARD_W = 1.95;

const H_GAP = 0.15;                  // between sibling subtrees
const V_GAP = 0.28;                  // parent bottom → child top (horizontal layout)
const STACK_TOP = 0.18;              // parent bottom → first stacked card
const STACK_GAP = 0.08;              // between stacked cards
const STACK_INDENT = 0.18;           // single-column stack indent
const SPINE_GAP = 0.26;              // gap between the two stacked columns
const ROOTS_GAP = 0.28;              // between department heads
const MGMT_PAD = 0.08;
const MGMT_ROW_GAP = 0.10;
const MGMT_CARD_GAP = 0.10;
const MGMT_LABEL_H = 0.17;
const MGMT_BESIDE_GAP = 0.35;         // management box → single dept head

const UNKNOWN_EXP_COLOR = '9AA5B1';

// ─── Text measurement (approximate, Calibri) ────────────────
function textWidthIn(text: string, pt: number, bold = false): number {
  return text.length * pt * (bold ? 0.53 : 0.49) / 72;
}
function lineH(pt: number): number {
  return pt * LINE_FACTOR / 72;
}

function metaFor(node: TreeNode): string {
  const parts: string[] = [];
  if (node.id && node.id !== 'root') parts.push(`#${node.id}`);
  if (node.location) parts.push(node.location);
  return parts.join(' · ');
}

function borderColorFor(node: TreeNode): string {
  const c = getExpColor(node.yearsOfExperience);
  return c ? c.bg.replace('#', '').toUpperCase() : UNKNOWN_EXP_COLOR;
}

// ─── Model: which nodes, who is management, who is a member ──
interface ChartModel {
  md: TreeNode | null;
  pinned: TreeNode[];
  bodyRoots: TreeNode[];
  memberIds: Set<string>;
}

function buildModel(tree: TreeNode, filters: FilterState): ChartModel | null {
  const f: FilterState = { ...EMPTY_FILTERS, ...filters };
  let t = filterTree(tree, f);
  if (!t) return null;
  const selected = f.directReports || [];
  if (selected.length > 0) {
    t = pruneSubtree(t, selected);
    if (!t) return null;
  }

  // Membership: who actually belongs to this view (others = reports-to links)
  const attr = hasAttributeFilters(f);
  const dr = selected.length > 0;
  const memberIds = new Set<string>();
  const walk = (n: TreeNode, inSel: boolean) => {
    const sel = inSel || (dr && selected.includes(n.name));
    if ((!attr || matchesAttributeFilters(n, f)) && (!dr || sel)) memberIds.add(n.id);
    n.children.forEach(c => walk(c, sel));
  };
  walk(t, false);

  const isVirtualRoot = t.id === 'root';
  let md = isVirtualRoot ? null : t;
  const level1 = t.children;
  let pinned = PINNED_LEVEL1_NAMES
    .map(name => level1.find(c => c.name.trim().toLowerCase() === name.toLowerCase()))
    .filter(Boolean) as TreeNode[];

  // User requirement: Hatim Maskawala is on top/first in the Management box
  const hatimInLevel1 = level1.find(c => c.name.toLowerCase().includes('hatim'));
  if (hatimInLevel1 && (!md || !md.name.toLowerCase().includes('hatim'))) {
    if (md) pinned.unshift(md);
    md = hatimInLevel1;
    pinned = pinned.filter(p => p.id !== hatimInLevel1.id);
  }

  let bodyRoots: TreeNode[];
  if (!md && pinned.length === 0) {
    bodyRoots = level1;
  } else {
    bodyRoots = [
      ...level1.filter(c => c !== md && !pinned.includes(c)),
      ...pinned.flatMap(p => p.children),
    ];
  }

  return { md, pinned, bodyRoots, memberIds };
}

// ─── Card sizing ────────────────────────────────────────────
interface CardMetrics { w: number; h: number }

function collectNodes(model: ChartModel, roots: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = [];
  if (model.md) out.push(model.md);
  out.push(...model.pinned);
  const walk = (n: TreeNode) => { out.push(n); n.children.forEach(walk); };
  roots.forEach(walk);
  return out;
}

function computeCardMetrics(nodes: TreeNode[]): CardMetrics {
  let maxText = 0;
  nodes.forEach(n => {
    maxText = Math.max(
      maxText,
      textWidthIn(n.name, FONT_NAME, true),
      textWidthIn(n.title || '', FONT_TITLE),
      textWidthIn(metaFor(n), FONT_META),
    );
  });
  const w = Math.min(MAX_CARD_W, Math.max(MIN_CARD_W, maxText + CARD_PAD_X * 2 + 0.04));
  const inner = w - CARD_PAD_X * 2;

  // Height: allow for wrapped lines on the longest entries
  let maxLines = { name: 1, title: 1 };
  nodes.forEach(n => {
    maxLines.name = Math.max(maxLines.name, Math.ceil(textWidthIn(n.name, FONT_NAME, true) / inner) || 1);
    maxLines.title = Math.max(maxLines.title, Math.ceil(textWidthIn(n.title || '', FONT_TITLE) / inner) || 1);
  });
  maxLines.name = Math.min(maxLines.name, 2);
  maxLines.title = Math.min(maxLines.title, 2);

  const h = CARD_PAD_Y * 2
    + maxLines.name * lineH(FONT_NAME)
    + maxLines.title * lineH(FONT_TITLE)
    + lineH(FONT_META)
    + 0.02;
  return { w, h };
}

// ─── Block layout ───────────────────────────────────────────
interface Out { cards: LayoutCard[]; lines: LayoutLine[] }

interface Block {
  w: number;
  h: number;
  /** x of this block's top card centre, relative to block left */
  anchor: number;
  emit(ox: number, oy: number, out: Out): void;
}

function makeCard(node: TreeNode, x: number, y: number, m: CardMetrics, memberIds: Set<string>): LayoutCard {
  return {
    id: node.id,
    name: node.name,
    title: node.title || '',
    meta: metaFor(node),
    x, y, w: m.w, h: m.h,
    borderColor: borderColorFor(node),
    dashed: !memberIds.has(node.id),
  };
}

function line(out: Out, x1: number, y1: number, x2: number, y2: number) {
  if (Math.abs(x1 - x2) < 1e-6 && Math.abs(y1 - y2) < 1e-6) return;
  out.lines.push({ x1, y1, x2, y2 });
}

function layoutNode(node: TreeNode, m: CardMetrics, memberIds: Set<string>): Block {
  const kids = node.children;
  const W = m.w, H = m.h;

  // Leaf
  if (kids.length === 0) {
    return {
      w: W, h: H, anchor: W / 2,
      emit: (ox, oy, out) => { out.cards.push(makeCard(node, ox, oy, m, memberIds)); },
    };
  }

  const allLeaves = kids.every(k => k.children.length === 0);

  // Compact vertical single-column stack:
  // Used for:
  // 1. Teams where all direct children are leaves (1 to 5 members)
  // 2. Frontline teams where direct children have at most 1 child each (e.g. analyst + trainee) and team size <= 5
  const canSingleColumnStack = (
    (allLeaves && kids.length >= 1 && kids.length <= 5) ||
    (!allLeaves && kids.length <= 4 && kids.every(k => k.children.length <= 1))
  );

  if (canSingleColumnStack) {
    interface StackRow {
      node: TreeNode;
      indent: number;
      parentRowIndex: number;
    }
    const rows: StackRow[] = [];
    kids.forEach(k => {
      const pIdx = rows.length;
      rows.push({ node: k, indent: 1, parentRowIndex: -1 });
      if (k.children.length === 1) {
        rows.push({ node: k.children[0], indent: 2, parentRowIndex: pIdx });
      }
    });

    const maxIndent = Math.max(1, ...rows.map(r => r.indent));
    const spineX = STACK_INDENT / 2;
    const childY = (i: number) => H + STACK_TOP + i * (H + STACK_GAP);
    const directRows = rows.map((r, i) => ({ ...r, i })).filter(r => r.indent === 1);
    const lastDirectCenter = childY(directRows[directRows.length - 1].i) + H / 2;

    return {
      w: maxIndent * STACK_INDENT + W,
      h: childY(rows.length - 1) + H,
      anchor: W / 2,
      emit: (ox, oy, out) => {
        // Parent card
        out.cards.push(makeCard(node, ox, oy, m, memberIds));

        // Main spine from parent to all direct children
        line(out, ox + spineX, oy + H, ox + spineX, oy + lastDirectCenter);

        // Draw children and sub-spines
        rows.forEach((r, i) => {
          const cy = oy + childY(i);
          if (r.indent === 1) {
            line(out, ox + spineX, cy + H / 2, ox + STACK_INDENT, cy + H / 2);
            out.cards.push(makeCard(r.node, ox + STACK_INDENT, cy, m, memberIds));
          } else {
            // Sub-child under parentRowIndex (e.g. trainee under analyst)
            const pCy = oy + childY(r.parentRowIndex);
            const subSpineX = ox + STACK_INDENT + spineX;
            line(out, subSpineX, pCy + H, subSpineX, cy + H / 2);
            line(out, subSpineX, cy + H / 2, ox + 2 * STACK_INDENT, cy + H / 2);
            out.cards.push(makeCard(r.node, ox + 2 * STACK_INDENT, cy, m, memberIds));
          }
        });
      },
    };
  }

  // Two-column stack (6+ leaf reports)
  if (allLeaves && kids.length >= 6) {
    const spineX = W + SPINE_GAP / 2;
    const rows = Math.ceil(kids.length / 2);
    const rowY = (r: number) => H + STACK_TOP + r * (H + STACK_GAP);
    const lastCenter = rowY(rows - 1) + H / 2;
    return {
      w: 2 * W + SPINE_GAP,
      h: rowY(rows - 1) + H,
      anchor: spineX,
      emit: (ox, oy, out) => {
        out.cards.push(makeCard(node, ox + spineX - W / 2, oy, m, memberIds));
        line(out, ox + spineX, oy + H, ox + spineX, oy + lastCenter);
        kids.forEach((k, i) => {
          const col = i % 2;
          const r = Math.floor(i / 2);
          const cy = oy + rowY(r);
          const cx = col === 0 ? ox : ox + W + SPINE_GAP;
          const edgeX = col === 0 ? ox + W : ox + W + SPINE_GAP;
          line(out, ox + spineX, cy + H / 2, edgeX, cy + H / 2);
          out.cards.push(makeCard(k, cx, cy, m, memberIds));
        });
      },
    };
  }

  // Horizontal layout with bus connector
  const blocks = kids.map(k => layoutNode(k, m, memberIds));
  const offsets: number[] = [];
  let cursor = 0;
  blocks.forEach(b => { offsets.push(cursor); cursor += b.w + H_GAP; });
  const anchors = blocks.map((b, i) => offsets[i] + b.anchor);
  let anchor = (anchors[0] + anchors[anchors.length - 1]) / 2;
  const shift = Math.max(0, W / 2 - anchor);
  anchor += shift;
  const childrenRight = offsets[offsets.length - 1] + blocks[blocks.length - 1].w + shift;
  const width = Math.max(childrenRight, anchor + W / 2);
  const childTop = H + V_GAP;
  const busY = H + V_GAP / 2;
  const height = childTop + Math.max(...blocks.map(b => b.h));

  return {
    w: width, h: height, anchor,
    emit: (ox, oy, out) => {
      out.cards.push(makeCard(node, ox + anchor - W / 2, oy, m, memberIds));
      if (blocks.length === 1) {
        line(out, ox + anchor, oy + H, ox + anchor, oy + childTop);
      } else {
        line(out, ox + anchor, oy + H, ox + anchor, oy + busY);
        line(out, ox + anchors[0] + shift, oy + busY, ox + anchors[anchors.length - 1] + shift, oy + busY);
        anchors.forEach(a => line(out, ox + a + shift, oy + busY, ox + a + shift, oy + childTop));
      }
      blocks.forEach((b, i) => b.emit(ox + offsets[i] + shift, oy + childTop, out));
    },
  };
}

// ─── Full slide layout ──────────────────────────────────────
function layoutChart(model: ChartModel, roots: TreeNode[]): OrgSlideLayout {
  const m = computeCardMetrics(collectNodes(model, roots));
  const W = m.w, H = m.h;
  const out: Out = { cards: [], lines: [] };
  const groups: LayoutGroup[] = [];

  // Body: department heads side by side
  const rootBlocks = roots.map(r => layoutNode(r, m, model.memberIds));
  const rootOffsets: number[] = [];
  let cursor = 0;
  rootBlocks.forEach(b => { rootOffsets.push(cursor); cursor += b.w + ROOTS_GAP; });
  const rootAnchors = rootBlocks.map((b, i) => rootOffsets[i] + b.anchor);

  // Management box geometry: MD (Hatim) first, followed by pinned directors (Ajmal, Ali) in 1 row
  const hasMgmt = !!model.md || model.pinned.length > 0;
  const mgmtMembers: TreeNode[] = [];
  if (model.md) mgmtMembers.push(model.md);
  model.pinned.forEach(p => {
    if (!mgmtMembers.some(m => m.id === p.id)) mgmtMembers.push(p);
  });

  const boxW = mgmtMembers.length * W + Math.max(0, mgmtMembers.length - 1) * MGMT_CARD_GAP + MGMT_PAD * 2;
  const boxH = H + MGMT_PAD * 2;

  const emitMgmt = (bx: number, by: number) => {
    groups.push({ x: bx, y: by, w: boxW, h: boxH, label: 'MANAGEMENT', labelH: MGMT_LABEL_H });
    mgmtMembers.forEach((n, ci) => {
      out.cards.push(makeCard(n, bx + MGMT_PAD + ci * (W + MGMT_CARD_GAP), by + MGMT_PAD, m, model.memberIds));
    });
  };

  if (hasMgmt && roots.length === 1) {
    // Beside mode: place box on either the right or the left of the single department head,
    // aligned horizontally on the same row with the department head.
    const headLeft = rootOffsets[0] + rootBlocks[0].anchor - W / 2;
    const headRight = headLeft + W;
    const bodyTotalW = rootOffsets[0] + rootBlocks[0].w;
    const spaceOnRight = bodyTotalW - headRight;
    const spaceOnLeft = headLeft;

    const boxY = MGMT_LABEL_H;
    const bodyY = boxY + MGMT_PAD; // exactly aligns department head card top with management cards top

    let boxX: number;
    if (spaceOnRight >= boxW + MGMT_BESIDE_GAP || spaceOnRight >= spaceOnLeft) {
      // Place on right (matches Actuarial reference slide)
      boxX = headRight + MGMT_BESIDE_GAP;
      emitMgmt(boxX, boxY);
      rootBlocks[0].emit(rootOffsets[0], bodyY, out);
      line(out, headRight, bodyY + H / 2, boxX, bodyY + H / 2);
    } else {
      // Place on left (matches Financial Services reference slide)
      boxX = headLeft - MGMT_BESIDE_GAP - boxW;
      emitMgmt(boxX, boxY);
      rootBlocks[0].emit(rootOffsets[0], bodyY, out);
      line(out, boxX + boxW, bodyY + H / 2, headLeft, bodyY + H / 2);
    }
  } else if (hasMgmt && roots.length > 1) {
    // Above mode: box centred over the department heads, bus connector below.
    const center = (rootAnchors[0] + rootAnchors[rootAnchors.length - 1]) / 2;
    const boxX = center - boxW / 2;
    const boxY = MGMT_LABEL_H;
    const boxBottom = boxY + boxH;
    const busY = boxBottom + V_GAP / 2;
    const bodyY = boxBottom + V_GAP;
    emitMgmt(boxX, boxY);
    line(out, center, boxBottom, center, busY);
    line(out, rootAnchors[0], busY, rootAnchors[rootAnchors.length - 1], busY);
    rootAnchors.forEach(a => line(out, a, busY, a, bodyY));
    rootBlocks.forEach((b, i) => b.emit(rootOffsets[i], bodyY, out));
  } else if (hasMgmt) {
    emitMgmt(0, MGMT_LABEL_H);
  } else {
    rootBlocks.forEach((b, i) => b.emit(rootOffsets[i], 0, out));
  }

  // Normalise to origin
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const grow = (x1: number, y1: number, x2: number, y2: number) => {
    minX = Math.min(minX, x1); minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2); maxY = Math.max(maxY, y2);
  };
  out.cards.forEach(c => grow(c.x, c.y, c.x + c.w, c.y + c.h));
  out.lines.forEach(l => grow(Math.min(l.x1, l.x2), Math.min(l.y1, l.y2), Math.max(l.x1, l.x2), Math.max(l.y1, l.y2)));
  groups.forEach(g => grow(g.x, g.y - g.labelH, g.x + g.w, g.y + g.h));
  if (!isFinite(minX)) { minX = minY = 0; maxX = maxY = 1; }

  out.cards.forEach(c => { c.x -= minX; c.y -= minY; });
  out.lines.forEach(l => { l.x1 -= minX; l.x2 -= minX; l.y1 -= minY; l.y2 -= minY; });
  groups.forEach(g => { g.x -= minX; g.y -= minY; });

  return {
    cards: out.cards,
    lines: out.lines,
    groups,
    width: maxX - minX,
    height: maxY - minY,
    fonts: { name: FONT_NAME, title: FONT_TITLE, meta: FONT_META, label: FONT_LABEL },
  };
}

export function fitScale(layout: OrgSlideLayout, areaW: number, areaH: number, maxScale = 1.15): number {
  return Math.min(areaW / layout.width, areaH / layout.height, maxScale);
}

/**
 * Builds the slide layout for a chart. Every chart is guaranteed to fit on exactly one slide.
 */
export function buildOrgSlides(
  tree: TreeNode,
  filters: FilterState | undefined,
  _areaW?: number,
  _areaH?: number,
): OrgSlidePage[] {
  const model = buildModel(tree, filters || EMPTY_FILTERS);
  if (!model) return [];

  const full = layoutChart(model, model.bodyRoots);
  return [{ layout: full, pageIndex: 0, pageCount: 1 }];
}
