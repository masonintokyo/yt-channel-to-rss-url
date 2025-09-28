import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  extractChannelIdFromHtml,
  parseChannelIdentifier,
  isChannelId,
} from '../src/conversion';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const input = (request.query.input as string | undefined) ?? '';
  if (!input) {
    response.status(400).json({ message: 'input クエリパラメータを指定してください。' });
    return;
  }

  const parsed = parseChannelIdentifier(input);
  if (parsed.status === 'error') {
    response.status(400).json({ message: parsed.message });
    return;
  }

  if (parsed.status === 'channelId') {
    response.status(200).json({ channelId: parsed.channelId });
    return;
  }

  try {
    const fetchResponse = await fetch(parsed.lookupUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'ja,en;q=0.8',
      },
    });

    if (!fetchResponse.ok) {
      console.error('Failed to fetch YouTube page', {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        url: parsed.lookupUrl,
      });
      response
        .status(502)
        .json({ message: 'YouTube からチャンネル情報を取得できませんでした。時間をおいて再度お試しください。' });
      return;
    }

    const html = await fetchResponse.text();
    const channelId = extractChannelIdFromHtml(html);

    if (!channelId || !isChannelId(channelId)) {
      console.warn('channelId not found in response', { lookupUrl: parsed.lookupUrl });
      response.status(404).json({ message: 'チャンネル ID を特定できませんでした。' });
      return;
    }

    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    response.status(200).json({ channelId });
  } catch (error) {
    console.error('Unexpected error during channel lookup', error);
    response.status(500).json({ message: 'チャンネル ID の検索中にエラーが発生しました。' });
  }
}
