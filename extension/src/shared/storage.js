import { DEFAULT_SETTINGS } from './constants.js';

export class Storage {
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        resolve({ ...DEFAULT_SETTINGS, ...result.settings });
      });
    });
  }

  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ settings }, resolve);
    });
  }

  async clearSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['settings'], resolve);
    });
  }
}
