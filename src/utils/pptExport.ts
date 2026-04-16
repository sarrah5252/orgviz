import pptxgen from 'pptxgenjs';
import type { SavedChart } from '../types';

// ─── Badri Brand Colors ──────────────────────────────────────
const BRAND_BLUE = '135C8B';
const BRAND_GOLD = 'C48A28';
const BRAND_LIGHT_BLUE = '1A7AB5';
const BRAND_DARK = '0B3D5B';
const TEXT_DARK = '1A1A1A';
const TEXT_MEDIUM = '4A4A4A';
const TEXT_LIGHT = '7A7A7A';
const BG_LIGHT = 'F5F7FA';

export async function generateDeck(charts: SavedChart[]) {
  if (!charts || charts.length === 0) {
    alert("No saved charts available to export. Please save at least one chart first.");
    return;
  }

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';

  // Use the most recent/main chart (index 0) for holistic numbers
  const mainChart = charts[0];
  const mainEmployees = mainChart.employees;
  const totalEmployees = mainEmployees.length;
  
  const currentDate = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // ─── Helper: Add branded header bar to a slide ────────────────
  function addHeaderBar(slide: any, title: string) {
    // Top brand bar — gradient effect via two overlapping shapes
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 0.08,
      fill: { color: BRAND_GOLD }
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0.08, w: '100%', h: 0.65,
      fill: { color: BRAND_BLUE }
    });
    // Title text in the header
    slide.addText(title, {
      x: 0.5, y: 0.10, w: 9, h: 0.55,
      fontFace: 'Calibri', fontSize: 22, color: 'FFFFFF',
      bold: true, valign: 'middle'
    });
    // Bottom accent line
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0.73, w: '100%', h: 0.04,
      fill: { color: BRAND_GOLD }
    });
  }

  // ─── Helper: Add footer to a slide ────────────────────────────
  function addFooter(slide: any) {
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 5.36, w: '100%', h: 0.02,
      fill: { color: BRAND_GOLD }
    });
    slide.addText(`Badri Management Consultancy — ${currentMonth}`, {
      x: 0.5, y: 5.38, w: 9, h: 0.3,
      fontFace: 'Calibri', fontSize: 9, color: TEXT_LIGHT,
      italic: true
    });
  }

  // ─── 1. Title Slide ───────────────────────────────────────────
  const titleSlide = pres.addSlide();
  
  // Full page brand background
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: '100%',
    fill: { color: BRAND_BLUE }
  });
  // Decorative gold accent bar
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.12,
    fill: { color: BRAND_GOLD }
  });
  // Decorative bottom accent
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0, y: 5.20, w: '100%', h: 0.06,
    fill: { color: BRAND_GOLD }
  });
  // Company name
  titleSlide.addText("BADRI MANAGEMENT CONSULTANCY", {
    x: 0, y: 1.2, w: '100%', h: 0.6,
    fontFace: 'Calibri', fontSize: 16, color: BRAND_GOLD,
    bold: true, align: 'center', charSpacing: 6
  });
  // Main title
  titleSlide.addText("Organogram", {
    x: 0, y: 1.8, w: '100%', h: 1.2,
    fontFace: 'Calibri', fontSize: 48, color: 'FFFFFF',
    bold: true, align: 'center'
  });
  // Decorative line under title
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 3.5, y: 3.0, w: 3, h: 0.04,
    fill: { color: BRAND_GOLD }
  });
  // Employee count
  titleSlide.addText(`Total Employees: ${totalEmployees}`, {
    x: 0, y: 3.3, w: '100%', h: 0.5,
    fontFace: 'Calibri', fontSize: 20, align: 'center', color: 'FFFFFF',
    bold: true
  });
  titleSlide.addText(`Prepared in ${currentMonth}`, {
    x: 0, y: 3.9, w: '100%', h: 0.5,
    fontFace: 'Calibri', fontSize: 14, align: 'center', color: 'B0C6D8'
  });

  // ─── 2. Experience Summary Slide ────────────────────────────────
  const summarySlide = pres.addSlide();
  summarySlide.bkgd = BG_LIGHT;

  addHeaderBar(summarySlide, "Employee Experience Summary");
  addFooter(summarySlide);

  const expCounts: Record<string, number> = {
    '< 2 years': 0,
    '2-4 years': 0,
    '4-8 years': 0,
    '8-16 years': 0,
    '16+ years': 0,
    'Unknown': 0
  };

  mainEmployees.forEach(emp => {
    const y = emp.yearsOfExperience;
    if (y === undefined || y === null || typeof y !== 'number' || isNaN(y)) {
      expCounts['Unknown']++;
    } else if (y < 2) expCounts['< 2 years']++;
    else if (y < 4) expCounts['2-4 years']++;
    else if (y < 8) expCounts['4-8 years']++;
    else if (y < 16) expCounts['8-16 years']++;
    else expCounts['16+ years']++;
  });

  // Build professional table
  const tableData: any[][] = [
    [
      { text: "Experience Range", options: { bold: true, fill: BRAND_BLUE, color: 'FFFFFF', fontFace: 'Calibri', fontSize: 14, align: 'center', valign: 'middle' } }, 
      { text: "No. of Employees", options: { bold: true, fill: BRAND_BLUE, color: 'FFFFFF', fontFace: 'Calibri', fontSize: 14, align: 'center', valign: 'middle' } },
      { text: "Percentage", options: { bold: true, fill: BRAND_BLUE, color: 'FFFFFF', fontFace: 'Calibri', fontSize: 14, align: 'center', valign: 'middle' } }
    ]
  ];
  
  const expColors: Record<string, string> = {
    '< 2 years': '22c55e',
    '2-4 years': 'f97316',
    '4-8 years': '38bdf8',
    '8-16 years': 'eab308',
    '16+ years': 'a855f7',
    'Unknown': 'cccccc'
  };

  let rowIdx = 0;
  Object.entries(expCounts).forEach(([range, count]) => {
    if (count > 0 || range !== 'Unknown') {
      const pct = totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(1) + '%' : '0%';
      const rowFill = rowIdx % 2 === 0 ? 'FFFFFF' : 'EEF2F7';
      tableData.push([
        { text: `  ● ${range}`, options: { fontFace: 'Calibri', fontSize: 13, color: expColors[range] || TEXT_DARK, fill: rowFill, bold: true, align: 'left', valign: 'middle' } },
        { text: count.toString(), options: { fontFace: 'Calibri', fontSize: 13, color: TEXT_DARK, fill: rowFill, bold: true, align: 'center', valign: 'middle' } },
        { text: pct, options: { fontFace: 'Calibri', fontSize: 13, color: TEXT_MEDIUM, fill: rowFill, align: 'center', valign: 'middle' } }
      ] as any);
      rowIdx++;
    }
  });

  summarySlide.addTable(tableData, {
    x: 1.5, y: 1.2, w: 7, rowH: 0.45,
    colW: [3, 2, 2],
    fontFace: 'Calibri', fontSize: 13,
    border: { pt: 0.5, color: 'D0D5DD' },
    align: 'center', valign: 'middle'
  });

  // ─── 3. Slides for Each Chart ───────────────────────────────────

  const EXP_LEGEND = [
    { color: '22c55e', label: '< 2 years' },
    { color: 'f97316', label: '2 – 4 years' },
    { color: '38bdf8', label: '4 – 8 years' },
    { color: 'eab308', label: '8 – 16 years' },
    { color: 'a855f7', label: '16+ years' },
  ];

  charts.forEach((chart) => {
    const slide = pres.addSlide();
    slide.bkgd = BG_LIGHT;

    addHeaderBar(slide, chart.title);
    addFooter(slide);

    // Chart Image — use maximum space while leaving room for legend box
    if (chart.imageData) {
      slide.addImage({
        data: chart.imageData,
        x: 0.3, y: 0.95, w: 7.8, h: 4.2,
        sizing: { type: 'contain', w: 7.8, h: 4.2 }
      });
    } else {
      slide.addText("(Image not available. Ensure you saved this chart from the active view.)", {
        x: 0.5, y: 2.5, w: 9, h: 1, align: 'center', color: 'ff0000', fontSize: 14, fontFace: 'Calibri'
      });
    }

    // ─── Experience Legend Box (top right corner) ──────────────
    const LEGEND_X = 8.4;
    const LEGEND_Y = 1.0;
    const LEGEND_W = 1.4;
    const LEGEND_ITEM_H = 0.28;
    const LEGEND_HEADER_H = 0.35;
    const LEGEND_H = LEGEND_HEADER_H + (EXP_LEGEND.length * LEGEND_ITEM_H) + 0.15;

    // Legend container background
    slide.addShape(pres.ShapeType.rect, {
      x: LEGEND_X, y: LEGEND_Y, w: LEGEND_W, h: LEGEND_H,
      fill: { color: 'FFFFFF' },
      line: { color: 'D0D5DD', width: 0.75 },
      rectRadius: 0.08,
      shadow: { type: 'outer', blur: 4, offset: 2, color: '00000020' }
    });

    // Legend header
    slide.addShape(pres.ShapeType.rect, {
      x: LEGEND_X, y: LEGEND_Y, w: LEGEND_W, h: LEGEND_HEADER_H,
      fill: { color: BRAND_DARK },
      rectRadius: 0.08
    });
    // Cover bottom corners of the header to make only top rounded
    slide.addShape(pres.ShapeType.rect, {
      x: LEGEND_X, y: LEGEND_Y + 0.15, w: LEGEND_W, h: LEGEND_HEADER_H - 0.15,
      fill: { color: BRAND_DARK }
    });

    slide.addText("Experience", {
      x: LEGEND_X, y: LEGEND_Y + 0.02, w: LEGEND_W, h: LEGEND_HEADER_H - 0.04,
      fontFace: 'Calibri', fontSize: 9, color: 'FFFFFF',
      bold: true, align: 'center', valign: 'middle'
    });

    // Legend items
    EXP_LEGEND.forEach((item, idx) => {
      const itemY = LEGEND_Y + LEGEND_HEADER_H + 0.08 + (idx * LEGEND_ITEM_H);

      // Color indicator square
      slide.addShape(pres.ShapeType.rect, {
        x: LEGEND_X + 0.1, y: itemY + 0.04, w: 0.18, h: 0.15,
        fill: { color: 'FFFFFF' },
        line: { color: item.color, width: 2.5 },
        rectRadius: 0.03
      });

      // Label
      slide.addText(item.label, {
        x: LEGEND_X + 0.32, y: itemY, w: 1.0, h: 0.24,
        fontFace: 'Calibri', fontSize: 8, color: TEXT_DARK,
        bold: true, valign: 'middle'
      });
    });
  });

  // Trigger browser download
  await pres.writeFile({ fileName: `Organogram_Badri_${currentMonth.replace(' ', '_')}.pptx` });
}
