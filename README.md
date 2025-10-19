## おかねおかん（Okane Okan）

Next.js (App Router) app that scores a monthly money snapshot and returns Kansai-dialect feedback from “オカン”. Built for Vercel Edge Runtime, no external database or auth.

### 要件抜粋
- 収入・支出・貯金・サブスク・クレカ残高をチャットで入力
- 出力は点数（0〜100）とコメント、行動提案
- 採点ロジックは `lib/okan.ts` の `calcScore()` に集約
- API エンドポイント：`POST /api/score`（Edge Runtime）
- フロントはモバイル中心のチャットUI（`app/page.tsx`）
- 永続化は `localStorage`（未実装／今後対応）

### 開発環境
- Node.js 18+（Vercel推奨）/ npm
- Next.js 15 / React 19 / TypeScript
- Tailwind CSS v4（`app/globals.css` でテーマ定義）

### スクリプト
```bash
npm run dev     # 開発サーバー（Turbopack）
npm run build   # 本番ビルド（Edge対応）
npm start       # ビルド済みを起動
npm run lint    # ESLint
```

### ディレクトリ
- `app/page.tsx` — チャットUIの土台（入力フローとプレースホルダー文言）
- `app/api/score/route.ts` — 採点API（Edge Function, JSON POST）
- `lib/okan.ts` — 採点ロジックとアドバイス生成
- `app/globals.css` — カラーパレット・フォント（Yomogi / Kosugi Maru）

### 次のステップ候補
1. `app/page.tsx` で `fetch('/api/score')` を呼び出し、スコア表示を実装
2. 採点ロジックのチューニングとテスト追加
3. localStorage で最新入力を保持
4. ブランドガイドに沿ったモーション・アイコン追加

Happy hacking!
# 10okaneokan
