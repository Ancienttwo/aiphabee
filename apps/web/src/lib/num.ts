/** Deterministic thousands-separator format (no locale -> no SSR drift). */
export function fmtNum(n: number | undefined, decimals = 2): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  const fixed = n.toFixed(decimals);
  const [int, dec] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${grouped}.${dec}` : grouped;
}
