/**
 * Tile downloader and fetcher interfaces
 * @format
 */

/**
 * Tile fetch request with XYZ coordinates
 */
export interface TileFetchRequest {
  z: number;
  x: number;
  y: number;
}

/**
 * Interface for fetching tiles from a provider
 */
export interface TileFetcher {
  /**
   * Fetch a tile from the provider
   * @param req Tile coordinates in XYZ format
   * @returns Raw tile bytes (PBF, gzipped or not)
   */
  fetchTile(req: TileFetchRequest): Promise<Uint8Array>;
}

/**
 * Placeholder tile fetcher that throws an error
 * Replace this with a real implementation when tile provider is configured
 */
export class PlaceholderTileFetcher implements TileFetcher {
  async fetchTile(req: TileFetchRequest): Promise<Uint8Array> {
    throw new Error(
      `PlaceholderTileFetcher: No tile provider configured. Cannot fetch tile z=${req.z} x=${req.x} y=${req.y}`,
    );
  }
}
