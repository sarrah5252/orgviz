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

export async function generateDeck(charts: SavedChart[], showExperienceLegend: boolean = true) {
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

    // Chart Image — maximize available space, adjust based on legend state
    const imgX = 0.15;
    const imgY = 0.85;
    const imgW = 9.7;
    const imgH = showExperienceLegend ? 4.0 : 4.45;

    if (chart.imageData) {
      slide.addImage({
        data: chart.imageData,
        x: imgX, y: imgY, w: imgW, h: imgH,
        sizing: { type: 'contain', w: imgW, h: imgH }
      });
    } else {
      slide.addText("(Image not available. Ensure you saved this chart from the active view.)", {
        x: 0.5, y: 2.5, w: 9, h: 1, align: 'center', color: 'ff0000', fontSize: 14, fontFace: 'Calibri'
      });
    }

    // ─── Horizontal Experience Legend (bottom of the slide) ──────────
    if (showExperienceLegend) {
      const LEGEND_Y = 4.95;
      const START_X = 1.8;
      const ITEM_W = 1.35;

      // Draw the "Experience:" label text
      slide.addText("Experience:", {
        x: 0.5, y: LEGEND_Y, w: 1.2, h: 0.25,
        fontFace: 'Calibri', fontSize: 10, color: TEXT_DARK,
        bold: true, valign: 'middle'
      });

      EXP_LEGEND.forEach((item, idx) => {
        const itemX = START_X + (idx * ITEM_W);

        // Color square indicator
        slide.addShape(pres.ShapeType.rect, {
          x: itemX, y: LEGEND_Y + 0.05, w: 0.16, h: 0.13,
          fill: { color: item.color },
          rectRadius: 0.03
        });

        // Label text
        slide.addText(item.label, {
          x: itemX + 0.22, y: LEGEND_Y, w: 1.0, h: 0.25,
          fontFace: 'Calibri', fontSize: 9, color: TEXT_MEDIUM,
          bold: true, valign: 'middle'
        });
      });
    }
  });

  // 4. Download using pptxgenjs built-in writeFile (reliable .pptx naming)
  await pres.writeFile({ fileName: 'Organogram_Badri.pptx' });
}

// ─── Batch Export: one PPT with all departments ─────────────
export async function generateBatchDeck(
  allEmployees: any[],
  slides: { title: string; imageData: string }[],
  showExperienceLegend: boolean = true
) {
  if (!slides || slides.length === 0) {
    alert('No department charts were captured. Please try again.');
    return;
  }

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';

  const totalEmployees = allEmployees.length;

  const currentDate = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // ─── Helpers ──────────────────────────────────────────────
  function addHeaderBar(slide: any, title: string) {
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 0.08,
      fill: { color: BRAND_GOLD }
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0.08, w: '100%', h: 0.65,
      fill: { color: BRAND_BLUE }
    });
    slide.addText(title, {
      x: 0.5, y: 0.10, w: 9, h: 0.55,
      fontFace: 'Calibri', fontSize: 22, color: 'FFFFFF',
      bold: true, valign: 'middle'
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0.73, w: '100%', h: 0.04,
      fill: { color: BRAND_GOLD }
    });
  }

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

  // ─── 1. Title Slide ───────────────────────────────────────
  const titleSlide = pres.addSlide();
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: '100%',
    fill: { color: BRAND_BLUE }
  });
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.12,
    fill: { color: BRAND_GOLD }
  });
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0, y: 5.20, w: '100%', h: 0.06,
    fill: { color: BRAND_GOLD }
  });
  titleSlide.addText("BADRI MANAGEMENT CONSULTANCY", {
    x: 0, y: 1.2, w: '100%', h: 0.6,
    fontFace: 'Calibri', fontSize: 16, color: BRAND_GOLD,
    bold: true, align: 'center', charSpacing: 6
  });
  titleSlide.addText("Organogram", {
    x: 0, y: 1.8, w: '100%', h: 1.2,
    fontFace: 'Calibri', fontSize: 48, color: 'FFFFFF',
    bold: true, align: 'center'
  });
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 3.5, y: 3.0, w: 3, h: 0.04,
    fill: { color: BRAND_GOLD }
  });
  titleSlide.addText(`${totalEmployees} Employees`, {
    x: 0, y: 3.3, w: '100%', h: 0.4,
    fontFace: 'Calibri', fontSize: 16, align: 'center', color: 'B0C6D8',
    bold: true
  });
  titleSlide.addText(`Prepared in ${currentMonth}`, {
    x: 0, y: 3.8, w: '100%', h: 0.5,
    fontFace: 'Calibri', fontSize: 14, align: 'center', color: 'B0C6D8'
  });

  // ─── 2. Experience Summary Slide ──────────────────────────
  const summarySlide = pres.addSlide();
  summarySlide.bkgd = BG_LIGHT;
  addHeaderBar(summarySlide, "Employee Experience Summary");
  addFooter(summarySlide);

  const expCounts: Record<string, number> = {
    '< 2 years': 0, '2-4 years': 0, '4-8 years': 0,
    '8-16 years': 0, '16+ years': 0, 'Unknown': 0
  };
  allEmployees.forEach(emp => {
    const y = emp.yearsOfExperience;
    if (y === undefined || y === null || typeof y !== 'number' || isNaN(y)) {
      expCounts['Unknown']++;
    } else if (y < 2) expCounts['< 2 years']++;
    else if (y < 4) expCounts['2-4 years']++;
    else if (y < 8) expCounts['4-8 years']++;
    else if (y < 16) expCounts['8-16 years']++;
    else expCounts['16+ years']++;
  });

  const expColors: Record<string, string> = {
    '< 2 years': '22c55e', '2-4 years': 'f97316', '4-8 years': '38bdf8',
    '8-16 years': 'eab308', '16+ years': 'a855f7', 'Unknown': 'cccccc'
  };

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

  // ─── 3. Experience Legend ─────────────────────────────────
  const EXP_LEGEND = [
    { color: '22c55e', label: '< 2 years' },
    { color: 'f97316', label: '2 – 4 years' },
    { color: '38bdf8', label: '4 – 8 years' },
    { color: 'eab308', label: '8 – 16 years' },
    { color: 'a855f7', label: '16+ years' },
  ];

  // ─── 4. Chart Slides ─────────────────────────────────────
  slides.forEach((slideData) => {
    const slide = pres.addSlide();
    slide.bkgd = BG_LIGHT;
    addHeaderBar(slide, slideData.title);
    addFooter(slide);

    // Chart Image — maximize available space, adjust based on legend state
    const imgX = 0.15;
    const imgY = 0.85;
    const imgW = 9.7;
    const imgH = showExperienceLegend ? 4.0 : 4.45;

    if (slideData.imageData) {
      slide.addImage({
        data: slideData.imageData,
        x: imgX, y: imgY, w: imgW, h: imgH,
        sizing: { type: 'contain', w: imgW, h: imgH }
      });
    } else {
      slide.addText("(Image not available)", {
        x: 0.5, y: 2.5, w: 9, h: 1, align: 'center', color: 'ff0000', fontSize: 14, fontFace: 'Calibri'
      });
    }

    // ─── Horizontal Experience Legend (bottom of the slide) ──────────
    if (showExperienceLegend) {
      const LEGEND_Y = 4.95;
      const START_X = 1.8;
      const ITEM_W = 1.35;

      // Draw the "Experience:" label text
      slide.addText("Experience:", {
        x: 0.5, y: LEGEND_Y, w: 1.2, h: 0.25,
        fontFace: 'Calibri', fontSize: 10, color: TEXT_DARK,
        bold: true, valign: 'middle'
      });

      EXP_LEGEND.forEach((item, idx) => {
        const itemX = START_X + (idx * ITEM_W);

        // Color square indicator
        slide.addShape(pres.ShapeType.rect, {
          x: itemX, y: LEGEND_Y + 0.05, w: 0.16, h: 0.13,
          fill: { color: item.color },
          rectRadius: 0.03
        });

        // Label text
        slide.addText(item.label, {
          x: itemX + 0.22, y: LEGEND_Y, w: 1.0, h: 0.25,
          fontFace: 'Calibri', fontSize: 9, color: TEXT_MEDIUM,
          bold: true, valign: 'middle'
        });
      });
    }
  });

  // ─── 5. Download using pptxgenjs built-in writeFile ───────
  await pres.writeFile({ fileName: 'Organogram_Departments_Badri.pptx' });
}
