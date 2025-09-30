import { describe, expect, it } from 'vitest';
import {
  buildFeedUrl,
  extractChannelIdFromHtml,
  parseChannelIdentifier,
  isChannelId,
} from '../src/conversion.js';

describe('parseChannelIdentifier', () => {
  it('parses direct channel id', () => {
    const result = parseChannelIdentifier('UC12345678901234567890AA');
    expect(result).toEqual({ status: 'channelId', channelId: 'UC12345678901234567890AA' });
  });

  it('parses channel URL', () => {
    const result = parseChannelIdentifier('https://www.youtube.com/channel/UC12345678901234567890AA');
    expect(result).toEqual({ status: 'channelId', channelId: 'UC12345678901234567890AA' });
  });

  it('parses feed URL', () => {
    const result = parseChannelIdentifier(
      'https://www.youtube.com/feeds/videos.xml?channel_id=UC12345678901234567890AA',
    );
    expect(result).toEqual({ status: 'channelId', channelId: 'UC12345678901234567890AA' });
  });

  it('marks handle for lookup', () => {
    const result = parseChannelIdentifier('@example');
    expect(result).toEqual({
      status: 'needsLookup',
      lookupUrl: 'https://www.youtube.com/@example',
      normalizedInput: '@example',
    });
  });

  it('handles https handle URL', () => {
    const result = parseChannelIdentifier('https://www.youtube.com/@example/videos');
    expect(result).toEqual({
      status: 'needsLookup',
      lookupUrl: 'https://www.youtube.com/@example',
      normalizedInput: '@example',
    });
  });

  it('returns error for non YouTube URL', () => {
    const result = parseChannelIdentifier('https://example.com/channel/123');
    expect(result).toEqual({
      status: 'error',
      message: 'YouTube の URL を入力してください。',
    });
  });
});

describe('buildFeedUrl', () => {
  it('builds feed url', () => {
    expect(buildFeedUrl('UC12345678901234567890AA')).toBe(
      'https://www.youtube.com/feeds/videos.xml?channel_id=UC12345678901234567890AA',
    );
  });
});

describe('isChannelId', () => {
  it('accepts valid channel id', () => {
    expect(isChannelId('UC12345678901234567890AA')).toBe(true);
  });

  it('rejects invalid channel id', () => {
    expect(isChannelId('invalid')).toBe(false);
  });
});

describe('extractChannelIdFromHtml', () => {
  it('extracts from JSON snippet', () => {
    const html = '<script>"channelId":"UC0000000000000000000000"</script>';
    expect(extractChannelIdFromHtml(html)).toBe('UC0000000000000000000000');
  });

  it('extracts from link', () => {
    const html = '<a href="/channel/UC1111111111111111111111">Channel</a>';
    expect(extractChannelIdFromHtml(html)).toBe('UC1111111111111111111111');
  });

  it('extracts from canonical link', () => {
    const html =
      '<link rel="canonical" href="https://www.youtube.com/channel/UC2222222222222222222222" />';
    expect(extractChannelIdFromHtml(html)).toBe('UC2222222222222222222222');
  });

  it('extracts from meta tag', () => {
    const html = '<meta itemprop="channelId" content="UC3333333333333333333333" />';
    expect(extractChannelIdFromHtml(html)).toBe('UC3333333333333333333333');
  });

  it('falls back to contextual UC match', () => {
    const html =
      '<div data-info="owner">UC4444444444444444444444</div><div>UC5555555555555555555555</div>';
    expect(extractChannelIdFromHtml(html)).toBe('UC4444444444444444444444');
  });

  it('returns null when not found', () => {
    expect(extractChannelIdFromHtml('<html></html>')).toBeNull();
  });
});
