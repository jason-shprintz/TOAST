/**
 * DEM provider interface and implementations
 * @format
 */

import type { DemRequest, DemResponse, DemProgressInfo } from './demTypes';

/**
 * DEM provider interface for fetching elevation data
 */
export interface DemProvider {
  fetchDem(
    req: DemRequest,
    opts?: { onProgress?: (p: DemProgressInfo) => void },
  ): Promise<DemResponse>;
}

/**
 * Placeholder DEM provider that throws an error
 * Use this until a real DEM source is configured
 */
export class PlaceholderDemProvider implements DemProvider {
  async fetchDem(
    req: DemRequest,
    opts?: { onProgress?: (p: DemProgressInfo) => void },
  ): Promise<DemResponse> {
    throw new Error('DEM provider not configured');
  }
}

/**
 * Synthetic DEM provider for testing
 * Returns a small deterministic grid with predictable values
 */
export class SyntheticDemProvider implements DemProvider {
  constructor(
    private readonly gridSize: number = 10,
    private readonly encoding: 'int16' | 'float32' = 'int16',
  ) {}

  async fetchDem(
    req: DemRequest,
    opts?: { onProgress?: (p: DemProgressInfo) => void },
  ): Promise<DemResponse> {
    const { bounds } = req;
    const width = this.gridSize;
    const height = this.gridSize;
    const encoding = req.encoding || this.encoding;

    // Report progress
    if (opts?.onProgress) {
      opts.onProgress({ message: 'Generating synthetic DEM...' });
    }

    // Create synthetic elevation data
    // Pattern: elevation increases from bottom-left to top-right
    const data = this.createSyntheticGrid(width, height, encoding);

    // Report completion
    if (opts?.onProgress) {
      opts.onProgress({
        downloadedBytes: data.byteLength,
        totalBytes: data.byteLength,
        message: 'Synthetic DEM generated',
      });
    }

    return {
      metadata: {
        format: 'grid',
        units: 'meters',
        encoding,
        width,
        height,
        nodata: encoding === 'int16' ? -32768 : -9999,
        bounds,
      },
      data,
    };
  }

  private createSyntheticGrid(
    width: number,
    height: number,
    encoding: 'int16' | 'float32',
  ): Uint8Array {
    const count = width * height;

    if (encoding === 'int16') {
      const buffer = new ArrayBuffer(count * 2);
      const view = new DataView(buffer);

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const index = row * width + col;
          // Create a simple gradient: elevation = row * 10 + col
          const elevation = row * 10 + col;
          view.setInt16(index * 2, elevation, true); // true = little-endian
        }
      }

      return new Uint8Array(buffer);
    } else {
      // float32
      const buffer = new ArrayBuffer(count * 4);
      const view = new DataView(buffer);

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const index = row * width + col;
          // Create a simple gradient: elevation = row * 10.5 + col * 0.5
          const elevation = row * 10.5 + col * 0.5;
          view.setFloat32(index * 4, elevation, true); // true = little-endian
        }
      }

      return new Uint8Array(buffer);
    }
  }
}
