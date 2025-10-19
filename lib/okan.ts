export type FinanceSnapshot = {
  income: number;
  expenses: number;
  savings: number;
  subscriptions: number;
  credit: number;
};

export type OkanBreakdown = {
  id: string;
  label: string;
  delta: number;
  reason: string;
};

export type OkanResult = {
  score: number;
  comment: string;
  action: string;
  breakdown: OkanBreakdown[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const toNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toSnapshot = (input: Partial<FinanceSnapshot>): FinanceSnapshot => ({
  income: Math.max(0, toNumber(input.income)),
  expenses: Math.max(0, toNumber(input.expenses)),
  savings: Math.max(0, toNumber(input.savings)),
  subscriptions: Math.max(0, toNumber(input.subscriptions)),
  credit: Math.max(0, toNumber(input.credit)),
});

export function calcScore(input: Partial<FinanceSnapshot>): OkanResult {
  const snapshot = toSnapshot(input);
  const breakdown: OkanBreakdown[] = [];
  let score = 100;

  if (snapshot.income === 0) {
    score = 0;
    breakdown.push({
      id: "income",
      label: "収入なし",
      delta: -100,
      reason: "収入がゼロやと、まず生活立て直すのが先やで。",
    });
    return {
      score,
      comment:
        "収入ゼロはほんま心配や。まずは働き口や支援探して、生活の基盤つくらなな。",
      action: "家族や支援機関に相談して、まず収入の確保を最優先にしようや。",
      breakdown,
    };
  }

  const expenseRatio = snapshot.expenses / snapshot.income;
  const savingsRatio = snapshot.savings / snapshot.income;
  const subscriptionRatio = snapshot.subscriptions / snapshot.expenses || 0;

  if (expenseRatio > 0.9) {
    const delta = clamp(-Math.round((expenseRatio - 0.9) * 100), -25, -5);
    score += delta;
    breakdown.push({
      id: "expenses",
      label: "支出が多い",
      delta,
      reason: "収入の9割以上使ってたら、そら貯金もできひんで。",
    });
  }

  if (savingsRatio < 0.1) {
    const delta = clamp(-Math.round((0.1 - savingsRatio) * 120), -30, -8);
    score += delta;
    breakdown.push({
      id: "savings",
      label: "貯金が少ない",
      delta,
      reason: "貯金は心の余裕や。ちょっとでも積み立てんとあかんわ。",
    });
  }

  if (subscriptionRatio > 0.25) {
    const delta = clamp(-Math.round((subscriptionRatio - 0.25) * 80), -15, -5);
    score += delta;
    breakdown.push({
      id: "subscriptions",
      label: "サブスク過多",
      delta,
      reason: "サブスク溜めすぎると気づかんうちにお金吸われるで。",
    });
  }

  if (snapshot.credit > snapshot.income * 0.5) {
    const ratio = snapshot.credit / snapshot.income;
    const delta = clamp(-Math.round((ratio - 0.5) * 120), -35, -10);
    score += delta;
    breakdown.push({
      id: "credit",
      label: "クレカ残高が高い",
      delta,
      reason: "返済が膨れ上がる前に、計画立てて早めに返しや。",
    });
  }

  score = clamp(Math.round(score), 0, 100);

  const comment = buildComment(score, snapshot, breakdown);
  const action = buildAction(score, breakdown);

  return {
    score,
    comment,
    action,
    breakdown,
  };
}

const buildComment = (
  score: number,
  snapshot: FinanceSnapshot,
  breakdown: OkanBreakdown[],
) => {
  if (score >= 80) {
    return "ええ感じやん！ちゃんと自分で舵取りできてるやんか。油断せんとこの調子でいこ。";
  }

  if (score >= 60) {
    return "よう頑張ってるけど、まだ伸びしろあるで。細かい出費とカードは要注意や。";
  }

  if (score >= 40) {
    const issue = breakdown[0]?.label ?? "出費";
    return `ちょっと危ないで。特に「${issue}」が気になったわ。ほんま気付けて良かったな。`;
  }

  if (snapshot.credit > snapshot.income * 0.8) {
    return "クレカの残高が重たすぎるで。ここは放っといたらあかん。今すぐ手打とう。";
  }

  return "今のままやとしんどいで。でも大丈夫、気付いた今が底や。ここから立て直してこ！";
};

const buildAction = (score: number, breakdown: OkanBreakdown[]) => {
  if (score >= 80) {
    return "週1で明細チェックして、ええ習慣をそのまま続けてな。";
  }

  const topIssue = breakdown.at(0);

  switch (topIssue?.id) {
    case "expenses":
      return "固定費と食費を1カテゴリずつ見直して、来月は5%減らす目標立てよか。";
    case "savings":
      return "給料日に自動で貯金に回す仕組み作ろ。5000円でも積み上がったら力になるで。";
    case "subscriptions":
      return "使ってへんサブスク1個だけ解約してみ。浮いた分は貯金に回そう。";
    case "credit":
      return "高い金利から優先して返そう。返済プランを書き出して誰かに見せるんやで。";
    default:
      return "支出アプリや明細を見返して、無意識の浪費を1つ見つけて止めようや。";
  }
};
