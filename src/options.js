// src/options.js

import Browser from "webextension-polyfill";
import { getSettingsAsync, CONFIG } from "./config.js";
import { ErrorHandler } from "./services/ErrorService.js";
import { ErrorTypes } from "./services/ErrorTypes.js";
import { logME } from "./utils/helpers.js";
import { app_localize, getTranslationString } from "./utils/i18n.js";
import { fadeOutInElement } from "./utils/i18n.helper.js";
import { applyTheme } from "./utils/theme.js";
import { marked } from "marked";
import DOMPurify from "dompurify";
import "./utils/localization.js";

document.addEventListener("DOMContentLoaded", async () => {
  // --- Element Selection ---
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContentContainer = document.querySelector(".tab-content-container");
  const errorHandler = new ErrorHandler();

  // --- Prompt Tab Button ---
  const promptTabButton = document.querySelector('a[data-tab="prompt"]');

  // Theme controls
  const themeSwitch = document.getElementById("theme-Switch");
  const themeAuto = document.getElementById("theme-Auto");

  // --- Theme Control Logic ---
  const setThemeControlsState = (currentThemeValue) => {
    if (!themeAuto || !themeSwitch) {
      logME("Theme control elements not found");
      return;
    }
    applyTheme(currentThemeValue);
    if (currentThemeValue === "auto") {
      themeAuto.checked = true;
      themeSwitch.disabled = true;
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        themeSwitch.checked = true;
      } else {
        themeSwitch.checked = false;
      }
    } else {
      themeAuto.checked = false;
      themeSwitch.disabled = false;
      themeSwitch.checked = currentThemeValue === "dark";
    }
    logME(`Theme controls updated: THEME = ${currentThemeValue}`);
  };

  // Initial theme load
  if (themeSwitch && themeAuto) {
    Browser.storage.local
      .get("THEME")
      .then((result) => {
        const savedTheme = result.THEME || CONFIG.THEME || "auto";
        setThemeControlsState(savedTheme);
      })
      .catch((err) => {
        logME("Error loading theme from storage:", err);
        setThemeControlsState(CONFIG.THEME || "auto");
      });

    // رویداد برای سوئیچ دستی تم (Light/Dark)
    themeSwitch.addEventListener("change", async () => {
      if (themeSwitch.disabled) return; // اگر سوئیچ غیرفعال است (Auto فعال است)، کاری نکن
      const newThemeValue = themeSwitch.checked ? "dark" : "light";
      await Browser.storage.local.set({ THEME: newThemeValue });
      applyTheme(newThemeValue); // فقط تم را اعمال کن، وضعیت کنترلرها نباید تغییر کند
      // themeAuto.checked باید false باشد، که با کلیک روی سوئیچ دستی، توسط کنترلر themeAuto مدیریت می‌شود اگر پیاده‌سازی شود
      // یا مستقیماً اینجا:
      // اگر به نحوی Auto هنوز تیک داشت
      if (themeAuto.checked) themeAuto.checked = false;
    });

    themeAuto.addEventListener("change", async () => {
      const newThemeToApply =
        themeAuto.checked ? "auto"
        : themeSwitch.checked ? "dark"
        : "light";
      await Browser.storage.local.set({ THEME: newThemeToApply });
      setThemeControlsState(newThemeToApply);
    });
  }

  const selectionModeImmediateRadio = document.getElementById(
    "selection-mode-immediate"
  );
  const selectionModeOnClickRadio = document.getElementById(
    "selection-mode-onclick"
  );
  const selectionModeGroup = document.getElementById("selectionModeGroup");

  const extensionEnabledCheckbox = document.getElementById("extensionEnabled");
  const translateOnTextFieldsCheckbox = document.getElementById(
    "translateOnTextFields"
  );
  const enableShortcutForTextFieldsCheckbox = document.getElementById(
    "enableShortcutForTextFields"
  );

  const copy_on_clipboadRadiobox = document.getElementById(
    "textField-mode-Copy"
  );
  const replace_on_textfieldRadiobox = document.getElementById(
    "textField-mode-replace"
  );
  const replace_on_special_sitesCheckbox = document.getElementById(
    "replace_on_special_sites"
  );

  const translateWithSelectElementCheckbox = document.getElementById(
    "translateWithSelectElement"
  );
  const translateOnTextSelectionCheckbox = document.getElementById(
    "translateOnTextSelection"
  );
  const requireCtrlForTextSelectionCheckbox = document.getElementById(
    "requireCtrlForTextSelection"
  );
  const textSelectionCtrlGroup = document.getElementById(
    "textSelectionCtrlGroup"
  );
  const enableDictionraryCheckbox =
    document.getElementById("enableDictionrary");
  const translationApiSelect = document.getElementById("translationApi");
  const googleApiSettingsInfo = document.getElementById(
    "googleApiSettingsInfo"
  );
  const webAIApiSettings = document.getElementById("webAIApiSettings");
  const apiUrlSettingGroup = document
    .getElementById("apiUrl")
    ?.closest(".setting-group");
  const useMockCheckbox = document.getElementById("useMock");
  const debugModeCheckbox = document.getElementById("debugMode");
  const webAIApiUrlInput = document.getElementById("webAIApiUrl");
  const webAIApiModelInput = document.getElementById("webAIApiModel");
  const apiKeyInput = document.getElementById("apiKey");
  const apiUrlInput = document.getElementById("apiUrl");
  const saveSettingsButton = document.getElementById("saveSettings");
  const sourceLanguageInput = document.getElementById("sourceLanguage");
  const targetLanguageInput = document.getElementById("targetLanguage");
  const geminiApiSettings = document.getElementById("geminiApiSettings");
  const openAIApiSettings = document.getElementById("openAIApiSettings");
  const openAIApiKeyInput = document.getElementById("openaiApiKey");
  const openAIModelInput = document.getElementById("openaiApiModel");
  const openRouterApiSettings = document.getElementById(
    "openRouterApiSettings"
  );
  const openRouterApiKeyInput = document.getElementById("openrouterApiKey");
  const openRouterApiModelInput = document.getElementById("openrouterApiModel");
  const deepseekApiSettings = document.getElementById("deepseekApiSettings");
  const deepseekApiKeyInput = document.getElementById("deepseekApiKey");
  const deepseekApiModelInput = document.getElementById("deepseekApiModel");
  const customApiSettings = document.getElementById("customApiSettings");
  const customApiUrlInput = document.getElementById("customApiUrl");
  const customApiKeyInput = document.getElementById("customApiKey");
  const customApiModelInput = document.getElementById("customApiModel");
  const exportSettingsButton = document.getElementById("exportSettings");
  const importFile = document.getElementById("importFile");
  const statusElement = document.getElementById("status");
  const manifest_Name = document.getElementById("options_app_name");
  const manifest_Version = document.getElementById("options_app_version");
  const promptTemplateInput = document.getElementById("promptTemplate");
  const resetPromptButton = document.getElementById("resetPromptButton");
  const sourceLangNameSpan = document.getElementById("sourceLangName");
  const targetLangNameSpan = document.getElementById("targetLangName");
  const enableTwoWayCheckbox = document.getElementById("enableTwoWay");
  const excludedSites = document.getElementById("excludedSites");

  // --- Event Listener for the new Reset Button ---
  if (resetPromptButton && promptTemplateInput) {
    resetPromptButton.addEventListener("click", (event) => {
      event.preventDefault();

      // Set the textarea value to the default from CONFIG
      promptTemplateInput.value = CONFIG.PROMPT_TEMPLATE;

      // Apply flash effect for user feedback
      promptTemplateInput.classList.add("highlight-on-reset");

      // Remove the class after the animation completes
      setTimeout(() => {
        promptTemplateInput.classList.remove("highlight-on-reset");
      }, 800); // Duration should match the animation time
    });
  }

  // --- Accordion Logic ---
  const accordionItems = document.querySelectorAll(".accordion-item");
  accordionItems.forEach((item) => {
    const header = item.querySelector(".accordion-header");
    header.addEventListener("click", () => {
      // Close other items
      accordionItems.forEach((otherItem) => {
        if (otherItem !== item && otherItem.classList.contains("active")) {
          otherItem.classList.remove("active");
        }
      });
      // Toggle current item
      item.classList.toggle("active");
    });
  });

  // --- Deep-linking within Help Tab ---
  function handleHelpAnchor(hash) {
    if (hash && hash.startsWith("#help=")) {
      const subAnchor = hash.split("=")[1];
      if (subAnchor) {
        const targetItem = document.getElementById(`help-${subAnchor}`);
        if (targetItem) {
          // Ensure the help tab is shown first
          showTab("help");
          // Open the specific accordion item
          setTimeout(() => targetItem.classList.add("active"), 100);
        }
      }
    }
  }

  // --- Changelog Fetching Logic ---
  async function fetchAndDisplayChangelog() {
    const container = document.getElementById("changelog-container");
    try {
      const response = await fetch(CONFIG.CHANGELOG_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const markdownText = await response.text();
      // Sanitize the markdown output before setting innerHTML
      const rawHtml = marked.parse(markdownText); // Convert Markdown to HTML
      // Sanitize the HTML to prevent XSS attacks
      const sanitized = DOMPurify.sanitize(rawHtml, {
        RETURN_TRUSTED_TYPE: true,
      });
      // Use DOMParser to safely append sanitized HTML instead of direct innerHTML assignment
      const parser = new DOMParser();
      const doc = parser.parseFromString(sanitized.toString(), "text/html"); // Convert TrustedHTML to string for DOMParser

      // Clear existing content and append new nodes
      container.textContent = ""; // Clear existing content
      Array.from(doc.body.childNodes).forEach((node) =>
        container.appendChild(node)
      );
    } catch (error) {
      // Sanitize the error message before displaying it
      const sanitizedErrorMessage = DOMPurify.sanitize(error.message, {
        RETURN_TRUSTED_TYPE: true,
      });
      const parser = new DOMParser();
      const doc = parser.parseFromString(
        `<p>Could not load changelog. Error: ${sanitizedErrorMessage}</p>`,
        "text/html"
      );
      container.textContent = "";
      Array.from(doc.body.childNodes).forEach((node) =>
        container.appendChild(node)
      );

      logME("[Options] Failed to fetch changelog:", error);
    }
  }

  // Add listener to fetch changelog when about tab is clicked
  const aboutTabButton = document.querySelector('a[data-tab="about"]');
  if (aboutTabButton) {
    aboutTabButton.addEventListener("click", fetchAndDisplayChangelog, {
      once: true,
    }); // Fetch only once
  }

  // --- Dependency Logic ---
  function handleTextSelectionDependency() {
    if (
      !translateOnTextSelectionCheckbox ||
      !requireCtrlForTextSelectionCheckbox ||
      !textSelectionCtrlGroup ||
      !selectionModeImmediateRadio ||
      !selectionModeOnClickRadio ||
      !selectionModeGroup
    )
      return;

    const isTextSelectionEnabled =
      translateOnTextSelectionCheckbox.checked &&
      !translateOnTextSelectionCheckbox.disabled;
    const isImmediateModeEnabled = selectionModeImmediateRadio.checked;

    selectionModeGroup.style.opacity = isTextSelectionEnabled ? "1" : "0.2";
    selectionModeGroup.style.pointerEvents =
      isTextSelectionEnabled ? "auto" : "none";
    selectionModeImmediateRadio.disabled = !isTextSelectionEnabled;
    selectionModeOnClickRadio.disabled = !isTextSelectionEnabled;

    const isCtrlGroupEnabled = isTextSelectionEnabled && isImmediateModeEnabled;
    requireCtrlForTextSelectionCheckbox.disabled = !isCtrlGroupEnabled;
    textSelectionCtrlGroup.style.opacity = isCtrlGroupEnabled ? "1" : "0.2";
    textSelectionCtrlGroup.style.pointerEvents =
      isCtrlGroupEnabled ? "auto" : "none";
  }

  // --- Dependency Logic for Replace Mode ---
  function handleReplaceModeDependency() {
    if (
      !extensionEnabledCheckbox || // اطمینان از وجود کلید اصلی
      !replace_on_textfieldRadiobox ||
      !replace_on_special_sitesCheckbox ||
      !enableShortcutForTextFieldsCheckbox ||
      !translateOnTextFieldsCheckbox
    ) {
      return; // اگر عناصر لازم وجود ندارند، خارج شو
    }

    // شرط ۰: آیا کل افزونه غیرفعال است؟
    const isMasterDisabled = !extensionEnabledCheckbox.checked;

    // شرط ۱: آیا کنترل‌های والد غیرفعال هستند؟
    const areParentsDisabled =
      !enableShortcutForTextFieldsCheckbox.checked &&
      !translateOnTextFieldsCheckbox.checked;

    // شرط ۲: آیا حالت "جایگزینی" فعال است؟
    const isReplaceModeActive = replace_on_textfieldRadiobox.checked;

    // چک‌باکس باید غیرفعال باشد اگر «کل افزونه غیرفعال باشد» یا «والدها غیرفعال باشند» یا «حالت جایگزینی فعال باشد»
    const shouldBeDisabled =
      isMasterDisabled || areParentsDisabled || isReplaceModeActive;

    replace_on_special_sitesCheckbox.disabled = shouldBeDisabled;
    replace_on_special_sitesCheckbox
      .closest(".setting-group")
      ?.classList.toggle("disabled", shouldBeDisabled);

    // منطق تیک‌دار شدن: فقط وقتی حالت جایگزینی فعال است، تیک را اجباری کن
    if (isReplaceModeActive) {
      replace_on_special_sitesCheckbox.checked = true;
    }
  }

  [
    selectionModeImmediateRadio,
    selectionModeOnClickRadio,
    translateOnTextSelectionCheckbox,
  ].forEach((el) => {
    if (el) el.addEventListener("change", handleTextSelectionDependency);
  });

  function updateOverallExtensionDependency() {
    if (!extensionEnabledCheckbox) return;

    const isMasterEnabled = extensionEnabledCheckbox.checked;
    const isGoogleApi = translationApiSelect.value === "google";

    const topLevelControls = [
      translateOnTextFieldsCheckbox,
      enableShortcutForTextFieldsCheckbox,
      translateWithSelectElementCheckbox,
      translateOnTextSelectionCheckbox,
    ];

    topLevelControls.forEach((el) => {
      if (el) {
        el.disabled = !isMasterEnabled;
        el.closest(".setting-group")?.classList.toggle(
          "disabled",
          !isMasterEnabled
        );
      }
    });

    if (enableDictionraryCheckbox) {
      // گزینه‌ی دیکشنری باید غیرفعال شود اگر:
      // ۱. کل افزونه غیرفعال باشد.
      // ۲. یا API انتخاب شده Google Translate باشد.
      const shouldDictionaryBeDisabled = !isMasterEnabled || isGoogleApi;
      enableDictionraryCheckbox.disabled = shouldDictionaryBeDisabled;
      enableDictionraryCheckbox
        .closest(".setting-group")
        ?.classList.toggle("disabled", shouldDictionaryBeDisabled);
      if (isGoogleApi) {
        enableDictionraryCheckbox.checked = false;
      }
    }

    // این شرط مشخص می‌کند که آیا زیرمجموعه‌ها باید بر اساس کنترل‌کننده‌هایشان غیرفعال شوند یا خیر
    const shouldSubOptionsBeDisabled =
      !enableShortcutForTextFieldsCheckbox.checked &&
      !translateOnTextFieldsCheckbox.checked;

    const textFieldSubOptions = [
      copy_on_clipboadRadiobox,
      replace_on_textfieldRadiobox,
    ];

    textFieldSubOptions.forEach((el) => {
      if (el) {
        // یک کنترل باید غیرفعال باشد اگر کل افزونه غیرفعال باشد، یا هر دو کنترل‌کننده آن غیرفعال باشند
        const isFinallyDisabled =
          !isMasterEnabled || shouldSubOptionsBeDisabled;
        el.disabled = isFinallyDisabled;
        el.closest(".radio-option, .setting-group")?.classList.toggle(
          "disabled",
          isFinallyDisabled
        );
      }
    });

    handleReplaceModeDependency();

    handleTextSelectionDependency();
  }

  if (extensionEnabledCheckbox) {
    extensionEnabledCheckbox.addEventListener(
      "change",
      updateOverallExtensionDependency
    );
  }

  enableShortcutForTextFieldsCheckbox?.addEventListener(
    "change",
    updateOverallExtensionDependency
  );
  translateOnTextFieldsCheckbox?.addEventListener(
    "change",
    updateOverallExtensionDependency
  );

  copy_on_clipboadRadiobox?.addEventListener(
    "change",
    updateOverallExtensionDependency
  );
  replace_on_textfieldRadiobox?.addEventListener(
    "change",
    updateOverallExtensionDependency
  );

  // --- Tab Navigation Logic ---
  function showTab(tabId) {
    if (!tabId) return;
    const activeContent = tabContentContainer.querySelector(
      ".tab-content.active"
    );
    const targetContent = document.getElementById(tabId);

    if (activeContent === targetContent) return;

    if (window.history.replaceState) {
      window.history.replaceState(null, null, `#${tabId}`);
    }

    tabButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });

    const animate = () => {
      if (targetContent) {
        targetContent.classList.add("active");
      }
    };

    if (activeContent) {
      fadeOutInElement(
        activeContent,
        () => {
          activeContent.classList.remove("active");
          animate();
        },
        150
      );
    } else {
      animate();
    }
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      // Prevent action if the tab is disabled
      if (event.currentTarget.classList.contains("disabled")) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      const tabId = event.currentTarget.getAttribute("data-tab");
      showTab(tabId);
    });
  });

  // --- API Settings Visibility Logic (Refactored & Enhanced) ---
  function toggleApiSettings() {
    if (!translationApiSelect) return;
    const selectedApi = translationApiSelect.value;
    const isMock = useMockCheckbox ? useMockCheckbox.checked : false;

    const allApiSections = {
      google: googleApiSettingsInfo,
      webai: webAIApiSettings,
      gemini: geminiApiSettings,
      openai: openAIApiSettings,
      openrouter: openRouterApiSettings,
      deepseek: deepseekApiSettings,
      custom: customApiSettings,
    };

    // Hide all sections first

    // ... (کدهای موجود در این تابع برای نمایش و پنهان‌سازی بخش‌های API) ...
    // ... (منطق مربوط به غیرفعال کردن تب Prompt) ...

    Object.values(allApiSections).forEach((section) => {
      if (section) section.style.display = "none";
    });
    if (apiUrlSettingGroup) apiUrlSettingGroup.style.display = "none";

    if (!isMock) {
      // Show the selected API's section
      if (allApiSections[selectedApi]) {
        allApiSections[selectedApi].style.display = "block";
      }
      // Special case for Gemini API URL
      if (selectedApi === "gemini" && apiUrlSettingGroup) {
        apiUrlSettingGroup.style.display = "block";
      }
    }

    // --- Logic to disable/enable prompt tab ---
    if (promptTabButton) {
      const isGoogleTranslateForPrompt = selectedApi === "google";
      promptTabButton.classList.toggle("disabled", isGoogleTranslateForPrompt);

      // If the prompt tab is now disabled and was active, switch to the API tab
      if (
        isGoogleTranslateForPrompt &&
        promptTabButton.classList.contains("active")
      ) {
        showTab("api");
      }
    }

    // پس از هر تغییر API، وضعیت وابستگی‌ها را مجدداً ارزیابی کن
    updateOverallExtensionDependency();
  }

  if (translationApiSelect) {
    translationApiSelect.addEventListener("change", toggleApiSettings);
  }
  if (useMockCheckbox) {
    useMockCheckbox.addEventListener("change", toggleApiSettings);
  }

  // --- Save & Load Settings ---
  saveSettingsButton.addEventListener("click", async () => {
    const sourceLangValue = sourceLanguageInput.value.trim();
    const targetLangValue = targetLanguageInput.value.trim();

    // ▼▼▼ شروع اعتبارسنجی زبان مبدا و مقصد ▼▼▼
    // 1. بررسی کن آیا زبان مبدأ و مقصد یکسان هستند (بدون توجه به حروف بزرگ و کوچک)
    let validationError = false;
    let errorMessage = "";
    const errorInputs = [];

    // شرط ۱: بررسی خالی بودن فیلدهای زبان
    if (!sourceLangValue || !targetLangValue) {
      validationError = true;
      errorMessage =
        (await getTranslationString("options_error_empty_language")) ||
        "Language fields cannot be empty.";

      // فیلد خالی را برای نمایش خطا مشخص کن
      if (!sourceLangValue) errorInputs.push(sourceLanguageInput);
      if (!targetLangValue) errorInputs.push(targetLanguageInput);
    }
    // شرط ۲: بررسی یکی بودن زبان مبدأ و مقصد
    else if (sourceLangValue.toLowerCase() === targetLangValue.toLowerCase()) {
      validationError = true;
      errorMessage =
        (await getTranslationString("options_error_same_languages")) ||
        "Source and target languages cannot be the same.";

      // هر دو فیلد را برای نمایش خطا مشخص کن
      errorInputs.push(sourceLanguageInput, targetLanguageInput);
    }

    // اگر هر یک از خطاهای اعتبارسنجی رخ داده بود
    if (validationError) {
      // به تب مربوط به زبان‌ها برو
      showTab("languages");
      // پیام خطا را نمایش بده
      showStatus(errorMessage, "error");

      // به فیلدهای دارای خطا کلاس ارور را اضافه کن
      errorInputs.forEach((input) => input.classList.add("input-error"));

      // پس از ۲ ثانیه کلاس خطا را حذف کن
      setTimeout(() => {
        errorInputs.forEach((input) => input.classList.remove("input-error"));
      }, 2000);

      // از ادامه اجرای تابع و ذخیره تنظیمات جلوگیری کن
      return;
    }
    // ▲▲▲ پایان منطق اعتبارسنجی زبان مبدا و مقصد ▲▲▲

    let finalThemeValue;
    if (themeAuto?.checked) {
      finalThemeValue = "auto";
    } else {
      finalThemeValue = themeSwitch?.checked ? "dark" : "light";
    }

    const settingsToSave = {
      API_KEY: apiKeyInput?.value?.trim() || "",
      USE_MOCK: useMockCheckbox?.checked ?? CONFIG.USE_MOCK,
      DEBUG_MODE: debugModeCheckbox?.checked ?? CONFIG.DEBUG_MODE,
      EXTENSION_ENABLED:
        extensionEnabledCheckbox?.checked ?? CONFIG.EXTENSION_ENABLED,
      THEME: finalThemeValue,
      API_URL: apiUrlInput?.value?.trim() || CONFIG.API_URL,
      SOURCE_LANGUAGE: sourceLanguageInput?.value || CONFIG.SOURCE_LANGUAGE,
      TARGET_LANGUAGE: targetLanguageInput?.value || CONFIG.TARGET_LANGUAGE,
      PROMPT_TEMPLATE:
        promptTemplateInput?.value?.trim() || CONFIG.PROMPT_TEMPLATE,
      TRANSLATION_API: translationApiSelect?.value || CONFIG.TRANSLATION_API,
      WEBAI_API_URL: webAIApiUrlInput?.value?.trim() || CONFIG.WEBAI_API_URL,
      WEBAI_API_MODEL:
        webAIApiModelInput?.value?.trim() || CONFIG.WEBAI_API_MODEL,
      OPENAI_API_KEY: openAIApiKeyInput?.value?.trim() || CONFIG.OPENAI_API_KEY,
      OPENAI_API_MODEL:
        openAIModelInput?.value?.trim() || CONFIG.OPENAI_API_MODEL,
      OPENROUTER_API_KEY:
        openRouterApiKeyInput?.value?.trim() || CONFIG.OPENROUTER_API_KEY,
      OPENROUTER_API_MODEL:
        openRouterApiModelInput?.value?.trim() || CONFIG.OPENROUTER_API_MODEL,
      DEEPSEEK_API_KEY:
        deepseekApiKeyInput?.value?.trim() || CONFIG.DEEPSEEK_API_KEY,
      DEEPSEEK_API_MODEL:
        deepseekApiModelInput?.value?.trim() || CONFIG.DEEPSEEK_API_MODEL,
      CUSTOM_API_URL: customApiUrlInput?.value?.trim() || CONFIG.CUSTOM_API_URL,
      CUSTOM_API_KEY: customApiKeyInput?.value?.trim() || CONFIG.CUSTOM_API_KEY,
      CUSTOM_API_MODEL:
        customApiModelInput?.value?.trim() || CONFIG.CUSTOM_API_MODEL,
      TRANSLATE_ON_TEXT_FIELDS:
        translateOnTextFieldsCheckbox?.checked ??
        CONFIG.TRANSLATE_ON_TEXT_FIELDS,
      ENABLE_DICTIONARY:
        enableDictionraryCheckbox?.checked ?? CONFIG.ENABLE_DICTIONARY,
      ENABLE_TWO_WAY: enableTwoWayCheckbox?.checked ?? CONFIG.ENABLE_TWO_WAY,
      ENABLE_SHORTCUT_FOR_TEXT_FIELDS:
        enableShortcutForTextFieldsCheckbox?.checked ??
        CONFIG.ENABLE_SHORTCUT_FOR_TEXT_FIELDS,
      TRANSLATE_WITH_SELECT_ELEMENT:
        translateWithSelectElementCheckbox?.checked ??
        CONFIG.TRANSLATE_WITH_SELECT_ELEMENT,
      TRANSLATE_ON_TEXT_SELECTION:
        translateOnTextSelectionCheckbox?.checked ??
        CONFIG.TRANSLATE_ON_TEXT_SELECTION,
      REQUIRE_CTRL_FOR_TEXT_SELECTION:
        requireCtrlForTextSelectionCheckbox?.checked ??
        CONFIG.REQUIRE_CTRL_FOR_TEXT_SELECTION,
      EXCLUDED_SITES:
        excludedSites?.value
          ?.split(",")
          .map((s) => s.trim())
          .filter(Boolean) ?? [],
      selectionTranslationMode:
        selectionModeOnClickRadio?.checked ? "onClick" : "immediate",
      COPY_REPLACE: replace_on_textfieldRadiobox?.checked ? "replace" : "copy",
      REPLACE_SPECIAL_SITES:
        replace_on_special_sitesCheckbox?.checked ??
        CONFIG.REPLACE_SPECIAL_SITES,
    };

    try {
      await Browser.storage.local.set(settingsToSave);
      logME("Settings saved:", settingsToSave);
      await updatePromptHelpText(settingsToSave);
      showStatus(
        await getTranslationString("OPTIONS_STATUS_SAVED_SUCCESS"),
        "success"
      );
      setTimeout(() => showStatus(""), 2000);
    } catch (error) {
      errorHandler.handle(error, {
        type: ErrorTypes.UI,
        context: "saveSettings",
      });
      showStatus(
        await getTranslationString("OPTIONS_STATUS_SAVED_FAILED"),
        "error"
      );
      setTimeout(() => showStatus(""), 3000);
    }
  });

  async function updatePromptHelpText(currentSettings) {
    const settings = currentSettings || (await getSettingsAsync());
    const sourceLang = settings.SOURCE_LANGUAGE || CONFIG.SOURCE_LANGUAGE;
    const targetLang = settings.TARGET_LANGUAGE || CONFIG.TARGET_LANGUAGE;
    if (sourceLangNameSpan) sourceLangNameSpan.textContent = `(${sourceLang})`;
    if (targetLangNameSpan) targetLangNameSpan.textContent = `(${targetLang})`;
  }

  // =================================================================
  // START: CORRECTED loadSettings FUNCTION
  // =================================================================
  async function loadSettings() {
    try {
      const settings = await getSettingsAsync();
      const manifest = Browser.runtime.getManifest();

      // Populate manifest info
      if (manifest_Name)
        manifest_Name.textContent = CONFIG.APP_NAME || manifest.name;
      if (manifest_Version)
        manifest_Version.textContent = `v${manifest.version}`;

      // Populate checkboxes
      if (debugModeCheckbox)
        debugModeCheckbox.checked = settings.DEBUG_MODE ?? CONFIG.DEBUG_MODE;
      if (useMockCheckbox)
        useMockCheckbox.checked = settings.USE_MOCK ?? CONFIG.USE_MOCK;
      if (extensionEnabledCheckbox)
        extensionEnabledCheckbox.checked =
          settings.EXTENSION_ENABLED ?? CONFIG.EXTENSION_ENABLED;
      if (translateOnTextFieldsCheckbox)
        translateOnTextFieldsCheckbox.checked =
          settings.TRANSLATE_ON_TEXT_FIELDS ?? CONFIG.TRANSLATE_ON_TEXT_FIELDS;
      if (enableShortcutForTextFieldsCheckbox)
        enableShortcutForTextFieldsCheckbox.checked =
          settings.ENABLE_SHORTCUT_FOR_TEXT_FIELDS ??
          CONFIG.ENABLE_SHORTCUT_FOR_TEXT_FIELDS;

      // Populate new text field mode options
      if (copy_on_clipboadRadiobox && replace_on_textfieldRadiobox) {
        if (settings.COPY_REPLACE === "replace") {
          replace_on_textfieldRadiobox.checked = true;
        } else {
          copy_on_clipboadRadiobox.checked = true; // حالت پیش‌فرض 'copy' است
        }
      }

      if (replace_on_special_sitesCheckbox) {
        // با استفاده از ?? مقدار پیش‌فرض از CONFIG خوانده می‌شود اگر مقداری در حافظه نباشد
        replace_on_special_sitesCheckbox.checked =
          settings.REPLACE_SPECIAL_SITES ?? CONFIG.REPLACE_SPECIAL_SITES;
      }

      if (translateWithSelectElementCheckbox)
        translateWithSelectElementCheckbox.checked =
          settings.TRANSLATE_WITH_SELECT_ELEMENT ??
          CONFIG.TRANSLATE_WITH_SELECT_ELEMENT;
      if (translateOnTextSelectionCheckbox)
        translateOnTextSelectionCheckbox.checked =
          settings.TRANSLATE_ON_TEXT_SELECTION ??
          CONFIG.TRANSLATE_ON_TEXT_SELECTION;
      if (requireCtrlForTextSelectionCheckbox)
        requireCtrlForTextSelectionCheckbox.checked =
          settings.REQUIRE_CTRL_FOR_TEXT_SELECTION ??
          CONFIG.REQUIRE_CTRL_FOR_TEXT_SELECTION;
      if (enableDictionraryCheckbox)
        enableDictionraryCheckbox.checked =
          settings.ENABLE_DICTIONARY ?? CONFIG.ENABLE_DICTIONARY;
      if (enableTwoWayCheckbox)
        enableTwoWayCheckbox.checked =
          settings.ENABLE_TWO_WAY ?? CONFIG.ENABLE_TWO_WAY;

      // Populate text inputs and textareas
      if (sourceLanguageInput)
        sourceLanguageInput.value =
          settings.SOURCE_LANGUAGE || CONFIG.SOURCE_LANGUAGE;
      if (targetLanguageInput)
        targetLanguageInput.value =
          settings.TARGET_LANGUAGE || CONFIG.TARGET_LANGUAGE;
      if (promptTemplateInput)
        promptTemplateInput.value =
          settings.PROMPT_TEMPLATE || CONFIG.PROMPT_TEMPLATE;
      if (apiKeyInput) apiKeyInput.value = settings.API_KEY || "";
      if (apiUrlInput) apiUrlInput.value = settings.API_URL || CONFIG.API_URL;
      if (webAIApiUrlInput)
        webAIApiUrlInput.value = settings.WEBAI_API_URL || CONFIG.WEBAI_API_URL;
      if (webAIApiModelInput)
        webAIApiModelInput.value =
          settings.WEBAI_API_MODEL || CONFIG.WEBAI_API_MODEL;
      if (openAIApiKeyInput)
        openAIApiKeyInput.value =
          settings.OPENAI_API_KEY || CONFIG.OPENAI_API_KEY;
      if (openAIModelInput)
        openAIModelInput.value =
          settings.OPENAI_API_MODEL || CONFIG.OPENAI_API_MODEL;
      if (openRouterApiKeyInput)
        openRouterApiKeyInput.value =
          settings.OPENROUTER_API_KEY || CONFIG.OPENROUTER_API_KEY;
      if (openRouterApiModelInput)
        openRouterApiModelInput.value =
          settings.OPENROUTER_API_MODEL || CONFIG.OPENROUTER_API_MODEL;
      if (deepseekApiKeyInput)
        deepseekApiKeyInput.value =
          settings.DEEPSEEK_API_KEY || CONFIG.DEEPSEEK_API_KEY;
      if (deepseekApiModelInput)
        deepseekApiModelInput.value =
          settings.DEEPSEEK_API_MODEL || CONFIG.DEEPSEEK_API_MODEL;
      if (customApiUrlInput)
        customApiUrlInput.value =
          settings.CUSTOM_API_URL || CONFIG.CUSTOM_API_URL;
      if (customApiKeyInput)
        customApiKeyInput.value =
          settings.CUSTOM_API_KEY || CONFIG.CUSTOM_API_KEY;
      if (customApiModelInput)
        customApiModelInput.value =
          settings.CUSTOM_API_MODEL || CONFIG.CUSTOM_API_MODEL;
      if (excludedSites)
        excludedSites.value = (settings.EXCLUDED_SITES || []).join(", ");

      // Populate select/dropdown
      if (translationApiSelect)
        translationApiSelect.value =
          settings.TRANSLATION_API || CONFIG.TRANSLATION_API;

      // Populate radio buttons
      if (selectionModeImmediateRadio && selectionModeOnClickRadio) {
        if (settings.selectionTranslationMode === "onClick") {
          selectionModeOnClickRadio.checked = true;
        } else {
          selectionModeImmediateRadio.checked = true; // Default
        }
      }

      // --- Trigger UI updates that depend on the loaded settings ---
      toggleApiSettings();
      handleTextSelectionDependency();
      updateOverallExtensionDependency();
      await updatePromptHelpText(settings);

      // Localize the page
      const currentAppLocalize =
        settings.APPLICATION_LOCALIZE || CONFIG.APPLICATION_LOCALIZE;
      if (typeof app_localize === "function") {
        app_localize(currentAppLocalize);
      }

      // --- START: GENERALIZED HASH HANDLING LOGIC ---

      const hash = window.location.hash;
      let targetTabId = "languages"; // Default tab

      if (hash) {
        // Extract the base tab ID from any hash format (e.g., #about, #help=shortcut)
        targetTabId = hash.substring(1).split("=")[0];
      }

      // Validate if a tab with this ID actually exists
      const tabElement = document.getElementById(targetTabId);
      if (!tabElement) {
        targetTabId = "languages"; // Fallback to default if hash is invalid
      }

      // 1. ALWAYS show the target tab. This is the main generic action.
      showTab(targetTabId);

      // 2. Perform any ADDITIONAL, tab-specific actions AFTER showing it.
      switch (targetTabId) {
        case "about":
          fetchAndDisplayChangelog();
          break;
        case "help":
          // The handleHelpAnchor function is designed for deep-linking
          if (hash.startsWith("#help=")) {
            handleHelpAnchor(hash);
          }
          break;
        // Add other cases here if new tabs need special logic on load
      }
      // --- END: GENERALIZED HASH HANDLING LOGIC ---
    } catch (error) {
      errorHandler.handle(error, {
        type: ErrorTypes.UI,
        context: "loadSettings",
      });
      showStatus(
        (await getTranslationString("OPTIONS_STATUS_LOAD_FAILED")) ||
          "Failed to load settings.",
        "error"
      );
    }
  }
  // =================================================================
  // END: CORRECTED loadSettings FUNCTION
  // =================================================================

  function showStatus(message, type = "info") {
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `status-${type}`;
    }
  }

  // --- Import/Export Logic ---
  exportSettingsButton.addEventListener("click", async () => {
    try {
      const settings = await getSettingsAsync();
      const blob = new Blob([JSON.stringify(settings, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${CONFIG.APP_NAME}_Settings.json`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus(
        await getTranslationString("OPTIONS_STATUS_EXPORT_SUCCESS"),
        "success"
      );
      setTimeout(() => showStatus(""), 2000);
    } catch (error) {
      errorHandler.handle(error, {
        type: ErrorTypes.UI,
        context: "exportSettings",
      });
      showStatus(
        await getTranslationString("OPTIONS_STATUS_EXPORT_FAILED"),
        "error"
      );
      setTimeout(() => showStatus(""), 3000);
    }
  });

  importFile.addEventListener("change", async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      const importedSettings = JSON.parse(await file.text());
      await Browser.storage.local.set(importedSettings);
      showStatus(
        await getTranslationString("OPTIONS_STATUS_IMPORT_SUCCESS_RELOADING"),
        "success"
      );
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      errorHandler.handle(error, {
        type: ErrorTypes.UI,
        context: "importSettings",
      });
      showStatus(
        await getTranslationString("OPTIONS_STATUS_IMPORT_FAILED"),
        "error"
      );
      if (importFile) importFile.value = "";
      setTimeout(() => showStatus(""), 3000);
    }
  });

  // Initial call to load all settings and set up the page
  await loadSettings();
});
