export const CHANNEL_ID_PATTERN = /^UC[0-9A-Za-z_-]{22}$/;

export type ChannelIdentifierResult =
  | { status: 'channelId'; channelId: string }
  | { status: 'needsLookup'; lookupUrl: string; normalizedInput: string }
  | { status: 'error'; message: string };

export function normalizeInput(raw: string): string {
  return raw.trim();
}

export function isChannelId(value: string): boolean {
  return CHANNEL_ID_PATTERN.test(value);
}

export function buildFeedUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

export function parseChannelIdentifier(rawInput: string): ChannelIdentifierResult {
  const input = normalizeInput(rawInput);

  if (!input) {
    return { status: 'error', message: '入力が空です。チャンネル URL か @ハンドルを入力してください。' };
  }

  if (isChannelId(input)) {
    return { status: 'channelId', channelId: input };
  }

  if (input.startsWith('@')) {
    return {
      status: 'needsLookup',
      lookupUrl: `https://www.youtube.com/${input}`,
      normalizedInput: input,
    };
  }

  if (input.startsWith('https://') || input.startsWith('http://')) {
    try {
      const url = new URL(input);
      const fromUrl = parseFromUrl(url);
      if (fromUrl) {
        return fromUrl;
      }
      return {
        status: 'error',
        message: 'この URL からはチャンネル ID を検出できませんでした。',
      };
    } catch (error) {
      return { status: 'error', message: 'URL の解析に失敗しました。形式を確認してください。' };
    }
  }

  return {
    status: 'needsLookup',
    lookupUrl: `https://www.youtube.com/@${input}`,
    normalizedInput: `@${input.replace(/^@/, '')}`,
  };
}

function parseFromUrl(url: URL): ChannelIdentifierResult | null {
  const host = url.host.toLowerCase();
  if (!host.includes('youtube.com') && !host.endsWith('youtu.be')) {
    return {
      status: 'error',
      message: 'YouTube の URL を入力してください。',
    };
  }

  if (url.searchParams.has('channel_id')) {
    const channelId = url.searchParams.get('channel_id') ?? '';
    if (isChannelId(channelId)) {
      return { status: 'channelId', channelId };
    }
  }

  if (url.pathname.startsWith('/channel/')) {
    const maybeId = url.pathname.split('/')[2] ?? '';
    if (isChannelId(maybeId)) {
      return { status: 'channelId', channelId: maybeId };
    }
  }

  if (url.pathname.startsWith('/feeds/videos.xml')) {
    const id = url.searchParams.get('channel_id');
    if (id && isChannelId(id)) {
      return { status: 'channelId', channelId: id };
    }
  }

  const handleMatch = url.pathname.match(/\/(@[A-Za-z0-9._-]+)/);
  if (handleMatch) {
    const handle = handleMatch[1];
    return {
      status: 'needsLookup',
      lookupUrl: `https://www.youtube.com/${handle}`,
      normalizedInput: handle,
    };
  }

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length >= 1) {
    const segment = segments[0];
    if (segment === 'c' || segment === 'user' || segment === 'channel') {
      const identifier = segments[1];
      if (identifier) {
        if (segment === 'channel' && isChannelId(identifier)) {
          return { status: 'channelId', channelId: identifier };
        }
        return {
          status: 'needsLookup',
          lookupUrl: `https://www.youtube.com/${segment}/${identifier}`,
          normalizedInput: identifier.startsWith('@') ? identifier : `@${identifier}`,
        };
      }
    }
  }

  return null;
}

export function extractChannelIdFromHtml(html: string): string | null {
  const match = html.match(/"channelId"\s*:\s*"(UC[0-9A-Za-z_-]{22})"/);
  if (match) {
    return match[1];
  }
  const linkMatch = html.match(/href="\/channel\/(UC[0-9A-Za-z_-]{22})"/);
  if (linkMatch) {
    return linkMatch[1];
  }
  return null;
}
