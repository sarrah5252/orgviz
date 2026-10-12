/**
 * Experience parsing helpers for Node.js API services.
 * Converts strings like:
 *   - "0.1" / 0.1 / "3.5"
 *   - "1 year(s) 10 month(s)" / "2 yrs 3 mos"
 *   - "8 months" / "45 days"
 * to decimal years.
 */

export function parseExperienceYears(raw) {
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

/**
 * Total experience = outside Badri + at Badri (undefined if both are missing).
 */
export function totalExperienceYears(outside, atBadri) {
  const a = parseExperienceYears(outside);
  const b = parseExperienceYears(atBadri);
  if (a === undefined && b === undefined) return undefined;
  return Math.round(((a ?? 0) + (b ?? 0)) * 100) / 100;
}
