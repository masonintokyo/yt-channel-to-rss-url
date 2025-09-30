# YouTube Channel to RSS URL

YouTube のチャンネル / 動画 URL や `@` ハンドルを RSS フィード URL に変換する最小構成の Web アプリです。Vercel 上で静的ページとしてホストしつつ、ハンドル解決のためのサーバーレス関数を併用しています。UI は英語 / 日本語の切り替えに対応し、動画ページからでも投稿者の RSS URL を生成できます。

## 主な機能
- チャンネル ID・チャンネル URL・@ハンドルに加えて、動画 URL からも RSS フィード URL を生成
- 英語 / 日本語 UI の切り替え（デフォルトは英語）
- 開発者の X / GitHub へのリンクと、BTC・ETH 寄付アドレス表示

## セットアップ
```bash
npm install
npm run build
```

`npm run build` 実行後、`public/dist` 配下にブラウザで読み込む JavaScript が生成されます。

## 開発
- `npm test`: Vitest によるユニットテスト
- `npm run build`: TypeScript のトランスパイル

## デプロイ
Vercel にリポジトリを接続し、以下を設定してください。
- **Build Command**: `npm run build`
- **Output Directory**: `public`

`api/resolve.ts` は自動的に Serverless Function としてデプロイされます。

## ドキュメント
- [docs/PLAN.md](docs/PLAN.md)
- [docs/DEVELOPER.md](docs/DEVELOPER.md)
- [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
