
// Simple linear regression function
export function getTrendLineData(data: number[]) {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = data.reduce((a, b) => a + b) / n;
    const slope =
      x.reduce((sum, xi, i) => sum + (xi - meanX) * (data[i] - meanY), 0) /
      x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
    const intercept = meanY - slope * meanX;
  
    return x.map((xi) => slope * xi + intercept);
  }


export function formatMonthYear(month: number, year: number) {
  const date = new Date(year, month - 1); // Month is zero-based in JS Date
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}
