import { makeAutoObservable, runInAction, computed, comparer } from 'mobx';
import Torch from 'react-native-torch';
import { AppState, NativeEventSubscription } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/netinfo';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
// SQLite is optional; ensure dependency is installed before use
let SQLite: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SQLite = require('react-native-sqlite-storage');
} catch {
  SQLite = null as any;
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
}

export type NoteInputType = 'text' | 'sketch';
export type NoteCategory = 'General' | 'Work' | 'Personal' | 'Ideas';

export interface Note {
  id: string;
  createdAt: number; // epoch ms
  latitude?: number;
  longitude?: number;
  category: NoteCategory;
  type: NoteInputType; // text or sketch
  text?: string;
  sketchDataUri?: string; // placeholder for sketch image
  photoUris: string[]; // attached photos (uris)
}

export class CoreStore {
  tools: Tool[] = [
    {
      id: 'device-status',
      name: 'Device Status',
      icon: 'speedometer-outline',
    },
    {
      id: 'flashlight',
      name: 'Flashlight',
      icon: 'flashlight-outline',
    },
    {
      id: 'notepad',
      name: 'Notepad',
      icon: 'document-text-outline',
    },
    {
      id: 'unit-conversion',
      name: 'Unit Conversion',
      icon: 'swap-horizontal-outline',
    },
    {
      id: 'checklist',
      name: 'Checklist',
      icon: 'list-outline',
    },
  ];

  private appStateSubscription: NativeEventSubscription;

  constructor() {
    makeAutoObservable(
      this,
      {
        notesByCategory: computed({ equals: comparer.structural }),
      },
      { autoBind: true },
    );
    // Keep torch consistent when app state changes (best-effort)
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );
  }

  get totalTools() {
    return this.tools.length;
  }

  // --------------------------------------------------------------------
  // ===== Flashlight =====
  // --------------------------------------------------------------------
  // Flashlight state management
  flashlightMode: 'off' | 'on' | 'sos' | 'strobe' = 'off';
  private sosTimer: ReturnType<typeof setTimeout> | null = null;
  private isTorchOn: boolean = false;
  private strobeInterval: ReturnType<typeof setInterval> | null = null;
  strobeFrequencyHz: number = 5; // default frequency

  /**
   * Sets the flashlight mode to the specified value.
   * If the selected mode is already active, toggles the flashlight off.
   * Otherwise, activates the selected mode.
   *
   * @param mode - The desired flashlight mode. Can be 'off', 'on', 'sos', or 'strobe'.
   */
  setFlashlightMode(mode: 'off' | 'on' | 'sos' | 'strobe') {
    // Exclusive selection: tapping active mode turns it off
    const next = this.flashlightMode === mode ? 'off' : mode;
    this.flashlightMode = next;
    this.applyFlashlightState();
  }

  get isFlashlightOn() {
    return this.flashlightMode === 'on';
  }

  /**
   * Applies the current flashlight state based on the `flashlightMode` property.
   * Stops any running SOS or strobe patterns before setting the new state.
   *
   * - If `flashlightMode` is `'on'`, turns the torch on.
   * - If `flashlightMode` is `'sos'`, starts the SOS pattern.
   * - If `flashlightMode` is `'strobe'`, starts the strobe pattern.
   * - For any other value, turns the torch off.
   *
   * @private
   */
  private applyFlashlightState() {
    // Stop any running patterns
    this.stopSOS();
    this.stopStrobe();
    // Apply steady on/off
    if (this.flashlightMode === 'on') {
      this.setTorch(true);
      return;
    }
    if (this.flashlightMode === 'sos') {
      this.startSOS();
      return;
    }
    if (this.flashlightMode === 'strobe') {
      this.startStrobe();
      return;
    }
    // Default: off
    this.setTorch(false);
  }

  /**
   * Handles changes in the application's state.
   *
   * If the app returns to the foreground (`state` is `'active'`),
   * this method re-applies the flashlight state to ensure it is set correctly.
   *
   * @param state - The new state of the application (e.g., `'active'`, `'background'`, etc.).
   */
  private handleAppStateChange = (state: string) => {
    // If returning to foreground while flashlight should be on, re-apply.
    if (state === 'active') {
      this.applyFlashlightState();
    }
  };

  // Low-level torch setter with state tracking
  private setTorch(on: boolean) {
    this.isTorchOn = on;
    Torch.switchState(on);
  }

  // SOS pattern: "... --- ..." in Morse
  // Timing conventions: dot=1 unit, dash=3 units, intra-signal gap=1 unit off,
  // letter gap=3 units off, repetition gap=1000ms off (as requested).
  // Choose unit=200ms for readable pacing.
  private readonly sosUnitMs = 200;

  /**
   * Starts the SOS flashlight signal pattern.
   *
   * This method initiates a repeating sequence that flashes the torch in the Morse code pattern for "SOS":
   * three short flashes (dots), three long flashes (dashes), and three short flashes (dots), with appropriate
   * timing gaps between signals and letters. The sequence repeats with a pause between cycles.
   *
   * If the flashlight mode is changed from 'sos', the sequence stops and the torch is turned off.
   * Any existing SOS pattern is stopped before starting a new one.
   *
   * @private
   */
  private startSOS() {
    this.stopSOS(); // Stop any existing SOS pattern
    // Sequence builder: returns array of {on:boolean, ms:number}
    const unit = this.sosUnitMs;
    const dot = [
      { on: true, ms: unit },
      { on: false, ms: unit },
    ];
    const dash = [
      { on: true, ms: 3 * unit },
      { on: false, ms: unit },
    ];
    const letterGap = [{ on: false, ms: 3 * unit }];

    const S = [...dot, ...dot, ...dot, ...letterGap];
    const O = [...dash, ...dash, ...dash, ...letterGap];
    const sequence = [...S, ...O, ...S];

    const repeatPause = [{ on: false, ms: 1000 }];

    const runOnce = (index: number) => {
      if (this.flashlightMode !== 'sos') {
        this.setTorch(false);
        return;
      }
      const step = sequence[index] ?? null;
      const nextDelay = step ? step.ms : repeatPause[0].ms;
      const nextOn = step ? step.on : false;
      this.setTorch(nextOn);
      const nextIndex = step
        ? index + 1 < sequence.length
          ? index + 1
          : -1
        : -1;
      this.sosTimer = setTimeout(() => {
        if (nextIndex === -1) {
          // Pause then restart sequence
          this.setTorch(false);
          // Clear current timer before creating a new one
          this.sosTimer = null;
          this.sosTimer = setTimeout(() => runOnce(0), repeatPause[0].ms);
        } else {
          runOnce(nextIndex);
        }
      }, nextDelay);
    };

    // Kick off the sequence
    runOnce(0);
  }

  /**
   * Stops the SOS timer if it is currently active.
   * Clears the timeout and resets the `sosTimer` property to `null`.
   *
   * @private
   */
  private stopSOS() {
    if (this.sosTimer) {
      clearTimeout(this.sosTimer);
      this.sosTimer = null;
    }
  }

  // Strobe implementation: toggle torch at `strobeFrequencyHz`
  setStrobeFrequency(hz: number) {
    const clamped = Math.max(1, Math.min(30, Math.round(hz)));
    this.strobeFrequencyHz = clamped;
    if (this.flashlightMode === 'strobe') {
      // restart strobe at new frequency
      this.startStrobe();
    }
  }

  /**
   * Starts the strobe effect for the torch by toggling its state at a frequency defined by `strobeFrequencyHz`.
   * The strobe interval is calculated to ensure a minimum period of 10ms.
   * If the flashlight mode changes from 'strobe', the strobe effect is stopped automatically.
   * The torch is set to its initial state immediately before starting the interval.
   *
   * @private
   */
  private startStrobe() {
    this.stopStrobe();
    const hz = this.strobeFrequencyHz;
    const periodMs = Math.max(10, Math.floor(1000 / hz / 2));
    let on = false;
    this.setTorch(on); // Set initial state immediately
    this.strobeInterval = setInterval(() => {
      if (this.flashlightMode !== 'strobe') {
        this.stopStrobe();
        return;
      }
      on = !on;
      this.setTorch(on);
    }, periodMs);
  }

  /**
   * Stops the strobe effect by clearing the strobe interval and resetting its reference.
   * Ensures the torch is turned off unless the flashlight mode is set to steady on.
   */
  private stopStrobe() {
    if (this.strobeInterval) {
      clearInterval(this.strobeInterval);
      this.strobeInterval = null;
    }
    // Ensure torch off when stopping strobe unless steady on is selected
    if (this.flashlightMode !== 'on') {
      this.setTorch(false);
    }
  }

  // --------------------------------------------------------------------
  // ===== Device Status =====
  // --------------------------------------------------------------------
  // Battery state
  batteryLevel: number | null = null;
  isCharging: boolean | null = null;
  batteryEstimateMinutes: number | null = null;
  private lastBatterySample: { level: number; at: number } | null = null;
  private batteryQuickIv: ReturnType<typeof setInterval> | null = null;
  private batterySlowIv: ReturnType<typeof setInterval> | null = null;
  private batteryQuickDeadline: number | null = null;

  // Storage state
  storageTotal: number | null = null;
  storageFree: number | null = null;

  // Connectivity
  netInfo: NetInfoState | null = null;
  private netUnsub: NetInfoSubscription | null = null;

  // GPS
  lastFix: GeoPosition | null = null;
  locationError: string | null = null;
  private gpsIv: ReturnType<typeof setInterval> | null = null;

  /**
   * Samples the current battery level and charging state using DeviceInfo.
   * Updates the store's battery level and charging status.
   * If a previous battery sample exists, estimates the remaining battery time in minutes
   * based on the rate of battery consumption.
   * Handles errors silently.
   *
   * @private
   * @returns {Promise<void>} Resolves when the sampling is complete.
   */
  private sampleBattery = async (): Promise<void> => {
    try {
      const level = await DeviceInfo.getBatteryLevel();
      const power = await DeviceInfo.getPowerState();
      const charging =
        power.batteryState === 'charging' ||
        power.batteryState === 'full' ||
        power.charging === true;
      runInAction(() => {
        this.batteryLevel = level;
        this.isCharging = charging;
      });

      if (this.lastBatterySample) {
        const now = Date.now();
        const dtMin = (now - this.lastBatterySample.at) / 60000;
        const dLevel = this.lastBatterySample.level - level; // positive on drop
        if (dtMin > 0 && dLevel > 0) {
          const ratePerMin = dLevel / dtMin;
          if (ratePerMin > 0) {
            const minutesLeft = level / ratePerMin;
            runInAction(() => {
              this.batteryEstimateMinutes = minutesLeft;
            });
          }
        } else if (charging || dLevel < 0) {
          runInAction(() => {
            this.batteryEstimateMinutes = null; // Clear estimate when charging or level increases
          });
        }
      }
      runInAction(() => {
        this.lastBatterySample = { level, at: Date.now() };
      });
    } catch {
      // ignore
    }
  };

  /**
   * Starts the battery sampling process.
   *
   * - Immediately samples the battery.
   * - Initiates a quick sampling interval every 15 seconds for approximately 3 minutes.
   * - During quick sampling, checks if a battery estimate is available or if the quick sampling period has expired.
   * - If no estimate is available but battery level is known, sets a fallback estimate (8 hours at 100%).
   * - After quick sampling, clears intervals and switches to slow sampling every 60 seconds.
   *
   * @private
   */
  private startBatterySampling = () => {
    // Immediate sample
    this.sampleBattery();
    // Quick sampling for ~3 minutes
    this.batteryQuickDeadline = Date.now() + 3 * 60 * 1000;
    this.clearBatteryIntervals();
    this.batteryQuickIv = setInterval(() => {
      this.sampleBattery();
      const hasEstimate = this.batteryEstimateMinutes != null;
      const expired =
        this.batteryQuickDeadline != null &&
        Date.now() >= this.batteryQuickDeadline;
      if (hasEstimate || expired) {
        if (!hasEstimate && this.batteryLevel != null && !this.isCharging) {
          // Fallback baseline 8h at 100%
          runInAction(() => {
            this.batteryEstimateMinutes = Math.round(this.batteryLevel! * 480);
          });
        }
        this.clearBatteryIntervals();
        this.batterySlowIv = setInterval(this.sampleBattery, 60000);
      }
    }, 15000);
  };

  /**
   * Clears any active battery-related intervals and resets their references to null.
   *
   * This method checks if the quick and slow battery interval timers are set,
   * clears them if they exist, and then sets their references to null to prevent
   * further unintended usage.
   */
  private clearBatteryIntervals = () => {
    if (this.batteryQuickIv) clearInterval(this.batteryQuickIv);
    if (this.batterySlowIv) clearInterval(this.batterySlowIv);
    this.batteryQuickIv = null;
    this.batterySlowIv = null;
  };

  /**
   * Asynchronously refreshes the device's storage information.
   * Retrieves the total disk capacity and free disk storage using `DeviceInfo`,
   * and updates the `storageTotal` and `storageFree` properties.
   * If retrieval fails, the error is silently ignored.
   *
   * @returns {Promise<void>} Resolves when storage information has been updated.
   */
  private refreshStorage = async (): Promise<void> => {
    try {
      const [total, free] = await Promise.all([
        DeviceInfo.getTotalDiskCapacity(),
        DeviceInfo.getFreeDiskStorage(),
      ]);
      runInAction(() => {
        this.storageTotal = total ?? null;
        this.storageFree = free ?? null;
      });
    } catch {
      // ignore
    }
  };

  /**
   * Starts a network information subscription if one is not already active.
   * Uses `NetInfo.addEventListener` to listen for network state changes and updates
   * the `netInfo` property with the latest state.
   * Ensures that only one subscription is active at a time by checking `netUnsub`.
   *
   * @private
   */
  private startNetSubscription = () => {
    if (this.netUnsub) return;
    this.netUnsub = NetInfo.addEventListener(state => {
      runInAction(() => {
        this.netInfo = state;
      });
    });
  };

  /**
   * Stops the current network subscription by invoking the unsubscribe function if it exists,
   * and resets the subscription reference to null.
   *
   * @private
   */
  private stopNetSubscription = () => {
    if (this.netUnsub) this.netUnsub();
    this.netUnsub = null;
  };

  /**
   * Attempts to retrieve the current GPS position using the Geolocation API.
   *
   * On success, updates `lastFix` with the position and clears any location error.
   * On failure, sets `locationError` with the error message.
   *
   * Uses high accuracy, a timeout of 15 seconds, and allows cached positions up to 5 seconds old.
   */
  private gpsGetFix = () => {
    Geolocation.getCurrentPosition(
      pos => {
        runInAction(() => {
          this.lastFix = pos;
          this.locationError = null;
        });
      },
      err => {
        runInAction(() => {
          this.locationError = err.message;
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );
  };

  /**
   * Starts polling for GPS location updates.
   *
   * Requests location authorization from the user. If permission is granted,
   * immediately fetches the current GPS fix and sets up a polling interval to
   * repeatedly fetch the GPS fix every 60 seconds. If permission is denied or
   * an error occurs during authorization, sets an appropriate location error message.
   *
   * @private
   * @returns {Promise<void>} Resolves when polling is started or an error is handled.
   */
  private async startGpsPolling(): Promise<void> {
    try {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      if (auth === 'granted') {
        this.gpsGetFix();
        if (this.gpsIv) clearInterval(this.gpsIv);
        this.gpsIv = setInterval(() => this.gpsGetFix(), 60000);
      } else {
        runInAction(() => {
          this.locationError = 'Location permission not granted';
        });
      }
    } catch {
      runInAction(() => {
        this.locationError = 'Location permission error';
      });
    }
  }

  /**
   * Stops the GPS polling interval if it is currently active.
   * Clears the interval and resets the interval reference to null.
   *
   * @private
   */
  private stopGpsPolling() {
    if (this.gpsIv) clearInterval(this.gpsIv);
    this.gpsIv = null;
  }

  /**
   * Initiates monitoring of device status by starting battery sampling,
   * refreshing storage information, subscribing to network status updates,
   * and polling GPS data.
   *
   * @remarks
   * This method aggregates multiple device status monitoring routines
   * to provide comprehensive device health and connectivity information.
   */
  startDeviceStatusMonitoring = () => {
    this.startBatterySampling();
    this.refreshStorage();
    this.startNetSubscription();
    this.startGpsPolling();
  };

  /**
   * Stops monitoring the device status by clearing battery intervals,
   * unsubscribing from network status updates, and stopping GPS polling.
   *
   * @remarks
   * This method should be called when device status monitoring is no longer needed,
   * such as during cleanup or when the application is paused.
   */
  stopDeviceStatusMonitoring = () => {
    this.clearBatteryIntervals();
    this.stopNetSubscription();
    this.stopGpsPolling();
  };

  // --------------------------------------------------------------------
  // ===== Notepad =====
  // --------------------------------------------------------------------
  notes: Note[] = [];
  categories: NoteCategory[] = ['General', 'Work', 'Personal', 'Ideas'];
  private notesDb: any | null = null;

  private generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async createNote(params: {
    category?: NoteCategory;
    type: NoteInputType;
    text?: string;
    sketchDataUri?: string;
  }) {
    let latitude: number | undefined;
    let longitude: number | undefined;

    try {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      if (auth === 'granted') {
        await new Promise<void>(resolve => {
          Geolocation.getCurrentPosition(
            pos => {
              latitude = pos.coords.latitude;
              longitude = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
          );
        });
      }
    } catch {
      // Location unavailable, proceed without it
    }

    const note: Note = {
      id: this.generateId(),
      createdAt: Date.now(),
      ...(latitude !== undefined &&
        longitude !== undefined && { latitude, longitude }),
      category: params.category ?? 'General',
      type: params.type,
      text: params.text,
      sketchDataUri: params.sketchDataUri,
      photoUris: [],
    };

    runInAction(() => {
      this.notes.unshift(note);
    });
    await this.persistNote(note);
  }

  setNoteCategory(noteId: string, category: NoteCategory) {
    const idx = this.notes.findIndex(n => n.id === noteId);
    if (idx >= 0) {
      runInAction(() => {
        this.notes[idx].category = category;
      });
      this.updateNote(this.notes[idx]);
    }
  }

  attachPhoto(noteId: string, uri: string) {
    const note = this.notes.find(item => item.id === noteId);
    if (note) {
      runInAction(() => {
        note.photoUris.push(uri);
      });
      this.updateNote(note);
    }
  }

  async deleteNote(noteId: string) {
    // Remove from SQLite first to ensure consistency
    try {
      await this.initNotesDb();
      if (!this.notesDb) {
        // If no database, just remove from memory
        runInAction(() => {
          this.notes = this.notes.filter(n => n.id !== noteId);
        });
        return;
      }
      await this.notesDb.executeSql('DELETE FROM notes WHERE id = ?', [noteId]);
      // Only remove from in-memory list after successful database deletion
      runInAction(() => {
        this.notes = this.notes.filter(n => n.id !== noteId);
      });
    } catch (error) {
      console.error('Failed to delete note:', error);
      // Reload notes from database to recover from inconsistent state
      try {
        await this.loadNotes();
      } catch (reloadError) {
        console.error('Failed to reload notes after delete failure:', reloadError);
      }
    }
  }

  get recentNotesTop20(): Note[] {
    return this.notes.slice(0, 20);
  }

  get notesByCategory(): Record<NoteCategory, Note[]> {
    const map: Record<NoteCategory, Note[]> = {
      General: [],
      Work: [],
      Personal: [],
      Ideas: [],
    };
    for (const n of this.notes) {
      map[n.category].push(n);
    }
    return map;
  }

  // ===== SQLite persistence =====
  async initNotesDb() {
    if (this.notesDb) return;
    if (!SQLite) return;
    try {
      SQLite.enablePromise?.(true);
      this.notesDb = await SQLite.openDatabase({
        name: 'toast.db',
        location: 'default',
      });
      await this.notesDb.executeSql(
        'CREATE TABLE IF NOT EXISTS notes (' +
          'id TEXT PRIMARY KEY NOT NULL,' +
          'createdAt INTEGER NOT NULL,' +
          'latitude REAL,' +
          'longitude REAL,' +
          'category TEXT NOT NULL,' +
          "type TEXT NOT NULL CHECK(type IN ('text','sketch'))," +
          'text TEXT,' +
          'sketchDataUri TEXT,' +
          'photoUris TEXT' +
          ')',
      );
    } catch (error) {
      console.error('Failed to initialize notes database:', error);
      this.notesDb = null;
    }
  }

  async loadNotes() {
    await this.initNotesDb();
    if (!this.notesDb) return;
    const res = await this.notesDb.executeSql(
      'SELECT * FROM notes ORDER BY createdAt DESC',
    );
    const rows = res[0].rows;
    const loaded: Note[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows.item(i);
      loaded.push({
        id: r.id,
        createdAt: r.createdAt,
        latitude: r.latitude ?? undefined,
        longitude: r.longitude ?? undefined,
        category: r.category,
        type: r.type,
        text: r.text ?? undefined,
        sketchDataUri: r.sketchDataUri ?? undefined,
        photoUris: (() => {
          if (!r.photoUris) return [];
          try {
            return JSON.parse(r.photoUris);
          } catch (e) {
            console.warn('Failed to parse photoUris for note:', r.id, e);
            return [];
          }
        })(),
      });
    }
    runInAction(() => {
      this.notes = loaded;
    });
  }

  async persistNote(note: Note) {
    try {
      await this.initNotesDb();
      if (!this.notesDb) return;
      await this.notesDb.executeSql(
        'INSERT OR REPLACE INTO notes (id, createdAt, latitude, longitude, category, type, text, sketchDataUri, photoUris) VALUES (?,?,?,?,?,?,?,?,?)',
        [
          note.id,
          note.createdAt,
          note.latitude ?? null,
          note.longitude ?? null,
          note.category,
          note.type,
          note.text ?? null,
          note.sketchDataUri ?? null,
          JSON.stringify(note.photoUris ?? []),
        ],
      );
    } catch (error) {
      console.error('Failed to persist note:', error);
      throw error;
    }
  }

  async updateNote(note: Note) {
    try {
      await this.persistNote(note);
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------
  // ==== Cleanup on store disposal ====
  // --------------------------------------------------------------------
  dispose() {
    this.stopSOS();
    this.stopStrobe();
    this.appStateSubscription?.remove();
    this.stopDeviceStatusMonitoring();
  }
}
