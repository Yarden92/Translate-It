### Changelog – Translate It!

#### v0.7.0 – Released on 12 July 2025

##### Added

- New feature: enhanced translation support in text fields, including copy and paste actions.
- Improved behavior for `Google Translate`: when source and target languages are the same, the system now auto-swaps them for a smoother user experience.
- Minor UI enhancements for better usability.

##### Fixed

- Fixed issues with localization strings.
- Fixed error in handling DeepSeek translation credits.
- Resolved various minor bugs.

##### Changed

- Added validation to prevent selecting the same source and target languages, with clearer user feedback.

---


#### v0.6.5 – Released on 2 July 2025

##### Added

- Added quick access to the API provider from the right-click context menu in the extension's action bar.

##### Changed

- Changed the default font in the Settings page and Popup to `Vazirmatn`.

##### Fixed

- Fixed an issue with in-field translation when using `Google Translate` as the provider.  
- Fixed the issue where country flags were not displayed on Windows in the settings page.
- Fixed several minor bugs.

---

#### v0.6.0 – Released on 1 July 2025

##### Added

- Added support for **Google Translate** as a translation provider.
- Disabled the translation icon on the following websites to prevent interference with important content areas:

        `microsoftonline.com`
        `docs.microsoft.com`
        `cloud.microsoft`
        `acrobat.adobe.com`
        `docs.google.com`
        `onedrive.live.com`
        `canva.com/design`
        `dochub.com`
        `edit-document.pdffiller.com`
        `zoho.com`

##### Changed

- Disabled in-field translation icon in non-webpage contexts (e.g., internal browser pages or other extensions).

##### Fixed

- Fixed an issue where the translation icon appeared incorrectly when selecting text on first install.

---

#### v0.5.0 – Released on 30 June 2025

##### Added

- Added quick access options to the extension’s context (right-click) menu via the action toolbar.
- Added a Help section to the Settings page.
- Added a Changelog section to the Settings page.

##### Changed

- Completely redesigned the Settings page for better clarity and usability.
- Changed the default model for OpenRouter to `gpt-4o`.

##### Fixed

- Added handling for newly occurring error scenarios with appropriate messaging.

---

#### v0.4.0 – Released on 29 June 2025

##### Added

- Added 'Translate with Select Element' mode to the right-click context menu for quick access.
- Added a keyboard shortcut to activate 'Select Element' mode.

##### Changed

- Improved the positioning and behavior of the in-field translation icon to be more intelligent and less intrusive.
- Enhanced translation prompts to yield more natural and human-like translations.
- Updated Light Theme
  
---

#### v0.3.6 – Released on 28 June 2025

##### Fixed
- Resolved issues on certain pages where the extension failed to function properly — particularly on platforms acting as software containers (e.g., frameworks like PhoneGap and similar).

##### Changed
- Improved the visual design of in-page messages for better readability and aesthetics.

---

#### v0.3.5 – Released on 27 June 2025

##### Fixed
- Resolved an error that occurred during page loading.

##### Changed
- Removed the default list of websites where the extension was previously disabled.

        accounts.google.com
        chrome.google.com/webstore
        addons.mozilla.org
        meet.google.com
        acrobat.adobe.com
        developer.chrome.com
        docs.google.com
        docs.microsoft.com
        developers.google.com
        ai.google.de

---

#### v0.3.3 - Released 26 June 2025

##### Added
- Add API key information and links for WebAI, OpenAI, OpenRouter, and DeepSeek on Options page.
- Add additional default excluded sites to the exclusion list:

        developer.chrome.com
        docs.microsoft.com
        docs.google.com
        meet.google.com
        developers.google.com
        ai.google.dev

##### Fixed
- Improve content script injection logic and add validation checks

---

#### v0.3.0 - Released 23 June 2025

##### Added

- **Added support for the DeepSeek API** as a new translation provider.
- **Added a "Custom" provider**, allowing users to connect to any OpenAI-compatible API endpoint (e.g., for local or self-hosted models).
- **Added an update notification** to inform users when a new version has been installed (Chromium-based only).

##### Changed

- **Overhauled the error handling system** to be more robust and provide clearer, generalized messages for all supported API providers.

##### Fixed

- The extension is now correctly disabled on non-web pages (e.g., `file://` or internal browser pages) to prevent errors.
- The in-field translation icon now appears more accurately on editable text fields and ignores non-text elements like checkboxes.
- A default list of excluded sites (e.g., `accounts.google.com`, web stores) has been added to prevent conflicts.

---

#### v0.2.2 - Released 21 June 2025

- New Feature: In addition to automatic translation on text selection, a new method has been added — a small icon now appears near the selected text. The translation is shown only after clicking this icon, allowing for a more deliberate and user-controlled experience.
- Minor UI improvements and stability enhancements.

---

#### v0.2.1 - Released 28 May 2025

- Improved Popup Behavior on Initial Inactivity
- Enhanced display of the last translation (now shown only in Dictionary mode)
- fix: resolve conflicts between theme styles and website styles (#43)

---

#### v0.2.0 - Released 26 May 2025

- Theme Support Added
    - Switch between Light, Dark, or Auto (system-based) themes to suit your visual preferences.
- Improved RTL Language Support
    - Text rendering and alignment for Right-to-Left languages like Persian and Arabic has been significantly refined for better readability and accuracy.
- Discord Input Fix
    - Resolved an issue where translated text wasn't properly sent in Discord input fields — it now works as expected.
- General Enhancements
    - Various bug fixes and performance improvements for a more stable and seamless experience.

---

#### v0.1.1 - Released 6 May 2025

- Updated the build process and added a lint check
- Renamed the extension (UUID remains unchanged)

---

#### v0.1.0 - Released 30 Apr 2025

- First public release