import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  extractChannelIdFromHtml,
  parseChannelIdentifier,
  isChannelId,
  type ErrorMessageKey,
} from '../src/conversion.js';

type LookupErrorMessageKey = 'lookupRequestFailed' | 'channelNotFound' | 'lookupUnexpectedError';

type ResponseErrorKey = ErrorMessageKey | LookupErrorMessageKey;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

function respondWithError(
  response: VercelResponse,
  status: number,
  messageKey: ResponseErrorKey,
  message: string,
) {
  response.status(status).json({ messageKey, message });
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const input = (request.query.input as string | undefined) ?? '';
  if (!input) {
    respondWithError(
      response,
      400,
      'emptyInput',
      'Please provide the input query parameter.',
    );
    return;
  }

  const parsed = parseChannelIdentifier(input);
  if (parsed.status === 'error') {
    respondWithError(response, 400, parsed.messageKey, parsed.message);
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
        'Accept-Language': 'en-US,en;q=0.9,ja;q=0.7',
      },
    });

    if (!fetchResponse.ok) {
      console.error('Failed to fetch YouTube page', {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        url: parsed.lookupUrl,
      });
      respondWithError(
        response,
        502,
        'lookupRequestFailed',
        'Could not retrieve channel information from YouTube. Please try again later.',
      );
      return;
    }

    const html = await fetchResponse.text();
    const channelId = extractChannelIdFromHtml(html);

    if (!channelId || !isChannelId(channelId)) {
      console.warn('channelId not found in response', { lookupUrl: parsed.lookupUrl });
      respondWithError(
        response,
        404,
        'channelNotFound',
        'The channel ID could not be determined.',
      );
      return;
    }

    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    response.status(200).json({ channelId });
  } catch (error) {
    console.error('Unexpected error during channel lookup', error);
    respondWithError(
      response,
      500,
      'lookupUnexpectedError',
      'An unexpected error occurred while resolving the channel ID.',
    );
  }
}
