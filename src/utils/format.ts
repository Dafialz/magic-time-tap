// простий форматер чисел: 1.2k, 3.45M...
export function formatNum(n: number) {
  if (!isFinite(n)) return "0";
  if (Math.abs(n) < 1000) return n.toFixed(0);
  const units = ["k", "M", "B", "T", "Qa", "Qi"];
  let idx = -1;
  let v = n;
  while (Math.abs(v) >= 1000 && idx < units.length - 1) {
    v /= 1000;
    idx++;
  }
  return v.toFixed(2) + units[idx];
}
