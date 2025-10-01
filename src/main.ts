import {
  buildFeedUrl,
  parseChannelIdentifier,
  type ChannelIdentifierResult,
  type ErrorMessageKey,
} from './conversion.js';

const inputField = document.querySelector<HTMLInputElement>('#channel-input');
const outputContainer = document.querySelector<HTMLDivElement>('#output');
const resultField = document.querySelector<HTMLInputElement>('#rss-result');
const errorField = document.querySelector<HTMLParagraphElement>('#error-message');
const successField = document.querySelector<HTMLParagraphElement>('#success-message');
const copyButton = document.querySelector<HTMLButtonElement>('#copy-button');
const convertButton = document.querySelector<HTMLButtonElement>('#convert-button');
const titleElement = document.querySelector<HTMLElement>('[data-i18n="title"]');
const descriptionElement = document.querySelector<HTMLElement>('[data-i18n="description"]');
const inputLabelElement = document.querySelector<HTMLLabelElement>('#channel-input-label');
const resultLabelElement = document.querySelector<HTMLLabelElement>('[data-i18n="resultLabel"]');
const hintElement = document.querySelector<HTMLElement>('[data-i18n="hint"]');
const languageLabelElement = document.querySelector<HTMLLabelElement>('[data-i18n="languageLabel"]');
const languageSelect = document.querySelector<HTMLSelectElement>('#language-select');
const developerTitleElement = document.querySelector<HTMLElement>('[data-i18n="developerTitle"]');
const developerDescriptionElement = document.querySelector<HTMLElement>('[data-i18n="developerDescription"]');
const developerXLabelElement = document.querySelector<HTMLElement>('[data-i18n="developerXLabel"]');
const developerGithubLabelElement = document.querySelector<HTMLElement>('[data-i18n="developerGithubLabel"]');
const developerBtcLabelElement = document.querySelector<HTMLElement>('[data-i18n="developerBtcLabel"]');
const developerEthLabelElement = document.querySelector<HTMLElement>('[data-i18n="developerEthLabel"]');
const donationNoteElement = document.querySelector<HTMLElement>('[data-i18n="donationNote"]');
const languageOptionEn = languageSelect?.querySelector<HTMLOptionElement>('option[value="en"]') ?? null;
const languageOptionJa = languageSelect?.querySelector<HTMLOptionElement>('option[value="ja"]') ?? null;
const developerXLink = document.querySelector<HTMLAnchorElement>('#developer-x');
const developerGithubLink = document.querySelector<HTMLAnchorElement>('#developer-github');
const developerBtcAddress = document.querySelector<HTMLElement>('#developer-btc');
const developerEthAddress = document.querySelector<HTMLElement>('#developer-eth');

const pageTitle = document.querySelector('title');

const developerInfo = {
  xHandle: '@yourhandle',
  xUrl: 'https://x.com/yourhandle',
  githubHandle: 'yourhandle',
  githubUrl: 'https://github.com/yourhandle',
  btcAddress: 'bc1-your-bitcoin-address',
  ethAddress: '0xyourethereumaddress',
};

type Language = 'en' | 'ja';
type LookupErrorMessageKey = 'lookupRequestFailed' | 'channelNotFound' | 'lookupUnexpectedError';
type UiErrorKey =
  | ErrorMessageKey
  | LookupErrorMessageKey
  | 'networkError'
  | 'copyFailed'
  | 'clipboardUnavailable';
type SuccessMessageKey = 'successGenerated' | 'successUpdated';

type Translation = {
  ui: {
    pageTitle: string;
    title: string;
    description: string;
    inputLabel: string;
    placeholder: string;
    convert: string;
    resultLabel: string;
    copy: string;
    copySuccess: string;
    hint: string;
    languageLabel: string;
    languageOptionEnglish: string;
    languageOptionJapanese: string;
    developerTitle: string;
    developerDescription: string;
    developerXLabel: string;
    developerGithubLabel: string;
    developerBtcLabel: string;
    developerEthLabel: string;
    donationNote: string;
    successGenerated: string;
    successUpdated: string;
  };
  errors: Partial<Record<UiErrorKey, string>>;
  defaultError: string;
};

const translations: Record<Language, Translation> = {
  en: {
    ui: {
      pageTitle: 'YouTube Channel RSS Converter',
      title: 'YouTube Channel RSS Converter',
      description:
        'Paste a YouTube channel URL, video URL, or @handle to generate the RSS feed URL.',
      inputLabel: 'Channel, video URL, or @handle',
      placeholder: 'https://www.youtube.com/@example',
      convert: 'Convert',
      resultLabel: 'RSS feed URL',
      copy: 'Copy',
      copySuccess: 'Copied!',
      hint: 'Paste this URL into your RSS reader.',
      languageLabel: 'Language',
      languageOptionEnglish: 'English',
      languageOptionJapanese: '日本語',
      developerTitle: 'Developer Links & Support',
      developerDescription: 'Connect with the developer or send a donation:',
      developerXLabel: 'X (Twitter)',
      developerGithubLabel: 'GitHub',
      developerBtcLabel: 'BTC Address',
      developerEthLabel: 'ETH Address',
      donationNote: 'Donations are optional but greatly appreciated.',
      successGenerated: 'RSS feed URL generated successfully.',
      successUpdated: 'RSS feed URL updated.',
    },
    errors: {
      emptyInput: 'Input is empty. Please enter a channel URL, video URL, or @handle.',
      urlParseFailed: 'Failed to parse the URL. Please check its format.',
      unsupportedUrl: 'Could not detect a channel ID from this URL.',
      nonYoutubeUrl: 'Please enter a YouTube URL.',
      lookupRequestFailed: 'Could not retrieve channel information from YouTube. Please try again later.',
      channelNotFound: 'The channel ID could not be determined.',
      lookupUnexpectedError: 'An unexpected error occurred while resolving the channel ID.',
      networkError: 'Failed to retrieve the channel ID. Please check your connection.',
      copyFailed: 'Could not copy to the clipboard. Please copy the URL manually.',
      clipboardUnavailable: 'Clipboard access is not available. Please copy the URL manually.',
    },
    defaultError: 'An unexpected error occurred.',
  },
  ja: {
    ui: {
      pageTitle: 'YouTube チャンネル RSS 変換ツール',
      title: 'YouTube チャンネル RSS 変換ツール',
      description:
        'YouTube のチャンネル URL・動画 URL・@ハンドルを貼り付けると RSS フィード URL を生成します。',
      inputLabel: 'チャンネル / 動画 URL または @ハンドル',
      placeholder: 'https://www.youtube.com/@example',
      convert: '変換する',
      resultLabel: 'RSS フィード URL',
      copy: 'コピー',
      copySuccess: 'コピーしました',
      hint: 'この URL を RSS リーダーに貼り付けて利用できます。',
      languageLabel: '言語',
      languageOptionEnglish: 'English',
      languageOptionJapanese: '日本語',
      developerTitle: '開発者情報と支援',
      developerDescription: '開発者とつながる、または寄付で支援できます。',
      developerXLabel: 'X (旧Twitter)',
      developerGithubLabel: 'GitHub',
      developerBtcLabel: 'BTC アドレス',
      developerEthLabel: 'ETH アドレス',
      donationNote: '寄付は任意ですが大変励みになります。',
      successGenerated: 'RSS フィード URL を生成しました。',
      successUpdated: 'RSS フィード URL を更新しました。',
    },
    errors: {
      emptyInput: '入力が空です。チャンネル URL、動画 URL、または @ハンドルを入力してください。',
      urlParseFailed: 'URL を解析できませんでした。形式を確認してください。',
      unsupportedUrl: 'この URL からチャンネル ID を検出できませんでした。',
      nonYoutubeUrl: 'YouTube の URL を入力してください。',
      lookupRequestFailed: 'YouTube からチャンネル情報を取得できませんでした。時間をおいて再度お試しください。',
      channelNotFound: 'チャンネル ID を特定できませんでした。',
      lookupUnexpectedError: 'チャンネル ID の取得中に予期しないエラーが発生しました。',
      networkError: 'チャンネル ID の取得に失敗しました。通信環境を確認してください。',
      copyFailed: 'クリップボードへコピーできませんでした。手動でコピーしてください。',
      clipboardUnavailable: 'クリップボード機能が利用できません。ブラウザの設定を確認してください。',
    },
    defaultError: '不明なエラーが発生しました。',
  },
};

let currentLanguage: Language = 'en';
let lastError: { key: UiErrorKey; fallback?: string } | null = null;
let copyResetTimer: number | null = null;
let successResetTimer: number | null = null;
let lastSuccessKey: SuccessMessageKey | null = null;
let lastFeedUrl: string | null = null;
let activeConversionToken = 0;

function setDocumentLanguage(lang: Language) {
  document.documentElement.lang = lang;
}

function applyDeveloperInfo(): void {
  if (developerXLink) {
    developerXLink.href = developerInfo.xUrl;
    developerXLink.textContent = developerInfo.xHandle;
  }
  if (developerGithubLink) {
    developerGithubLink.href = developerInfo.githubUrl;
    developerGithubLink.textContent = developerInfo.githubHandle;
  }
  if (developerBtcAddress) {
    developerBtcAddress.textContent = developerInfo.btcAddress;
  }
  if (developerEthAddress) {
    developerEthAddress.textContent = developerInfo.ethAddress;
  }
}

function getErrorMessage(key: UiErrorKey, fallback?: string): string {
  const translation = translations[currentLanguage];
  const localized = translation.errors[key];
  if (localized) {
    return localized;
  }
  const englishFallback = translations.en.errors[key];
  if (englishFallback) {
    return englishFallback;
  }
  return fallback ?? translation.defaultError;
}

function showErrorMessage(message: string) {
  if (!errorField) {
    return;
  }
  hideSuccessMessage();
  errorField.textContent = message;
  errorField.hidden = false;
}

function showErrorByKey(key: UiErrorKey, fallback?: string) {
  lastError = { key, fallback };
  showErrorMessage(getErrorMessage(key, fallback));
}

function resetError() {
  if (errorField) {
    errorField.textContent = '';
    errorField.hidden = true;
  }
  lastError = null;
}

function hideSuccessMessage() {
  if (!successField) {
    return;
  }
  successField.textContent = '';
  successField.hidden = true;
  lastSuccessKey = null;
  if (successResetTimer !== null) {
    window.clearTimeout(successResetTimer);
    successResetTimer = null;
  }
}

function showSuccessMessageByKey(key: SuccessMessageKey) {
  if (!successField) {
    return;
  }
  successField.textContent = translations[currentLanguage].ui[key];
  successField.hidden = false;
  lastSuccessKey = key;
  if (successResetTimer !== null) {
    window.clearTimeout(successResetTimer);
  }
  successResetTimer = window.setTimeout(() => {
    hideSuccessMessage();
  }, 4000);
}

function isActiveConversion(token: number): boolean {
  return token === activeConversionToken;
}

function setCopyButtonDefault() {
  if (!copyButton) {
    return;
  }
  copyButton.textContent = translations[currentLanguage].ui.copy;
}

function showCopySuccess() {
  if (!copyButton) {
    return;
  }
  copyButton.textContent = translations[currentLanguage].ui.copySuccess;
  if (copyResetTimer !== null) {
    window.clearTimeout(copyResetTimer);
  }
  copyResetTimer = window.setTimeout(() => {
    setCopyButtonDefault();
    copyResetTimer = null;
  }, 2000);
}

function resetMessages() {
  resetError();
  hideSuccessMessage();
  if (outputContainer) {
    outputContainer.hidden = true;
  }
  if (copyResetTimer !== null) {
    window.clearTimeout(copyResetTimer);
    copyResetTimer = null;
  }
  setCopyButtonDefault();
}

function showResult(channelId: string) {
  const feedUrl = buildFeedUrl(channelId);
  if (resultField) {
    resultField.value = feedUrl;
  }
  if (outputContainer) {
    outputContainer.hidden = false;
  }
  const messageKey: SuccessMessageKey = lastFeedUrl === null ? 'successGenerated' : 'successUpdated';
  lastFeedUrl = feedUrl;
  showSuccessMessageByKey(messageKey);
  resetError();
}

async function resolveChannelId(result: ChannelIdentifierResult, token: number): Promise<void> {
  if (!isActiveConversion(token)) {
    return;
  }

  if (result.status === 'channelId') {
    if (!isActiveConversion(token)) {
      return;
    }
    showResult(result.channelId);
    return;
  }

  if (result.status === 'needsLookup') {
    try {
      const response = await fetch(`/api/resolve?input=${encodeURIComponent(result.lookupUrl)}`);
      if (!isActiveConversion(token)) {
        return;
      }
      if (!response.ok) {
        let fallbackMessage = '';
        let messageKey: UiErrorKey | undefined;
        try {
          const errorPayload = (await response.json()) as {
            message?: string;
            messageKey?: UiErrorKey;
          };
          fallbackMessage = errorPayload.message ?? '';
          messageKey = errorPayload.messageKey;
        } catch (parseError) {
          fallbackMessage = await response.text();
        }
        if (!isActiveConversion(token)) {
          return;
        }
        if (messageKey) {
          showErrorByKey(messageKey, fallbackMessage);
        } else {
          showErrorByKey('lookupRequestFailed', fallbackMessage);
        }
        return;
      }
      const data = (await response.json()) as {
        channelId?: string;
        message?: string;
        messageKey?: UiErrorKey;
      };
      if (!isActiveConversion(token)) {
        return;
      }
      if (data.channelId) {
        showResult(data.channelId);
      } else if (data.messageKey) {
        showErrorByKey(data.messageKey, data.message);
      } else {
        showErrorByKey('channelNotFound', data.message);
      }
    } catch (error) {
      if (!isActiveConversion(token)) {
        return;
      }
      showErrorByKey('networkError');
    }
    return;
  }

  if (!isActiveConversion(token)) {
    return;
  }
  showErrorByKey(result.messageKey, result.message);
}

async function handleConversion(): Promise<void> {
  if (!inputField) {
    return;
  }

  const token = ++activeConversionToken;
  resetMessages();
  const result = parseChannelIdentifier(inputField.value);
  await resolveChannelId(result, token);
}

function applyTranslations() {
  setDocumentLanguage(currentLanguage);
  const translation = translations[currentLanguage];
  document.title = translation.ui.pageTitle;
  if (pageTitle) {
    pageTitle.textContent = translation.ui.pageTitle;
  }
  if (titleElement) {
    titleElement.textContent = translation.ui.title;
  }
  if (descriptionElement) {
    descriptionElement.textContent = translation.ui.description;
  }
  if (inputLabelElement) {
    inputLabelElement.textContent = translation.ui.inputLabel;
  }
  if (inputField) {
    inputField.placeholder = translation.ui.placeholder;
  }
  if (convertButton) {
    convertButton.textContent = translation.ui.convert;
  }
  if (resultLabelElement) {
    resultLabelElement.textContent = translation.ui.resultLabel;
  }
  if (hintElement) {
    hintElement.textContent = translation.ui.hint;
  }
  if (languageLabelElement) {
    languageLabelElement.textContent = translation.ui.languageLabel;
  }
  if (languageOptionEn) {
    languageOptionEn.textContent = translation.ui.languageOptionEnglish;
  }
  if (languageOptionJa) {
    languageOptionJa.textContent = translation.ui.languageOptionJapanese;
  }
  if (developerTitleElement) {
    developerTitleElement.textContent = translation.ui.developerTitle;
  }
  if (developerDescriptionElement) {
    developerDescriptionElement.textContent = translation.ui.developerDescription;
  }
  if (developerXLabelElement) {
    developerXLabelElement.textContent = translation.ui.developerXLabel;
  }
  if (developerGithubLabelElement) {
    developerGithubLabelElement.textContent = translation.ui.developerGithubLabel;
  }
  if (developerBtcLabelElement) {
    developerBtcLabelElement.textContent = translation.ui.developerBtcLabel;
  }
  if (developerEthLabelElement) {
    developerEthLabelElement.textContent = translation.ui.developerEthLabel;
  }
  if (donationNoteElement) {
    donationNoteElement.textContent = translation.ui.donationNote;
  }
  setCopyButtonDefault();
  if (successField && !successField.hidden && lastSuccessKey) {
    successField.textContent = translation.ui[lastSuccessKey];
  }
  if (lastError) {
    showErrorByKey(lastError.key, lastError.fallback);
  }
}

if (convertButton) {
  convertButton.addEventListener('click', async () => {
    await handleConversion();
  });
}

if (inputField) {
  inputField.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await handleConversion();
    }
  });
}

if (copyButton && resultField) {
  copyButton.addEventListener('click', async () => {
    if (!resultField.value) {
      return;
    }
    if (!navigator.clipboard) {
      showErrorByKey('clipboardUnavailable');
      return;
    }
    try {
      await navigator.clipboard.writeText(resultField.value);
      showCopySuccess();
    } catch (error) {
      showErrorByKey('copyFailed');
    }
  });
}

if (languageSelect) {
  languageSelect.value = currentLanguage;
  languageSelect.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement;
    if (target.value === 'en' || target.value === 'ja') {
      currentLanguage = target.value;
      applyTranslations();
    }
  });
}

applyDeveloperInfo();
applyTranslations();
