// src/popup/initializationManager.js

import Browser from "webextension-polyfill";
import elements from "./domElements.js";
import * as uiManager from "./uiManager.js";
import { getTargetLanguageAsync } from "../config.js";
import { getLanguageDisplayValue } from "./languageManager.js"; // Use lookup
import { AUTO_DETECT_VALUE, getLanguageCode } from "../utils/tts.js";
import { logME } from "../utils/helpers.js";
import { correctTextDirection } from "../utils/textDetection.js";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { getTranslationString } from "../utils/i18n.js";

async function loadLastTranslationFromStorage(setDefaultTargetLang = true) {
  try {
    const result = await Browser.storage.local.get(["lastTranslation"]);
    let targetLangValue = "";

      if (result.lastTranslation) {
        logME("[InitManager]: Loading last translation from storage.");

      elements.sourceText.value = result.lastTranslation.sourceText || "";
      correctTextDirection(
        elements.sourceText,
        result.lastTranslation.sourceText
      );

      const rawHtml = marked.parse(result.lastTranslation.translatedText || "");
      const sanitized = DOMPurify.sanitize(rawHtml, {
        RETURN_TRUSTED_TYPE: true,
      });

      const parser = new DOMParser();
      const doc = parser.parseFromString(sanitized.toString(), "text/html");

        elements.translationResult.textContent = "";
        Array.from(doc.body.childNodes).forEach((node) => {
          elements.translationResult.appendChild(node);
        });

      correctTextDirection(
        elements.translationResult,
        result.lastTranslation.translatedText
      );

      elements.sourceLanguageInput.value =
        getLanguageDisplayValue(result.lastTranslation.sourceLanguage) ||
        AUTO_DETECT_VALUE;

        targetLangValue = getLanguageDisplayValue(
          result.lastTranslation.targetLanguage
        );

        if (elements.googleResultLink) {
          const sl =
            getLanguageCode(result.lastTranslation.sourceLanguage) || "auto";
          const tl =
            getLanguageCode(result.lastTranslation.targetLanguage) || "auto";
          const encoded = encodeURIComponent(
            result.lastTranslation.sourceText || ""
          );
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
      } else {
        logME("[InitManager]: No last translation found in storage.");
        elements.sourceText.value = "";
        elements.translationResult.textContent = "";
        elements.sourceLanguageInput.value = AUTO_DETECT_VALUE;
        if (elements.googleResultLink) {
          elements.googleResultLink.style.display = "none";
        }
      }

    if (
      (setDefaultTargetLang && !targetLangValue) ||
      targetLangValue === AUTO_DETECT_VALUE
    ) {
      try {
        const storedTargetLang = await getTargetLanguageAsync();
        targetLangValue =
          getLanguageDisplayValue(storedTargetLang) ||
          getLanguageDisplayValue("en");
      } catch (err) {
        logME("[InitManager]: Error getting default target language:", err);
        targetLangValue = getLanguageDisplayValue("en");
      }
    }

    if (targetLangValue) {
      elements.targetLanguageInput.value = targetLangValue;
    }

    uiManager.toggleClearButtonVisibility(
      elements.sourceLanguageInput,
      elements.clearSourceLanguage
    );
    uiManager.toggleClearButtonVisibility(
      elements.targetLanguageInput,
      elements.clearTargetLanguage
    );
    uiManager.toggleInlineToolbarVisibility(elements.sourceText);
    uiManager.toggleInlineToolbarVisibility(elements.translationResult);
  } catch (error) {
    logME("[InitManager]: Error loading last translation:", error);
  }
}

async function loadInitialState() {
  try {
    const tabs = await Browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tabs.length > 0 && tabs[0].id != null) {
      const activeTabId = tabs[0].id;
      try {
        let response = {};
        try {
          response = await Browser.tabs.sendMessage(activeTabId, {
            action: "getSelectedText",
          });
        } catch (err) {
          logME(
            `[InitManager]: Failed to sendMessage to content script: ${err.message}`
          );
        }

        if (response?.selectedText) {
          logME("[InitManager]: Received selected text from content script.");
          elements.sourceText.value = response.selectedText;
          elements.translationResult.textContent = "";
          elements.sourceLanguageInput.value = AUTO_DETECT_VALUE;

          uiManager.toggleClearButtonVisibility(
            elements.sourceLanguageInput,
            elements.clearSourceLanguage
          );
          uiManager.toggleClearButtonVisibility(
            elements.targetLanguageInput,
            elements.clearTargetLanguage
          );
          uiManager.toggleInlineToolbarVisibility(elements.sourceText);
          uiManager.toggleInlineToolbarVisibility(elements.translationResult);
          if (elements.googleResultLink) {
            elements.googleResultLink.style.display = "none";
          }
        } else {
          logME(
            "[InitManager]: No selected text received. Loading from storage."
          );
          await loadLastTranslationFromStorage();
        }
      } catch (err) {
        logME(
          `[InitManager]: Error getting selected text (Tab ${activeTabId}): ${err.message}. Loading from storage.`
        );
        await loadLastTranslationFromStorage();
      }
    } else {
      logME("[InitManager]: No active/valid tab. Loading from storage.");
      await loadLastTranslationFromStorage();
    }
  } catch (error) {
    logME("[InitManager]: Error loading initial state:", error);
  }
}

export async function init() {
  await loadInitialState();
  logME("[InitManager]: Initialized.");
}
