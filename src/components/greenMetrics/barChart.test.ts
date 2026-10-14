import { describe, expect, it } from "vitest";
import { buildBarChart } from "./barChart";

const chart = (values: number[]) =>
  buildBarChart(values, 760, 320, { left: 80, right: 32, top: 32, bottom: 60 });

describe("zero-referenced bar chart layout", () => {
  it("measures positive values from zero, not from the smallest value", () => {
    const { bars, baseline, ticks } = chart([20, 30, 40]);
    expect(baseline).toBe(260);
    expect(bars[0].height).toBe(114);
    expect(bars[1].height).toBe(171);
    expect(bars[2].height).toBe(228);
    expect(ticks[0]).toEqual({ value: 0, y: 260 });
    bars.forEach((bar) => expect(bar.y + bar.height).toBe(baseline));
  });

  it.each([
    { values: [0] },
    { values: [0, 0] },
    { values: [5, 5] },
    { values: [0.001, 0.002] },
    { values: [] },
  ])(
    "handles zero, equal, fractional, single, and empty values: $values",
    ({ values }) => {
      const result = chart(values);
      expect(Number.isFinite(result.baseline)).toBe(true);
      result.bars.forEach((bar) => {
        expect(Number.isFinite(bar.height)).toBe(true);
        expect(bar.height).toBeGreaterThanOrEqual(0);
        expect(bar.y + bar.height).toBeCloseTo(result.baseline);
      });
    },
  );

  it("renders all-zero values as zero-height bars with a bottom baseline", () => {
    const result = chart([0, 0]);
    expect(result.baseline).toBe(260);
    expect(result.bars.map((bar) => bar.height)).toEqual([0, 0]);
  });

  it("centers a single bar and keeps all bars inside the plot", () => {
    expect(chart([5]).bars[0].center).toBe(404);
    const result = chart(Array.from({ length: 100 }, (_, index) => index));
    expect(result.bars).toHaveLength(100);
    result.bars.forEach((bar) => {
      expect(bar.x).toBeGreaterThanOrEqual(80);
      expect(bar.x + bar.width).toBeLessThanOrEqual(728);
    });
  });

  it("keeps zero as the reference for signed values", () => {
    const { bars, baseline } = chart([-5, 5]);
    expect(bars[0].y).toBe(baseline);
    expect(bars[1].y + bars[1].height).toBe(baseline);
    expect(bars[0].height).toBe(bars[1].height);
  });
});
