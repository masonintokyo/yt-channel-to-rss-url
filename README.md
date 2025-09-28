# YouTube Channel to RSS URL

YouTube のチャンネル URL や `@` ハンドルを RSS フィード URL に変換する最小構成の Web アプリです。Vercel 上で静的ページとしてホストしつつ、ハンドル解決のためのサーバーレス関数を併用しています。

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
