import { describe, expect, it } from "vitest";
import { calcScore } from "./okan";

describe("calcScore", () => {
  it("returns a strong score when spending and saving are balanced", () => {
    const result = calcScore({
      income: 300_000,
      expenses: 180_000,
      savings: 60_000,
      subscriptions: 8_000,
      credit: 12_000,
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.comment).toContain("ええ感じやん");
    expect(result.breakdown).toHaveLength(0);
  });

  it("drops to zero when income is missing", () => {
    const result = calcScore({
      income: 0,
      expenses: 50_000,
      savings: 0,
      subscriptions: 0,
      credit: 0,
    });

    expect(result.score).toBe(0);
    expect(result.breakdown[0]?.id).toBe("income");
    expect(result.action).toContain("収入の確保");
  });

  it("penalises overspending and low savings", () => {
    const result = calcScore({
      income: 200_000,
      expenses: 230_000,
      savings: 5_000,
      subscriptions: 15_000,
      credit: 40_000,
    });

    const breakdownIds = result.breakdown.map((item) => item.id);

    expect(result.score).toBeLessThan(80);
    expect(breakdownIds).toContain("expenses");
    expect(breakdownIds).toContain("savings");
  });

  it("flags high credit balances as the primary issue", () => {
    const result = calcScore({
      income: 200_000,
      expenses: 120_000,
      savings: 40_000,
      subscriptions: 10_000,
      credit: 180_000,
    });

    const creditIssue = result.breakdown.find((item) => item.id === "credit");

    expect(result.breakdown[0]?.id).toBe("credit");
    expect(creditIssue).toBeDefined();
    expect(result.comment).toContain("カード");
    expect(result.action).toContain("返そう");
  });
});
