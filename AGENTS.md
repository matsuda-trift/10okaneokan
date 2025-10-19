# Repository Guidelines

## 基本方針
シンプルで読みやすいコードを最優先。余計な抽象化や過剰な依存を避け、必要な実装だけを正確に行う。判断は常にユーザー要求と要件定義書を起点にし、変更理由を説明できる状態を保つ。

## ディレクトリ構成
- `app/`: App Router。`page.tsx` がチャットUI、`layout.tsx` がメタデータとフォント、`api/score/route.ts` が Edge API。
- `lib/okan.ts`: 採点ロジックと共有型定義。ビジネスルールはここに集約する。
- `public/`: 画像やアイコン等の静的アセット。
- ルート直下: 設定 (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`) とドキュメント。

## 開発コマンド
- `npm run dev` — 開発サーバー（Turbopack）。
- `npm run build` — 本番ビルド（Edge対応、指示があるまでは実行を控える）。
- `npm start` — ビルド済みアプリの起動。
- `npm run lint` — ESLint（`next` プリセット使用）。

## コーディング規約
TypeScript + React 19 を使用。クライアント専用処理のみ `use client` を宣言。インデント2スペース、文字列はダブルクォート。再利用可能な処理は named export。スタイリングは `app/globals.css` のCSS変数とTailwindユーティリティを併用。関西弁文言は重複定義を避け `lib` などで一元管理する。

## テスト方針
公式テストフレームワークは未導入。ロジック追加時は Vitest/Jest を採用し、`lib/okan.ts` には80%以上のカバレッジを目標に単体テストを追加する。テストファイルは `xxx.test.ts` とし、実装と同階層に配置。UI検証は将来的にPlaywrightを想定。

## コミット & PR
コミットメッセージは短い現在形の英語サマリ（例: `feat: adjust okan scoring`）。PRでは目的、主要変更点、実行コマンド (`npm run lint` 等)、UI変更時のスクリーンショット、関連Issueへのリンクを明記。無関係なリファクタを混在させず、変更意図を明瞭にする。

## Edge Runtime メモ
`/api/score` は Vercel Edge 上で動作するため Node.js 固有 API を避け、Fetch/Response 等の Web 標準に限定する。環境変数やシークレットは Vercel 設定で管理し、リポジトリへコミットしない。
