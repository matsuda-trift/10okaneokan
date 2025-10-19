"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useState } from "react";
import type { OkanResult } from "@/lib/okan";

type MessageRole = "okan" | "user" | "system";

type MessagePayload =
  | {
      type: "result";
      data: OkanResult;
    };

type Message = {
  id: string;
  role: MessageRole;
  text: string;
  payload?: MessagePayload;
};

const promptOrder = [
  "expenses",
  "income",
  "savings",
  "subscriptions",
  "credit",
] as const;

type PromptId = (typeof promptOrder)[number];

type Prompt = {
  id: PromptId;
  text: string;
};

const promptPool: Record<PromptId, string[]> = {
  expenses: [
    "今月の支出はいくら使ったん？ざっくり教えて。",
    "支出から確認しよ。ざっくりでええから教えてな。",
    "使った分、まずは白状してみ。いくらやった？",
  ],
  income: [
    "支出わかったわ。ほな今月の収入はどれくらいやったん？",
    "入ってきたお金もしっかり確認しよ。いくら入った？",
    "収入はどない？手取りベースで教えてみて。",
  ],
  savings: [
    "貯金はどない？しっかり握っとるか？",
    "貯めてるお金、今月どれくらい確保できた？",
    "貯金残高はどんな感じ？ざっくりの金額でええで。",
  ],
  subscriptions: [
    "サブスクは月いくら払ってるんや？",
    "定額サービスの支払い、合計でどれくらい？",
    "毎月自動で落ちるサブスク、全部でいくらになる？",
  ],
  credit: [
    "クレカの支払い残高、正直に教えてや。",
    "カードの残り、今どれくらい抱えてる？",
    "クレジットの支払い予定額、念のため教えてな。",
  ],
};

const closingMessages = [
  "ようやってるやん。無理せんと、ちゃんとよう食べてよう寝るんやで。",
  "疲れたらちゃんと休みや。誰も見てへんでも、うちはずっと応援してるで。",
  "困ったらすぐ連絡し。ひとりで抱え込まんと、甘えてええんやからな。",
];

const pickRandom = <T,>(items: T[]): T => {
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? items[0];
};

const createPromptSequence = (): Prompt[] =>
  promptOrder.map((id) => ({
    id,
    text: pickRandom(promptPool[id]),
  }));

const typingMessage: Message = {
  id: "typing",
  role: "system",
  text: "•••",
};

const STORAGE_KEY = "okaneOkan:lastSnapshot";

const parseAmount = (value: string) => {
  const normalized = value.replace(/,/g, "").trim();
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
};

export default function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>(() => createPromptSequence());
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: prompts[0]?.id ?? "intro",
      role: "okan",
      text: prompts[0]?.text ?? "",
    },
  ]);
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const isFinished = stepIndex >= prompts.length;
  const currentPrompt = prompts[stepIndex];

  const buttonLabel = isFinished
    ? "もう一回"
    : stepIndex === prompts.length - 1
      ? "オカンに送る"
      : "送信";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, number>;
      const normalized = Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => {
          const numeric =
            typeof value === "number" ? value : Number(String(value));
          return [key, Number.isFinite(numeric) ? numeric : 0];
        }),
      ) as Record<string, number>;

      setAnswers(normalized);

      const firstPromptId = promptOrder[0];
      if (normalized[firstPromptId] !== undefined) {
        setInput(String(normalized[firstPromptId]));
      }
    } catch (error) {
      console.error("Failed to restore snapshot", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isFinished) {
      resetConversation();
      return;
    }

    if (!currentPrompt) {
      return;
    }

    if (!input.trim()) {
      return;
    }

    const numericValue = parseAmount(input);
    const updatedAnswers = {
      ...answers,
      [currentPrompt.id]: numericValue,
    };

    const userMessage: Message = {
      id: `${currentPrompt?.id ?? "entry"}-answer`,
      role: "user",
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAnswers(updatedAnswers);

    if (stepIndex + 1 < prompts.length) {
      queueNextPrompt(stepIndex + 1, updatedAnswers);
    } else {
      submitAnswers(updatedAnswers).catch(() => {
        // エラーは `submitAnswers` 内でハンドリング済み。
      });
    }
  };

  const queueNextPrompt = (
    nextIndex: number,
    snapshot: Record<string, number>,
  ) => {
    setIsTyping(true);

    // Simple timeout emulates typing delay.
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: prompts[nextIndex].id,
          role: "okan",
          text: prompts[nextIndex].text,
        },
      ]);
      setStepIndex(nextIndex);
      const nextPromptId = prompts[nextIndex]?.id;
      if (nextPromptId) {
        const saved = snapshot[nextPromptId];
        setInput(saved !== undefined ? String(saved) : "");
      } else {
        setInput("");
      }
    }, 400);
  };

  const submitAnswers = async (snapshot: Record<string, number>) => {
    setIsTyping(true);
    setStepIndex(prompts.length);

    const calculatingId = `calculating-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: calculatingId,
        role: "okan",
        text: "なるほどなぁ…計算中やで。",
      },
    ]);

    const payload = {
      income: snapshot.income ?? 0,
      expenses: snapshot.expenses ?? 0,
      savings: snapshot.savings ?? 0,
      subscriptions: snapshot.subscriptions ?? 0,
      credit: snapshot.credit ?? 0,
    };

    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch score: ${response.status}`);
      }

      const result = (await response.json()) as OkanResult;

      const closing = pickRandom(closingMessages);

      setMessages((prev) => [
        ...prev,
        {
          id: `result-${Date.now()}`,
          role: "okan",
          text: `点数は${result.score}点や。じっくり見てみよか。`,
          payload: {
            type: "result",
            data: result,
          },
        },
        {
          id: `closing-${Date.now()}`,
          role: "okan",
          text: closing,
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "okan",
          text: "ごめんな、計算に手間取ってしもたわ。時間あけてもう一度試してみてな。",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const resetConversation = () => {
    const nextPrompts = createPromptSequence();
    setPrompts(nextPrompts);
    setMessages([
      {
        id: nextPrompts[0]?.id ?? "intro",
        role: "okan",
        text: nextPrompts[0]?.text ?? "",
      },
    ]);
    setStepIndex(0);
    setIsTyping(false);
    const firstPromptId = nextPrompts[0]?.id;
    if (firstPromptId && answers[firstPromptId] !== undefined) {
      setInput(String(answers[firstPromptId]));
    } else {
      setInput("");
    }
  };

  const isSubmitDisabled = isTyping || (!isFinished && input.trim().length === 0);

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col gap-6 px-4 py-8 sm:px-6 md:py-12">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-sm font-semibold tracking-[0.2em] text-[color:var(--okan-muted)]">
          #おかねおかん
        </p>
        <h1 className="text-2xl font-normal leading-tight text-[color:var(--okan-text)] sm:text-[2.5rem]">
          今月なんぼ使ったんや？
          <span className="block">怒らへんから正直に言うてみ。</span>
        </h1>
      </header>

      <section className="flex flex-1 flex-col gap-4 rounded-3xl border border-[color:var(--okan-border)] bg-white/70 p-4 shadow-sm sm:p-6">
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {isTyping ? <ChatBubble message={typingMessage} /> : null}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl bg-white/80 p-3 shadow-inner sm:flex-row sm:items-end sm:gap-2"
        >
          {!isFinished ? (
            <label className="flex-1 text-sm text-[color:var(--okan-muted)] sm:text-base">
              {currentPrompt?.text}
            </label>
          ) : (
            <p className="text-sm text-[color:var(--okan-muted)] sm:text-base">
              やり直す？いつでもやで。
            </p>
          )}
          {!isFinished ? (
            <input
              type="number"
              inputMode="numeric"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="w-full flex-1 rounded-xl border border-[color:var(--okan-border)] bg-white px-4 py-3 text-right text-lg tracking-wide text-[color:var(--okan-text)] outline-none focus-visible:border-[color:var(--okan-button)] focus-visible:ring-2 focus-visible:ring-[color:var(--okan-button)]/40"
              placeholder="0"
              required
            />
          ) : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-[color:var(--okan-button)] px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={isSubmitDisabled}
          >
            {buttonLabel}
          </button>
        </form>
      </section>
    </main>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isOkan = message.role === "okan";
  const isUser = message.role === "user";
  const alignment = isUser ? "self-end" : "self-start";

  const baseStyle: CSSProperties = {
    backgroundColor: isOkan
      ? "var(--okan-mom)"
      : isUser
        ? "var(--okan-user)"
        : "transparent",
    color: isOkan || isUser ? "var(--okan-text)" : "var(--okan-muted)",
  };

  const bubbleClassName = [
    "max-w-[80%]",
    "rounded-3xl",
    "px-5",
    "py-3",
    "text-base",
    "leading-relaxed",
    alignment,
  ]
    .filter(Boolean)
    .join(" ");

  if (message.role === "system") {
    return (
      <div
        className="self-start pl-3 text-xl text-[color:var(--okan-muted)]"
        aria-label="オカンが考え中"
      >
        {message.text}
      </div>
    );
  }

  return (
    <div className={bubbleClassName} style={baseStyle}>
      <div className="flex flex-col gap-3">
        <p className="text-base leading-relaxed">{message.text}</p>
        {message.payload?.type === "result" ? (
          <ResultDetails result={message.payload.data} />
        ) : null}
      </div>
    </div>
  );
}

function ResultDetails({ result }: { result: OkanResult }) {
  const focusItems = result.breakdown.slice(0, 3);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/70 p-4 text-sm text-[color:var(--okan-text)] shadow-inner">
      <div>
        <span className="text-3xl font-semibold text-[color:var(--okan-button)]">
          {result.score}
        </span>
        <span className="ml-1 text-base font-medium">点</span>
      </div>
      <p className="text-base leading-relaxed">{result.comment}</p>
      <div className="rounded-xl bg-white/90 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--okan-muted)]">
          今すぐできること
        </p>
        <p className="mt-1 leading-relaxed">{result.action}</p>
      </div>
      {focusItems.length ? (
        <div className="rounded-xl bg-white/90 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--okan-muted)]">
            気になったポイント
          </p>
          <ul className="mt-2 grid gap-2">
            {focusItems.map((item) => (
              <li key={item.id} className="rounded-lg bg-white px-3 py-2 shadow-sm">
                <p className="text-sm font-medium leading-tight">{item.label}</p>
                <p className="text-xs leading-relaxed text-[color:var(--okan-muted)]">
                  {item.reason}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
