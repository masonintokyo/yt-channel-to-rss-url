# 開発者向けドキュメント

## プロジェクト概要
YouTube のチャンネル URL や `@` ハンドルから RSS フィード URL を生成する最小限の Web アプリです。フロントエンドは静的にホスティングされ、ハンドルなどからチャンネル ID を取得する際は Vercel Functions (`api/resolve.ts`) が HTML を解析して ID を返します。

## ディレクトリ構成
- `public/`: 静的アセット。`index.html` とビルド済みのスクリプト (`dist/main.js`) が配置されます。
- `src/`: TypeScript ソースコード。
  - `conversion.ts`: 入力解析ロジックと HTML からチャンネル ID を抽出する共通処理を提供します。
  - `main.ts`: ブラウザイベントの制御、API 呼び出し、UI 更新を担当します。
- `api/resolve.ts`: サーバーレス関数。入力値を解析し、必要に応じて YouTube ページをフェッチしてチャンネル ID を抽出します。
- `tests/`: Vitest を用いたユニットテスト。
- `docs/`: 設計・利用ドキュメント。

## 主要な関数
- `parseChannelIdentifier(input: string)`:
  - 入力値を正規化し、既知のチャンネル ID か、API での解決が必要か、エラーかを判定します。
- `buildFeedUrl(channelId: string)`:
  - `channel_id` クエリに与える RSS フィード URL を生成します。
- `extractChannelIdFromHtml(html: string)`:
  - YouTube のチャンネルページ HTML から `channelId` の値を正規表現で抽出します。

## サーバーレス関数の動作
1. `input` クエリを受け取り `parseChannelIdentifier` に渡す。
2. すでにチャンネル ID が分かればそのまま返す。
3. `needsLookup` の場合は対象ページを `fetch` し、`extractChannelIdFromHtml` で ID を抽出する。
4. 取得成功時は JSON で `{ channelId }` を返し、`s-maxage` ヘッダーで CDN キャッシュを有効化。

## ビルド & テスト
```bash
npm install
npm run build   # TypeScript -> public/dist
npm test        # Vitest によるユニットテスト
```

## デプロイ
Vercel でプロジェクトを作成し、ビルドコマンドに `npm run build`、出力ディレクトリに `public` を指定します。`api/` ディレクトリは自動的にサーバーレス関数としてデプロイされます。

## コーディング規約
- すべての新規関数は単一責務を意識し、入出力の型を明示します。
- 入力値は必ず正規化し、不正な値はエラーとして扱います。
- ログはサーバーレス関数内で `console.error` / `console.warn` を用いて重要イベントを記録します。
