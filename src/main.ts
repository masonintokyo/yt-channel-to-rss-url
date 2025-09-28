import {
  buildFeedUrl,
  parseChannelIdentifier,
  ChannelIdentifierResult,
} from './conversion';

const form = document.querySelector<HTMLFormElement>('#converter-form');
const inputField = document.querySelector<HTMLInputElement>('#channel-input');
const outputContainer = document.querySelector<HTMLDivElement>('#output');
const resultField = document.querySelector<HTMLInputElement>('#rss-result');
const errorField = document.querySelector<HTMLParagraphElement>('#error-message');
const copyButton = document.querySelector<HTMLButtonElement>('#copy-button');

function resetMessages() {
  if (errorField) {
    errorField.textContent = '';
    errorField.hidden = true;
  }
  if (outputContainer) {
    outputContainer.hidden = true;
  }
}

function showError(message: string) {
  if (errorField) {
    errorField.textContent = message;
    errorField.hidden = false;
  }
}

function showResult(channelId: string) {
  if (outputContainer && resultField) {
    resultField.value = buildFeedUrl(channelId);
    outputContainer.hidden = false;
  }
}

async function resolveChannelId(result: ChannelIdentifierResult): Promise<void> {
  if (result.status === 'channelId') {
    showResult(result.channelId);
    return;
  }

  if (result.status === 'needsLookup') {
    try {
      const response = await fetch(`/api/resolve?input=${encodeURIComponent(result.lookupUrl)}`);
      if (!response.ok) {
        const message = await response.text();
        showError(message || 'チャンネル ID の取得に失敗しました。');
        return;
      }
      const data: { channelId?: string; message?: string } = await response.json();
      if (data.channelId) {
        showResult(data.channelId);
      } else {
        showError(data.message ?? 'チャンネル ID を特定できませんでした。');
      }
    } catch (error) {
      showError('チャンネル ID の取得に失敗しました。通信環境を確認してください。');
    }
    return;
  }

  showError(result.message);
}

if (form && inputField) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    resetMessages();
    const result = parseChannelIdentifier(inputField.value);
    await resolveChannelId(result);
  });
}

if (copyButton && resultField) {
  copyButton.addEventListener('click', async () => {
    if (!resultField.value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(resultField.value);
      copyButton.textContent = 'コピーしました';
      setTimeout(() => {
        copyButton.textContent = 'コピー';
      }, 2000);
    } catch (error) {
      showError('クリップボードへコピーできませんでした。手動でコピーしてください。');
    }
  });
}
