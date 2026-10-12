// ─── Management (always pinned at the top of every chart) ───
// Level-1 directors that sit next to the Managing Director in the
// "Management" box. Order here = left-to-right order in the PPT.
export const PINNED_LEVEL1_NAMES = ['Ajmal Bhatty', 'Ali Bhuriwala'];

export function isPinnedLevel1(name: string | undefined): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return PINNED_LEVEL1_NAMES.some(p => p.toLowerCase() === n);
}

// ─── Experience parsing ─────────────────────────────────────
/**
 * Converts an experience value to years.
 * Handles: 0.1 | "3.5" | "1 year(s) 10 month(s)" | "2 yrs 3 mos" | "8 months" | "45 days"
 */
export function parseExperienceYears(raw: unknown): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'number') return isNaN(raw) ? undefined : raw;
  const s = String(raw).trim().toLowerCase();
  if (!s || s === '-' || s === '—' || s === 'n/a' || s === 'na') return undefined;

  const yMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|y)\b/);
  const mMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:months?|mons?|mths?|mos?|m)\b/);
  const dMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:days?|d)\b/);
  if (yMatch || mMatch || dMatch) {
    const y = yMatch ? parseFloat(yMatch[1]) : 0;
    const m = mMatch ? parseFloat(mMatch[1]) : 0;
    const d = dMatch ? parseFloat(dMatch[1]) : 0;
    return y + m / 12 + d / 365;
  }

  const num = parseFloat(s.replace(/,/g, ''));
  return isNaN(num) ? undefined : num;
}

/** Total experience = outside Badri + at Badri (undefined if both are missing). */
export function totalExperienceYears(outside: unknown, atBadri: unknown): number | undefined {
  const a = parseExperienceYears(outside);
  const b = parseExperienceYears(atBadri);
  if (a === undefined && b === undefined) return undefined;
  return Math.round(((a ?? 0) + (b ?? 0)) * 100) / 100;
}

// ─── Department Colors ──────────────────────────────────────
export const DEPT_COLORS: Record<string, string> = {
  'Executive': '#8b5cf6',
  'Underwriting': '#ec4899',
  'Claims': '#f97316',
  'Sales & Distribution': '#06b6d4',
  'Actuarial': '#14b8a6',
  'Finance & Accounting': '#eab308',
  'Information Technology': '#3b82f6',
  'Human Resources': '#a855f7',
  'Risk Management': '#ef4444',
  'Compliance & Legal': '#64748b',
  'Marketing': '#f43f5e',
  'Customer Service': '#22c55e',
  'Internal Audit': '#78716c',
  'Product Development': '#0ea5e9',
  'Administration': '#6b7280',
  'Operations': '#8b5cf6',
  'General': '#64748b',
};

export function getDeptColor(dept: string): string {
  return DEPT_COLORS[dept] || '#64748b';
}

// ─── Experience Color Scheme ────────────────────────────────
export interface ExpColor {
  bg: string;
  text: string;
  label: string;
}

export function getExpColor(years: number | undefined | null): ExpColor | null {
  if (years === undefined || years === null) return null;
  if (years < 2) return { bg: '#388e3c', text: '#ffffff', label: '< 2 yrs' };
  if (years < 4) return { bg: '#1e88e5', text: '#ffffff', label: '2 – < 4 yrs' };
  if (years < 8) return { bg: '#ff9800', text: '#ffffff', label: '4 – < 8 yrs' };
  if (years < 16) return { bg: '#8e24aa', text: '#ffffff', label: '8 – < 16 yrs' };
  return { bg: '#e53935', text: '#ffffff', label: '> 16 yrs' };
}

export function getExpRange(years: number | undefined | null): string | null {
  if (years === undefined || years === null) return null;
  if (years < 2) return '< 2 years';
  if (years < 4) return '2-4 years';
  if (years < 8) return '4-8 years';
  if (years < 16) return '8-16 years';
  return '16+ years';
}

// ─── Experience Legend (for UI and PPT) ─────────────────────
export const EXP_LEGEND = [
  { color: '#388e3c', hexColor: '388E3C', label: '< 2 yrs' },
  { color: '#1e88e5', hexColor: '1E88E5', label: '2 – < 4 yrs' },
  { color: '#ff9800', hexColor: 'FF9800', label: '4 – < 8 yrs' },
  { color: '#8e24aa', hexColor: '8E24AA', label: '8 – < 16 yrs' },
  { color: '#e53935', hexColor: 'E53935', label: '> 16 yrs' },
];
