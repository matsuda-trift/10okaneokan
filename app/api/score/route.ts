import { NextResponse } from "next/server";
import { calcScore, type FinanceSnapshot } from "@/lib/okan";

export const runtime = "edge";

export async function POST(request: Request) {
  let payload: Partial<FinanceSnapshot>;

  try {
    payload = (await request.json()) as Partial<FinanceSnapshot>;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "JSONが読み取れへんかったわ。" },
      { status: 400 },
    );
  }

  const result = calcScore(payload);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
