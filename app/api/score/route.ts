import { NextRequest, NextResponse } from "next/server";
import { calcScore, type FinanceSnapshot } from "@/lib/okan";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");

  if (requestOrigin && requestOrigin !== request.nextUrl.origin) {
    return NextResponse.json(
      { error: "forbidden", message: "このリクエスト元は許可してへんで。" },
      { status: 403 },
    );
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > 1024) {
      return NextResponse.json(
        {
          error: "payload_too_large",
          message: "送信データが大きすぎるわ。ちょっと見直してや。",
        },
        { status: 413 },
      );
    }
  }

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
