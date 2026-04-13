/** Age in full years from an HTML date value (YYYY-MM-DD), relative to today in local time. */
export function ageFromDateOfBirth(isoDate: string): number {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 0;
  const [y, m, d] = isoDate.split('-').map(Number);
  const birth = new Date(y, m - 1, d);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const md = today.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age -= 1;
  return Math.max(0, Math.min(120, age));
}
