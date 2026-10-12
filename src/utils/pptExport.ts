import pptxgen from 'pptxgenjs';
import type { SavedChart, Employee, TreeNode, FilterState } from '../types';
import { EXP_LEGEND, getExpRange } from './constants';
import { buildOrgSlides, fitScale, type OrgSlideLayout } from './orgSlideLayout';

// ─── Badri Brand Colors ──────────────────────────────────────
const BRAND_BLUE = '135C8B';
const BRAND_GOLD = 'C48A28';
const TEXT_DARK = '1A1A1A';
const TEXT_MEDIUM = '4A4A4A';
const TEXT_LIGHT = '7A7A7A';
const BG_LIGHT = 'F5F7FA';

const EXP_COLORS: Record<string, string> = {
  '< 2 years': '388E3C',
  '2-4 years': '1E88E5',
  '4-8 years': 'FF9800',
  '8-16 years': '8E24AA',
  '16+ years': 'E53935',
  'Unknown': 'CCCCCC',
};

// ─── Shared Helpers ─────────────────────────────────────────

function getCurrentMonth(): string {
  const d = new Date();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function addHeaderBar(pres: pptxgen, slide: pptxgen.Slide, title: string) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.68,
    fill: { color: BRAND_BLUE }
  });
  slide.addText(title, {
    x: 0.5, y: 0.06, w: 9, h: 0.56,
    fontFace: 'Calibri', fontSize: 22, color: 'FFFFFF',
    bold: true, valign: 'middle'
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0.68, w: '100%', h: 0.03,
    fill: { color: BRAND_GOLD }
  });
}

function addFooter(pres: pptxgen, slide: pptxgen.Slide, currentMonth: string, textWidth = 9) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 5.36, w: '100%', h: 0.02,
    fill: { color: BRAND_GOLD }
  });
  slide.addText(`Badri Consultancy — ${currentMonth}`, {
    x: 0.5, y: 5.38, w: textWidth, h: 0.3,
    fontFace: 'Calibri', fontSize: 9, color: TEXT_LIGHT,
    italic: true
  });
}

function addTitleSlide(
  pres: pptxgen,
  totalEmployees: number,
  currentMonth: string,
  options?: { subtitle?: string; subtitleFontSize?: number; subtitleColor?: string; subtitleHeight?: number; preparedY?: number }
) {
  const slide = pres.addSlide();
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: '100%',
    fill: { color: BRAND_BLUE }
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.12,
    fill: { color: BRAND_GOLD }
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 5.20, w: '100%', h: 0.06,
    fill: { color: BRAND_GOLD }
  });
  slide.addText("BADRI MANAGEMENT CONSULTANCY", {
    x: 0, y: 1.2, w: '100%', h: 0.6,
    fontFace: 'Calibri', fontSize: 16, color: BRAND_GOLD,
    bold: true, align: 'center', charSpacing: 6
  });
  slide.addText("Organogram", {
    x: 0, y: 1.8, w: '100%', h: 1.2,
    fontFace: 'Calibri', fontSize: 48, color: 'FFFFFF',
    bold: true, align: 'center'
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 3.5, y: 3.0, w: 3, h: 0.04,
    fill: { color: BRAND_GOLD }
  });
  slide.addText(options?.subtitle || `Total Employees: ${totalEmployees}`, {
    x: 0, y: 3.3, w: '100%', h: options?.subtitleHeight || 0.5,
    fontFace: 'Calibri', fontSize: options?.subtitleFontSize || 20,
    align: 'center', color: options?.subtitleColor || 'FFFFFF',
    bold: true
  });
  slide.addText(`Prepared in ${currentMonth}`, {
    x: 0, y: options?.preparedY || 3.9, w: '100%', h: 0.5,
    fontFace: 'Calibri', fontSize: 14, align: 'center', color: 'B0C6D8'
  });
}

function computeExpCounts(employees: Employee[]): Record<string, number> {
  const expCounts: Record<string, number> = {
    '< 2 years': 0, '2-4 years': 0, '4-8 years': 0,
    '8-16 years': 0, '16+ years': 0, 'Unknown': 0
  };

  employees.forEach(emp => {
    const y = emp.yearsOfExperience;
    if (y === undefined || y === null || typeof y !== 'number' || isNaN(y)) {
      expCounts['Unknown']++;
    } else if (y < 2) expCounts['< 2 years']++;
    else if (y < 4) expCounts['2-4 years']++;
    else if (y < 8) expCounts['4-8 years']++;
    else if (y < 16) expCounts['8-16 years']++;
    else expCounts['16+ years']++;
  });

  return expCounts;
}

function addExperienceSummarySlide(pres: pptxgen, employees: Employee[], currentMonth: string) {
  const slide = pres.addSlide();
  slide.bkgd = BG_LIGHT;
  addHeaderBar(pres, slide, "Employee Experience Summary");
  addFooter(pres, slide, currentMonth);

  const expCounts = computeExpCounts(employees);
  const totalEmployees = employees.length;

  const tableData: any[][] = [
    [
      { text: "Experience Range", options: { bold: true, fill: BRAND_BLUE, color: 'FFFFFF', fontFace: 'Calibri', fontSize: 14, align: 'center', valign: 'middle' } },
      { text: "No. of Employees", options: { bold: true, fill: BRAND_BLUE, color: 'FFFFFF', fontFace: 'Calibri', fontSize: 14, align: 'center', valign: 'middle' } },
      { text: "Percentage", options: { bold: true, fill: BRAND_BLUE, color: 'FFFFFF', fontFace: 'Calibri', fontSize: 14, align: 'center', valign: 'middle' } }
    ]
  ];

  let rowIdx = 0;
  Object.entries(expCounts).forEach(([range, count]) => {
    if (count > 0 || range !== 'Unknown') {
      const pct = totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(1) + '%' : '0%';
      const rowFill = rowIdx % 2 === 0 ? 'FFFFFF' : 'EEF2F7';
      tableData.push([
        { text: `  ● ${range}`, options: { fontFace: 'Calibri', fontSize: 13, color: EXP_COLORS[range] || TEXT_DARK, fill: rowFill, bold: true, align: 'left', valign: 'middle' } },
        { text: count.toString(), options: { fontFace: 'Calibri', fontSize: 13, color: TEXT_DARK, fill: rowFill, bold: true, align: 'center', valign: 'middle' } },
        { text: pct, options: { fontFace: 'Calibri', fontSize: 13, color: TEXT_MEDIUM, fill: rowFill, align: 'center', valign: 'middle' } }
      ] as any);
      rowIdx++;
    }
  });

  slide.addTable(tableData, {
    x: 1.5, y: 1.2, w: 7, rowH: 0.45,
    colW: [3, 2, 2],
    fontFace: 'Calibri', fontSize: 13,
    border: { pt: 0.5, color: 'D0D5DD' },
    align: 'center', valign: 'middle'
  });
}

function addExperienceLegend(pres: pptxgen, slide: pptxgen.Slide) {
  const LEGEND_Y = 4.95;
  const START_X = 1.8;
  const ITEM_W = 1.35;

  slide.addText("Experience:", {
    x: 0.5, y: LEGEND_Y, w: 1.2, h: 0.25,
    fontFace: 'Calibri', fontSize: 10, color: TEXT_DARK,
    bold: true, valign: 'middle'
  });

  EXP_LEGEND.forEach((item, idx) => {
    const itemX = START_X + (idx * ITEM_W);

    slide.addShape(pres.ShapeType.rect, {
      x: itemX, y: LEGEND_Y + 0.05, w: 0.16, h: 0.13,
      fill: { color: item.hexColor },
      rectRadius: 0.03
    });

    slide.addText(item.label, {
      x: itemX + 0.22, y: LEGEND_Y, w: 1.0, h: 0.25,
      fontFace: 'Calibri', fontSize: 9, color: TEXT_MEDIUM,
      bold: true, valign: 'middle'
    });
  });
}

// ─── Headcount & Experience Distribution Slide ──────────────

function addHeadcountSlide(pres: pptxgen, employees: Employee[], currentMonth: string) {
  // Find MD/root name — employee whose managerId doesn't point to anyone in the list
  const idSet = new Set(employees.map(e => e.id));
  const root = employees.find(e => !e.managerId || !idSet.has(e.managerId));
  const mdName = root?.name || 'Managing Director';

  // Group by department
  const deptMap = new Map<string, Employee[]>();
  employees.forEach(emp => {
    const dept = emp.department || 'Other';
    if (!deptMap.has(dept)) deptMap.set(dept, []);
    deptMap.get(dept)!.push(emp);
  });

  // Sort by count descending
  const depts = [...deptMap.entries()].sort((a, b) => b[1].length - a[1].length);
  const maxCount = Math.max(...depts.map(d => d[1].length));

  const EXP_RANGES = ['< 2 years', '2-4 years', '4-8 years', '8-16 years', '16+ years'];

  // ─── Layout constants ─────────────────────────────────────
  const COL_DEPT_X = 0.3;
  const COL_DEPT_W = 2.0;
  const COL_COUNT_X = 2.3;
  const COL_COUNT_W = 0.5;
  const BAR_X = 2.9;
  const BAR_MAX_W = 6.6;

  const HEADER_Y = 0.88;
  const HEADER_H = 0.25;
  const ROWS_START_Y = 1.18;
  const LEGEND_Y_LIMIT = 4.88;  // rows must end before here
  const ROW_AREA = LEGEND_Y_LIMIT - ROWS_START_Y;

  // Paginate: max rows per slide
  const MAX_ROW_H = 0.30;
  const MIN_ROW_H = 0.18;
  const maxRowsPerSlide = Math.floor(ROW_AREA / MIN_ROW_H);

  // Split departments into pages
  const pages: [string, Employee[]][][] = [];
  for (let i = 0; i < depts.length; i += maxRowsPerSlide) {
    pages.push(depts.slice(i, i + maxRowsPerSlide));
  }

  pages.forEach((pageDepts, pageIdx) => {
    const slide = pres.addSlide();
    slide.bkgd = BG_LIGHT;

    const titleSuffix = pages.length > 1 ? ` (${pageIdx + 1}/${pages.length})` : '';
    addHeaderBar(pres, slide, `Departments – Headcount & Experience Distribution${titleSuffix}`);
    addFooter(pres, slide, currentMonth);

    const numRows = pageDepts.length;
    const rowH = Math.min(MAX_ROW_H, ROW_AREA / numRows);
    const barH = Math.max(0.18, rowH * 0.78);

    // Column headers
    slide.addText('Department', {
      x: COL_DEPT_X, y: HEADER_Y, w: COL_DEPT_W, h: HEADER_H,
      fontFace: 'Calibri', fontSize: 9, color: TEXT_LIGHT, valign: 'middle'
    });
    slide.addText('n', {
      x: COL_COUNT_X, y: HEADER_Y, w: COL_COUNT_W, h: HEADER_H,
      fontFace: 'Calibri', fontSize: 9, color: TEXT_LIGHT, align: 'center', valign: 'middle'
    });
    slide.addText('Experience breakdown', {
      x: BAR_X, y: HEADER_Y, w: BAR_MAX_W, h: HEADER_H,
      fontFace: 'Calibri', fontSize: 9, color: TEXT_LIGHT, valign: 'middle'
    });

    // Separator line under headers
    slide.addShape(pres.ShapeType.rect, {
      x: COL_DEPT_X, y: HEADER_Y + HEADER_H, w: BAR_X + BAR_MAX_W - COL_DEPT_X, h: 0.01,
      fill: { color: 'D0D5DD' }
    });

    // ─── Rows ───────────────────────────────────────────────
    pageDepts.forEach(([deptName, deptEmps], idx) => {
      const y = ROWS_START_Y + idx * rowH;
      const barY = y + (rowH - barH) / 2;

      // Alternating row background
      if (idx % 2 === 1) {
        slide.addShape(pres.ShapeType.rect, {
          x: COL_DEPT_X - 0.1, y, w: BAR_X + BAR_MAX_W - COL_DEPT_X + 0.2, h: rowH,
          fill: { color: 'EEF2F7' }
        });
      }

      // Department name
      slide.addText(deptName, {
        x: COL_DEPT_X, y, w: COL_DEPT_W, h: rowH,
        fontFace: 'Calibri', fontSize: 10, color: TEXT_DARK, valign: 'middle', bold: true
      });

      // Count
      slide.addText(deptEmps.length.toString(), {
        x: COL_COUNT_X, y, w: COL_COUNT_W, h: rowH,
        fontFace: 'Calibri', fontSize: 11, color: TEXT_DARK, align: 'center', valign: 'middle', bold: true
      });

      // ─── Stacked bar segments ──────────────────────────────
      // Collect all active experience segments for this department
      const activeSegments: { count: number; color: string; textColor: string }[] = [];

      EXP_RANGES.forEach(range => {
        const count = deptEmps.filter(e => getExpRange(e.yearsOfExperience) === range).length;
        if (count > 0) {
          activeSegments.push({ count, color: EXP_COLORS[range] || 'CCCCCC', textColor: 'FFFFFF' });
        }
      });

      const unknownCount = deptEmps.filter(e => getExpRange(e.yearsOfExperience) === null).length;
      if (unknownCount > 0) {
        activeSegments.push({ count: unknownCount, color: 'CCCCCC', textColor: '444444' });
      }

      // Calculate raw widths using monotonic formula
      const rawWidths = activeSegments.map(seg => 0.18 + (seg.count * 0.035) + ((seg.count / maxCount) * 3.5));
      const totalRawW = rawWidths.reduce((a, b) => a + b, 0);

      // Capping & Proportional Scaling: strictly bound total bar length to BAR_MAX_W
      const scale = totalRawW > BAR_MAX_W ? BAR_MAX_W / totalRawW : 1.0;

      let barOffset = 0;
      activeSegments.forEach((seg, i) => {
        const segW = rawWidths[i] * scale;

        slide.addShape(pres.ShapeType.rect, {
          x: BAR_X + barOffset, y: barY, w: segW, h: barH,
          fill: { color: seg.color }
        });

        // Always display count number clearly inside the segment
        const fontSize = segW < 0.28 ? 7.5 : 9;
        slide.addText(seg.count.toString(), {
          x: BAR_X + barOffset, y: barY, w: segW, h: barH,
          fontFace: 'Calibri', fontSize, color: seg.textColor,
          align: 'center', valign: 'middle', bold: true, margin: 0
        });

        barOffset += segW;
      });
    });

    // Legend at bottom
    addExperienceLegend(pres, slide);
  });
}

// ─── Native Org Chart Slides ───────────────────────────────────

const CHART_AREA = { x: 0.3, y: 0.92, w: 9.4, h: 4.36 };
const CARD_TEXT_DARK = '1F2937';
const CARD_TEXT_SUB = '4B6584';
const CARD_TEXT_META = '6B7280';
const CONNECTOR_COLOR = '9AA5B1';
const GROUP_FILL = 'ECEFF4';
const GROUP_LINE = 'C3CAD5';
const LINK_DASH_COLOR = '6B7280';

/** Legend on the footer row: "Experience: ■ < 2 yrs …  ⬚ Reports-to link" (right-aligned) */
function addChartLegendFooter(pres: pptxgen, slide: pptxgen.Slide) {
  const Y = 5.4;
  const H = 0.24;
  const FONT = 8;
  const SW = 0.13; // swatch size
  const labelW = (t: string) => t.length * FONT * 0.5 / 72 + 0.08;

  const items = EXP_LEGEND.map(i => ({ color: i.hexColor, label: i.label, w: SW + 0.05 + labelW(i.label) + 0.1 }));
  const linkLabel = 'Reports-to link';
  const linkW = SW + 0.05 + labelW(linkLabel);
  const headW = 0.72;
  const total = headW + items.reduce((s, i) => s + i.w, 0) + 0.1 + linkW;
  let x = 9.75 - total;

  slide.addText('Experience:', {
    x, y: Y, w: headW, h: H, fontFace: 'Calibri', fontSize: FONT, bold: true,
    color: TEXT_DARK, valign: 'middle', margin: 0,
  });
  x += headW;

  items.forEach(item => {
    slide.addShape(pres.ShapeType.rect, {
      x, y: Y + (H - SW) / 2, w: SW, h: SW, fill: { color: item.color }, line: { color: item.color, width: 0.5 },
    });
    slide.addText(item.label, {
      x: x + SW + 0.05, y: Y, w: item.w - SW - 0.05, h: H, fontFace: 'Calibri', fontSize: FONT,
      color: TEXT_MEDIUM, bold: true, valign: 'middle', margin: 0,
    });
    x += item.w;
  });

  x += 0.1;
  slide.addShape(pres.ShapeType.rect, {
    x, y: Y + (H - SW) / 2, w: SW, h: SW, fill: { color: 'FFFFFF' },
    line: { color: LINK_DASH_COLOR, width: 0.75, dashType: 'dash' },
  });
  slide.addText(linkLabel, {
    x: x + SW + 0.05, y: Y, w: linkW - SW - 0.05, h: H, fontFace: 'Calibri', fontSize: FONT,
    color: TEXT_MEDIUM, bold: true, valign: 'middle', margin: 0,
  });
}

/** Draws a computed org layout as editable PowerPoint shapes inside CHART_AREA. */
function renderOrgLayout(pres: pptxgen, slide: pptxgen.Slide, layout: OrgSlideLayout) {
  const s = fitScale(layout, CHART_AREA.w, CHART_AREA.h);
  const ox = CHART_AREA.x + (CHART_AREA.w - layout.width * s) / 2;
  const oy = CHART_AREA.y + Math.max(0, (CHART_AREA.h - layout.height * s) / 2) * 0.35; // slightly top-weighted
  const X = (v: number) => ox + v * s;
  const Y = (v: number) => oy + v * s;
  const pt = (v: number) => Math.max(3.8, Math.round(v * s * 10) / 10);

  // 1. Group boxes (Management)
  layout.groups.forEach(g => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: X(g.x), y: Y(g.y), w: g.w * s, h: g.h * s,
      fill: { color: 'F4F6F9' }, line: { color: 'B0B8C4', width: 0.75, dashType: 'dash' },
      rectRadius: 0.06 * s,
    });
    slide.addText(g.label, {
      x: X(g.x), y: Y(g.y - g.labelH), w: Math.max(g.w * s, 1), h: g.labelH * s,
      fontFace: 'Calibri', fontSize: pt(layout.fonts.label), bold: true, color: '7A869A',
      valign: 'bottom', margin: 0, charSpacing: 0.5,
    });
  });

  // 2. Connectors (drawn before cards so they sit underneath)
  layout.lines.forEach(l => {
    slide.addShape(pres.ShapeType.line, {
      x: X(Math.min(l.x1, l.x2)), y: Y(Math.min(l.y1, l.y2)),
      w: Math.abs(l.x2 - l.x1) * s, h: Math.abs(l.y2 - l.y1) * s,
      line: { color: CONNECTOR_COLOR, width: 0.75 },
    });
  });

  // 3. Employee cards (one editable shape each)
  const borderW = s < 0.75 ? 1.25 : 1.75;
  layout.cards.forEach(c => {
    const runs: pptxgen.TextProps[] = [
      { text: c.name, options: { bold: true, fontSize: pt(layout.fonts.name), color: CARD_TEXT_DARK, breakLine: true } },
      { text: c.title || ' ', options: { fontSize: pt(layout.fonts.title), color: CARD_TEXT_SUB, breakLine: true } },
      { text: c.meta || ' ', options: { fontSize: pt(layout.fonts.meta), color: CARD_TEXT_META } },
    ];
    slide.addText(runs, {
      shape: pres.ShapeType.roundRect,
      x: X(c.x), y: Y(c.y), w: c.w * s, h: c.h * s,
      fill: { color: 'FFFFFF' },
      line: { color: c.borderColor, width: borderW, dashType: c.dashed ? 'dash' : 'solid' },
      rectRadius: 0.05 * s,
      fontFace: 'Calibri',
      valign: 'top', align: 'left',
      margin: Math.max(2, 5.5 * s),
      lineSpacingMultiple: 0.95,
      paraSpaceAfter: 0,
    });
  });
}

function addOrgChartSlides(
  pres: pptxgen,
  title: string,
  tree: TreeNode,
  filters: FilterState | undefined,
  showExperienceLegend: boolean,
  currentMonth: string,
) {
  const pages = buildOrgSlides(tree, filters, CHART_AREA.w, CHART_AREA.h);
  if (pages.length === 0) {
    const slide = pres.addSlide();
    slide.bkgd = BG_LIGHT;
    addHeaderBar(pres, slide, title);
    addFooter(pres, slide, currentMonth);
    slide.addText('(No employees match this view)', {
      x: 0.5, y: 2.5, w: 9, h: 1, align: 'center', color: TEXT_LIGHT, fontSize: 14, fontFace: 'Calibri'
    });
    return;
  }

  pages.forEach(page => {
    const slide = pres.addSlide();
    slide.bkgd = BG_LIGHT;
    const suffix = page.pageCount > 1 ? ` (${page.pageIndex + 1}/${page.pageCount})` : '';
    addHeaderBar(pres, slide, `${title}${suffix}`);
    addFooter(pres, slide, currentMonth, showExperienceLegend ? 3.2 : 9);
    renderOrgLayout(pres, slide, page.layout);
    if (showExperienceLegend) addChartLegendFooter(pres, slide);
  });
}

// ─── Public Exports ─────────────────────────────────────────

export type ProgressCallback = (info: { stage: string; percent: number; current?: number; total?: number; done?: boolean }) => void;

export async function generateDeck(
  charts: SavedChart[],
  showExperienceLegend: boolean = true,
  onProgress?: ProgressCallback,
) {
  if (!charts || charts.length === 0) {
    alert("No saved charts available to export. Please save at least one chart first.");
    return;
  }

  onProgress?.({ stage: 'Initializing PowerPoint deck...', percent: 10 });
  await new Promise(r => setTimeout(r, 40));

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';

  const mainEmployees = charts[0].employees;
  const currentMonth = getCurrentMonth();

  // 1. Title Slide
  onProgress?.({ stage: 'Creating title slide...', percent: 22 });
  addTitleSlide(pres, mainEmployees.length, currentMonth);
  await new Promise(r => setTimeout(r, 20));

  // 2. Experience Summary
  onProgress?.({ stage: 'Building experience breakdown...', percent: 36 });
  addExperienceSummarySlide(pres, mainEmployees, currentMonth);
  await new Promise(r => setTimeout(r, 20));

  // 3. Headcount & Experience Distribution
  onProgress?.({ stage: 'Generating headcount distribution...', percent: 48 });
  addHeadcountSlide(pres, mainEmployees, currentMonth);
  await new Promise(r => setTimeout(r, 20));

  // 4. Chart Slides (native shapes)
  const totalCharts = charts.length;
  for (let idx = 0; idx < totalCharts; idx++) {
    const chart = charts[idx];
    const pct = Math.round(50 + ((idx + 1) / totalCharts) * 40);
    onProgress?.({
      stage: `Formatting chart: ${chart.title}`,
      percent: pct,
      current: idx + 1,
      total: totalCharts,
    });
    await new Promise(r => setTimeout(r, 30));
    addOrgChartSlides(pres, chart.title, chart.tree, chart.activeFilters, showExperienceLegend, currentMonth);
  }

  // 5. Download
  onProgress?.({ stage: 'Packaging PowerPoint file (.pptx)...', percent: 94 });
  await new Promise(r => setTimeout(r, 40));
  await pres.writeFile({ fileName: 'Organogram_Badri.pptx' });
  onProgress?.({ stage: 'Presentation downloaded successfully!', percent: 100, done: true });
}

// ─── Batch Export: one PPT with all departments ─────────────
export async function generateBatchDeck(
  tree: TreeNode,
  allEmployees: Employee[],
  tasks: { title: string; filter: FilterState }[],
  showExperienceLegend: boolean = true,
  onProgress?: ProgressCallback,
) {
  if (!tasks || tasks.length === 0) {
    alert('No departments found to export.');
    return;
  }

  onProgress?.({ stage: 'Initializing department deck...', percent: 5 });
  await new Promise(r => setTimeout(r, 40));

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';

  const currentMonth = getCurrentMonth();

  // 1. Title Slide
  onProgress?.({ stage: 'Creating presentation title slide...', percent: 12 });
  addTitleSlide(pres, allEmployees.length, currentMonth, {
    subtitle: `${allEmployees.length} Employees`,
    subtitleFontSize: 16,
    subtitleColor: 'B0C6D8',
    subtitleHeight: 0.4,
    preparedY: 3.8,
  });
  await new Promise(r => setTimeout(r, 20));

  // 2. Experience Summary
  onProgress?.({ stage: 'Compiling experience summary...', percent: 20 });
  addExperienceSummarySlide(pres, allEmployees, currentMonth);
  await new Promise(r => setTimeout(r, 20));

  // 3. Headcount & Experience Distribution
  onProgress?.({ stage: 'Computing headcount distribution...', percent: 28 });
  addHeadcountSlide(pres, allEmployees, currentMonth);
  await new Promise(r => setTimeout(r, 20));

  // 4. Chart Slides (native shapes)
  const totalTasks = tasks.length;
  for (let idx = 0; idx < totalTasks; idx++) {
    const task = tasks[idx];
    const pct = Math.round(28 + ((idx + 1) / totalTasks) * 62);
    onProgress?.({
      stage: `Building slide: ${task.title}`,
      percent: pct,
      current: idx + 1,
      total: totalTasks,
    });
    await new Promise(r => setTimeout(r, 30));
    addOrgChartSlides(pres, task.title, tree, task.filter, showExperienceLegend, currentMonth);
  }

  // 5. Download
  onProgress?.({ stage: 'Packaging PowerPoint file (.pptx)...', percent: 94 });
  await new Promise(r => setTimeout(r, 40));
  await pres.writeFile({ fileName: 'Organogram_Departments_Badri.pptx' });
  onProgress?.({ stage: 'Presentation downloaded successfully!', percent: 100, done: true });
}
