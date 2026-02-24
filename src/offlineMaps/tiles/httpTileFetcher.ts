/**
 * HTTP-based tile fetcher implementation
 * Downloads map tiles from a configurable tile server
 * @format
 */

import type { TileFetcher, TileFetchRequest } from './tileDownloader';

/**
 * Default tile URL template using OpenTopoMap.
 * Topographic tiles are ideal for outdoor and survival use cases.
 *
 * For production or high-volume use, replace with a self-hosted tile server
 * or a commercial provider (MapTiler, Mapbox, etc.) that allows bulk downloads.
 */
const DEFAULT_TILE_URL = 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png';

/**
 * Options for configuring HttpTileFetcher
 */
export interface HttpTileFetcherOptions {
  /** Tile URL template with {z}, {x}, {y} placeholders */
  urlTemplate?: string;
  /** User-Agent header to identify this app to tile servers */
  userAgent?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
}

/**
 * Real tile fetcher that downloads tiles over HTTP.
 * Uses the standard fetch() API available in React Native.
 */
export class HttpTileFetcher implements TileFetcher {
  private readonly urlTemplate: string;
  private readonly userAgent: string;
  private readonly timeoutMs: number;

  constructor(opts: HttpTileFetcherOptions = {}) {
    this.urlTemplate = opts.urlTemplate ?? DEFAULT_TILE_URL;
    this.userAgent = opts.userAgent ?? 'TOAST/1.0 Offline Map Downloader';
    this.timeoutMs = opts.timeoutMs ?? 30000;
  }

  async fetchTile(req: TileFetchRequest): Promise<Uint8Array> {
    const url = this.urlTemplate
      .replace('{z}', String(req.z))
      .replace('{x}', String(req.x))
      .replace('{y}', String(req.y));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'image/png,image/*',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = new Error(
          `HTTP ${response.status} fetching tile z=${req.z} x=${req.x} y=${req.y}: ${response.statusText}`,
        );
        // Mark server errors as transient so the retry logic will retry them
        if (response.status >= 500) {
          (error as Error & { code: string }).code = 'TRANSIENT';
        }
        throw error;
      }

      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error(
          `Timeout fetching tile z=${req.z} x=${req.x} y=${req.y}`,
        );
        (timeoutError as Error & { code: string }).code = 'ETIMEDOUT';
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
