import { makeAutoObservable, runInAction } from 'mobx';

export type FontSize = 'small' | 'medium' | 'large';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  fontSize: FontSize;
  themeMode: ThemeMode;
}

/**
 * Store for managing app settings like font size and theme mode.
 * Settings are persisted to SQLite database.
 */
export class SettingsStore {
  fontSize: FontSize = 'small';
  themeMode: ThemeMode = 'light';
  private settingsDb: any | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  /**
   * Sets the font size setting.
   * @param size - The desired font size ('small', 'medium', or 'large')
   */
  async setFontSize(size: FontSize) {
    runInAction(() => {
      this.fontSize = size;
    });
    await this.persistSettings();
  }

  /**
   * Sets the theme mode setting.
   * @param mode - The desired theme mode ('light', 'dark', or 'system')
   */
  async setThemeMode(mode: ThemeMode) {
    runInAction(() => {
      this.themeMode = mode;
    });
    await this.persistSettings();
  }

  /**
   * Gets the font scale multiplier based on the current font size setting.
   * Small = 1.0 (baseline), Medium = 1.2, Large = 1.4
   */
  get fontScale(): number {
    switch (this.fontSize) {
      case 'small':
        return 1.0;
      case 'medium':
        return 1.2;
      case 'large':
        return 1.4;
      default:
        return 1.0;
    }
  }

  /**
   * Initializes the settings database table if it doesn't exist.
   * Requires the main database to be initialized first.
   */
  async initSettingsDb(db: any): Promise<void> {
    if (!db) return;
    this.settingsDb = db;
    try {
      await this.settingsDb.executeSql(
        'CREATE TABLE IF NOT EXISTS settings (' +
          'key TEXT PRIMARY KEY NOT NULL, ' +
          'value TEXT NOT NULL' +
          ')',
      );
    } catch (error) {
      console.error('Failed to initialize settings database:', error);
    }
  }

  /**
   * Validates if a value is a valid FontSize
   */
  private isValidFontSize(value: any): value is FontSize {
    return value === 'small' || value === 'medium' || value === 'large';
  }

  /**
   * Validates if a value is a valid ThemeMode
   */
  private isValidThemeMode(value: any): value is ThemeMode {
    return value === 'light' || value === 'dark' || value === 'system';
  }

  /**
   * Loads settings from the database.
   */
  async loadSettings(db: any): Promise<void> {
    await this.initSettingsDb(db);
    if (!this.settingsDb) return;

    try {
      // Load font size
      const fontSizeRes = await this.settingsDb.executeSql(
        "SELECT value FROM settings WHERE key = 'fontSize'",
      );
      if (fontSizeRes[0].rows.length > 0) {
        const value = fontSizeRes[0].rows.item(0).value;
        if (this.isValidFontSize(value)) {
          runInAction(() => {
            this.fontSize = value;
          });
        } else {
          console.warn(
            `Invalid fontSize value in database: ${value}, using default 'small'`,
          );
        }
      }

      // Load theme mode
      const themeModeRes = await this.settingsDb.executeSql(
        "SELECT value FROM settings WHERE key = 'themeMode'",
      );
      if (themeModeRes[0].rows.length > 0) {
        const value = themeModeRes[0].rows.item(0).value;
        if (this.isValidThemeMode(value)) {
          runInAction(() => {
            this.themeMode = value;
          });
        } else {
          console.warn(
            `Invalid themeMode value in database: ${value}, using default 'light'`,
          );
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * Persists current settings to the database.
   */
  async persistSettings(): Promise<void> {
    if (!this.settingsDb) return;

    try {
      await this.settingsDb.executeSql(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('fontSize', ?)",
        [this.fontSize],
      );
      await this.settingsDb.executeSql(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('themeMode', ?)",
        [this.themeMode],
      );
    } catch (error) {
      console.error('Failed to persist settings:', error);
    }
  }
}
