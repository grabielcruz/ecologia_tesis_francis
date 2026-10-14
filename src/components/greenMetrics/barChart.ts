interface ChartPadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const buildBarChart = (
  values: number[],
  width: number,
  height: number,
  padding: ChartPadding,
) => {
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values) || (min === 0 ? 1 : 0);
  const range = max - min;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const toY = (value: number) =>
    padding.top + ((max - value) / range) * plotHeight;
  const baseline = toY(0);
  const slotWidth = plotWidth / Math.max(1, values.length);
  const barWidth = Math.min(80, slotWidth * 0.6);

  return {
    baseline,
    bars: values.map((value, index) => {
      const center = padding.left + (index + 0.5) * slotWidth;
      const valueY = toY(value);
      return {
        center,
        x: center - barWidth / 2,
        y: Math.min(baseline, valueY),
        width: barWidth,
        height: Math.abs(baseline - valueY),
      };
    }),
    ticks: [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
      const value = min + range * fraction;
      return { value, y: toY(value) };
    }),
  };
};
