// src/popup/translationManager.js

import Browser from "webextension-polyfill";
import elements from "./domElements.js";
import * as uiManager from "./uiManager.js";
import {
  getLanguagePromptName,
  getLanguageDisplayValue,
} from "./languageManager.js"; // Use lookup from lang manager
import { getLanguageCode, AUTO_DETECT_VALUE } from "../utils/tts.js"; // For saving storage
import { logME } from "../utils/helpers.js";
import {
  correctTextDirection,
  applyElementDirection,
} from "../utils/textDetection.js";
import { marked } from "marked";
import { TranslationMode } from "../config.js";
import { getTranslationString, parseBoolean } from "../utils/i18n.js";
import { getErrorMessageByKey } from "../services/ErrorMessages.js";
import { determineTranslationMode } from "../utils/translationModeHelper.js";
import DOMPurify from "dompurify";

/**
 * Always return the original error message (untranslated).
 */
function extractErrorMessage(err) {
  if (!err) return "";
  if (typeof err === "string") return err;
  // If normalized Error has original message stored
  if (err._originalMessage && typeof err._originalMessage === "string") {
    return err._originalMessage;
  }
  if (typeof err.message === "string") return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return "";
  }
}

/** نمایش نتیجهٔ ترجمه یا پیام خطا در Popup */
async function handleTranslationResponse(
  response,
  textToTranslate,
  sourceLangIdentifier,
  targetLangIdentifier
) {
  // Hide Google Translate link by default
  if (elements.googleResultLink) {
    elements.googleResultLink.style.display = "none";
  }
  // ❶ WebExtension channel error
  if (Browser.runtime.lastError) {
    const msg = Browser.runtime.lastError.message;
    elements.translationResult.textContent = msg;
    correctTextDirection(elements.translationResult, msg);
    uiManager.toggleInlineToolbarVisibility(elements.translationResult);
    return;
  }

  // ❷ Successful translation
  if (response?.success && response.data?.translatedText) {
    const translated = response.data.translatedText;
    elements.translationResult.classList.remove("fade-in");
    void elements.translationResult.offsetWidth;

    // ساخت و درج امن با DOM API بجای innerHTML
    const rawHtml = marked.parse(translated);
    const sanitized = DOMPurify.sanitize(rawHtml, {
      RETURN_TRUSTED_TYPE: true,
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitized.toString(), "text/html");

    elements.translationResult.textContent = "";
    Array.from(doc.body.childNodes).forEach((node) => {
      elements.translationResult.appendChild(node);
    });
    elements.translationResult.classList.add("fade-in");

    correctTextDirection(elements.translationResult, translated);

    if (elements.googleResultLink) {
      const sl =
        getLanguageCode(sourceLangIdentifier) ||
        response.data.detectedSourceLang ||
        "auto";
      const tl = getLanguageCode(targetLangIdentifier) || "auto";
      const encoded = encodeURIComponent(textToTranslate);
      elements.googleResultLink.href =
        `https://translate.google.com/?sl=${sl}&tl=${tl}&text=${encoded}&op=translate`;
      elements.googleResultLink.textContent =
        (await getTranslationString(
          "popup_open_in_google_translate_link"
        )) || "Open in Google Translate";
      elements.googleResultLink.title =
        (await getTranslationString(
          "popup_open_in_google_translate_title"
        )) || "Open in Google Translate";
      elements.googleResultLink.style.display = "inline-block";
    }

    const sourceLangCode = getLanguageCode(sourceLangIdentifier);
    const targetLangCode = getLanguageCode(targetLangIdentifier);

    Browser.storage.local
      .set({
        lastTranslation: {
          sourceText: textToTranslate,
          translatedText: translated,
          sourceLanguage: sourceLangCode || AUTO_DETECT_VALUE,
          targetLanguage: targetLangCode,
        },
      })
      .then(() => {
        logME("[Translate]: Last translation saved to storage.");
      })
      .catch((error) => {
        logME("[Translate]: Error saving last translation:", error);
      });

    if (
      response.data.detectedSourceLang &&
      (!sourceLangCode || sourceLangCode === AUTO_DETECT_VALUE)
    ) {
      const detectedDisplay = getLanguageDisplayValue(
        response.data.detectedSourceLang
      );
      if (detectedDisplay) {
        elements.sourceLanguageInput.value = detectedDisplay;
        uiManager.toggleClearButtonVisibility(
          elements.sourceLanguageInput,
          elements.clearSourceLanguage
        );
        logME(
          `[Translate]: Source language updated to detected: ${detectedDisplay}`
        );
      }
    }
  } else {
    // ❸ API error: always show original error
    const fallback =
      (await getTranslationString("popup_string_translate_error_response")) ||
      "(⚠️ خطایی در ترجمه رخ داد.)";

    let msg = extractErrorMessage(response?.error) || fallback;

    // Translate default errors created manually
    // If not translated, the error key itself will be shown
    // So before displaying, we check and replace it with the actual error message if available
    const error_msg = getErrorMessageByKey(msg);
    if (error_msg) {
      msg = error_msg;
    }

    // Clear and display error
    elements.translationResult.innerHTML = "";
    elements.translationResult.textContent = msg;
    correctTextDirection(elements.translationResult, msg);
    if (elements.googleResultLink) {
      elements.googleResultLink.style.display = "none";
    }

    logME("[Translate-Popup] API error:", msg);
  }

  // Always show toolbar after result/error
  uiManager.toggleInlineToolbarVisibility(elements.translationResult);
}

async function triggerTranslation() {
  const textToTranslate = elements.sourceText.value.trim();
  const targetLangIdentifier = elements.targetLanguageInput.value.trim();
  const sourceLangIdentifier = elements.sourceLanguageInput.value.trim();

  if (elements.googleResultLink) {
    elements.googleResultLink.style.display = "none";
  }

  if (!textToTranslate) {
    elements.sourceText.focus();
    logME("[Translate-Popup]: No text to translate.");
    return;
  }
  correctTextDirection(elements.sourceText, textToTranslate);
  applyElementDirection(
    elements.translationResult,
    parseBoolean(await getTranslationString("IsRTL"))
  );

  if (!targetLangIdentifier) {
    logME("[Translate-Popup]: Missing target language identifier.");
    elements.targetLanguageInput.focus();
    uiManager.showVisualFeedback(
      elements.targetLanguageInput.parentElement,
      "error",
      500
    );
    return;
  }

  const targetLangCodeCheck = getLanguagePromptName(targetLangIdentifier);
  if (!targetLangCodeCheck || targetLangCodeCheck === AUTO_DETECT_VALUE) {
    logME(
      "[Translate-Popup]: Invalid target language selected:",
      targetLangIdentifier
    );
    elements.targetLanguageInput.focus();
    uiManager.showVisualFeedback(
      elements.targetLanguageInput.parentElement,
      "error",
      500
    );
    return;
  }

  let sourceLangCheck = getLanguagePromptName(sourceLangIdentifier);
  if (!sourceLangCheck || sourceLangCheck === AUTO_DETECT_VALUE) {
    sourceLangCheck = null;
  }

  // Show spinner
  const spinnerHTML = `
<div class="spinner-overlay">
  <div class="spinner-center">
    <div class="spinner"></div>
  </div>
</div>
`;

  const sanitized = DOMPurify.sanitize(spinnerHTML, {
    RETURN_TRUSTED_TYPE: true,
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitized.toString(), "text/html");

  elements.translationResult.textContent = "";
  Array.from(doc.body.childNodes).forEach((node) => {
    elements.translationResult.appendChild(node);
  });

  uiManager.toggleInlineToolbarVisibility(elements.translationResult);

  // Determine translateMode (dictionary vs full)
  const translateMode = determineTranslationMode(
    textToTranslate,
    TranslationMode.Popup_Translate
  );

  try {
    const response = await Browser.runtime.sendMessage({
      action: "fetchTranslation",
      payload: {
        promptText: textToTranslate,
        sourceLanguage: sourceLangCheck,
        targetLanguage: targetLangCodeCheck,
        translateMode,
      },
    });

    logME("[Translate-Popup]: Response from background:", response);
    await handleTranslationResponse(
      response,
      textToTranslate,
      sourceLangIdentifier,
      targetLangIdentifier
    );
  } catch (error) {
    logME("[Translate-Popup]: Error sending message to background:", error);

    const fallback =
      (await getTranslationString("popup_string_translate_error_trigger")) ||
      "(⚠️ خطایی در ترجمه پاپ‌آپ رخ داد.)";
    const errMsg = extractErrorMessage(error) || fallback;

    elements.translationResult.innerHTML = "";
    elements.translationResult.textContent = errMsg;
    correctTextDirection(elements.translationResult, errMsg);

    uiManager.toggleInlineToolbarVisibility(elements.translationResult);
  }
}

function setupEventListeners() {
  elements.translationForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    logME("[Translate-Popup]: Translation form submitted via button.");
    triggerTranslation();
  });

  elements.sourceText?.addEventListener("keydown", (event) => {
    const isModifierPressed = event.ctrlKey || event.metaKey;
    const isEnterKey = event.key === "Enter";
    const isSlashKey = event.key === "/";

    if (isModifierPressed && (isEnterKey || isSlashKey)) {
      event.preventDefault();
      logME(
        `[Translate-Popup]: Shortcut (${event.ctrlKey ? "Ctrl" : "Cmd"}+${event.key}) triggered translation.`
      );
      triggerTranslation(); // Call the main translation logic directly
    }
  });

  // Update source toolbar visibility on input
  elements.sourceText?.addEventListener("input", () => {
    uiManager.toggleInlineToolbarVisibility(elements.sourceText);
  });
}

export function init() {
  setupEventListeners();
  logME("[Translate-Popup]: Initialized.");
}
