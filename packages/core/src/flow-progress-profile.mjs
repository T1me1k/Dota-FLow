function average(values) {
  return values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : 0;
}

function rounded(value) {
  return Math.round(Number(value) || 0);
}

export function aggregateFlowPerformance(reports = [], { recentWindow = 3 } = {}) {
  const valid = reports.filter((report) => report && Number.isFinite(Number(report.score)) && report.dimensions);
  if (!valid.length) {
    return {
      matchCount: 0,
      averageScore: null,
      recentAverage: null,
      trend: { direction: 'INSUFFICIENT_DATA', delta: 0 },
      dimensions: {},
      strengths: [],
      focus: [],
      confidence: 0
    };
  }

  const dimensionNames = [...new Set(valid.flatMap((report) => Object.keys(report.dimensions ?? {})))];
  const dimensions = Object.fromEntries(dimensionNames.map((name) => [
    name,
    rounded(average(valid.map((report) => report.dimensions?.[name]).filter(Number.isFinite)))
  ]));
  const windowSize = Math.max(1, Math.min(valid.length, Number(recentWindow) || 3));
  const recent = valid.slice(-windowSize);
  const previous = valid.slice(Math.max(0, valid.length - windowSize * 2), valid.length - windowSize);
  const recentAverage = average(recent.map((report) => report.score));
  const previousAverage = previous.length ? average(previous.map((report) => report.score)) : recentAverage;
  const delta = rounded(recentAverage - previousAverage);
  const ranked = Object.entries(dimensions).sort((a, b) => b[1] - a[1]);

  return {
    matchCount: valid.length,
    averageScore: rounded(average(valid.map((report) => report.score))),
    recentAverage: rounded(recentAverage),
    trend: {
      direction: previous.length < 2 ? 'INSUFFICIENT_DATA' : delta >= 3 ? 'UP' : delta <= -3 ? 'DOWN' : 'STABLE',
      delta
    },
    dimensions,
    strengths: ranked.slice(0, 2).map(([dimension, value]) => ({ dimension, value })),
    focus: ranked.slice(-3).reverse().map(([dimension, value]) => ({ dimension, value })),
    confidence: Math.min(0.95, 0.35 + valid.length * 0.1)
  };
}
