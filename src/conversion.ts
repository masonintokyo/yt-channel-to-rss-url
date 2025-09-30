export const CHANNEL_ID_PATTERN = /^UC[0-9A-Za-z_-]{22}$/;

export type ErrorMessageKey =
  | 'emptyInput'
  | 'urlParseFailed'
  | 'unsupportedUrl'
  | 'nonYoutubeUrl';

export type ChannelIdentifierResult =
  | { status: 'channelId'; channelId: string }
  | { status: 'needsLookup'; lookupUrl: string; normalizedInput: string }
  | { status: 'error'; messageKey: ErrorMessageKey; message: string };

const ERROR_MESSAGES: Record<ErrorMessageKey, string> = {
  emptyInput: 'Input is empty. Please enter a channel URL, video URL, or @handle.',
  urlParseFailed: 'Failed to parse the URL. Please check its format.',
  unsupportedUrl: 'Could not detect a channel ID from this URL.',
  nonYoutubeUrl: 'Please enter a YouTube URL.',
};

function createError(messageKey: ErrorMessageKey): ChannelIdentifierResult {
  return {
    status: 'error',
    messageKey,
    message: ERROR_MESSAGES[messageKey],
  };
}

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
    return createError('emptyInput');
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
      return createError('unsupportedUrl');
    } catch (error) {
      return createError('urlParseFailed');
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
    return createError('nonYoutubeUrl');
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
    const [firstSegment, secondSegment] = segments;

    if (host.endsWith('youtu.be')) {
      const videoId = firstSegment;
      if (videoId) {
        return {
          status: 'needsLookup',
          lookupUrl: `https://www.youtube.com/watch?v=${videoId}`,
          normalizedInput: `video:${videoId}`,
        };
      }
    }

    if (firstSegment === 'watch') {
      const videoId = url.searchParams.get('v');
      if (videoId) {
        return {
          status: 'needsLookup',
          lookupUrl: `https://www.youtube.com/watch?v=${videoId}`,
          normalizedInput: `video:${videoId}`,
        };
      }
    }

    if (firstSegment === 'shorts' || firstSegment === 'live') {
      const videoId = secondSegment;
      if (videoId) {
        return {
          status: 'needsLookup',
          lookupUrl: `https://www.youtube.com/watch?v=${videoId}`,
          normalizedInput: `video:${videoId}`,
        };
      }
    }

    const segment = firstSegment;
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

const CHANNEL_ID_EXTRACT_PATTERNS: RegExp[] = [
  /"channelId"\s*:\s*"(UC[0-9A-Za-z_-]{22})"/,
  /"externalId"\s*:\s*"(UC[0-9A-Za-z_-]{22})"/,
  /"browseId"\s*:\s*"(UC[0-9A-Za-z_-]{22})"/,
  /"channelExternalId"\s*:\s*"(UC[0-9A-Za-z_-]{22})"/,
  /"ucid"\s*:\s*"(UC[0-9A-Za-z_-]{22})"/,
  /"channel_id"\s*:\s*"(UC[0-9A-Za-z_-]{22})"/,
  /"canonicalBaseUrl"\s*:\s*"\/channel\/(UC[0-9A-Za-z_-]{22})"/,
  /<link[^>]+rel="canonical"[^>]+href="https:\/\/www\.youtube\.com\/channel\/(UC[0-9A-Za-z_-]{22})"/i,
  /<meta[^>]+itemprop="channelId"[^>]+content="(UC[0-9A-Za-z_-]{22})"/i,
  /<meta[^>]+itemprop="identifier"[^>]+content="(UC[0-9A-Za-z_-]{22})"/i,
  /<meta[^>]+property="og:url"[^>]+content="https:\/\/www\.youtube\.com\/channel\/(UC[0-9A-Za-z_-]{22})"/i,
  /<link[^>]+rel="alternate"[^>]+href="https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?channel_id=(UC[0-9A-Za-z_-]{22})"/i,
  /href="\/channel\/(UC[0-9A-Za-z_-]{22})"/,
  /https:\/\/www\.youtube\.com\/channel\/(UC[0-9A-Za-z_-]{22})/,
];

function findByPatterns(html: string): string | null {
  for (const pattern of CHANNEL_ID_EXTRACT_PATTERNS) {
    const match = html.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function findByContextualSearch(html: string): string | null {
  const fallbackMatches = html.match(/UC[0-9A-Za-z_-]{22}/g);
  if (!fallbackMatches) {
    return null;
  }

  const seen = new Set<string>();
  for (const candidate of fallbackMatches) {
    if (seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);

    const index = html.indexOf(candidate);
    if (index === -1) {
      continue;
    }

    const start = Math.max(0, index - 64);
    const end = Math.min(html.length, index + candidate.length + 64);
    const context = html.slice(start, end);
    if (/(channel|ucid|external|browse|owner|canonical)/i.test(context)) {
      return candidate;
    }
  }

  return fallbackMatches[0] ?? null;
}

export function extractChannelIdFromHtml(html: string): string | null {
  const byPattern = findByPatterns(html);
  if (byPattern) {
    return byPattern;
  }

  return findByContextualSearch(html);
}
