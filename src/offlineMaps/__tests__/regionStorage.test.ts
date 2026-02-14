/**
 * Tests for Region Storage
 * @format
 */

const mockFs: Record<string, string | Uint8Array> = {};
const mockDirs: Set<string> = new Set();

// Mock react-native-fs before importing
jest.mock('react-native-fs', () => {
  const mockRNFS = {
    DocumentDirectoryPath: '/mock/documents',
    exists: jest.fn(async (path: string) => {
      return mockFs.hasOwnProperty(path) || mockDirs.has(path);
    }),
    mkdir: jest.fn(async (path: string) => {
      mockDirs.add(path);
    }),
    unlink: jest.fn(async (path: string) => {
      if (mockFs.hasOwnProperty(path)) {
        delete mockFs[path];
      } else if (mockDirs.has(path)) {
        // Remove directory and all files in it
        mockDirs.delete(path);
        const prefix = path + '/';
        Object.keys(mockFs).forEach((key) => {
          if (key.startsWith(prefix)) {
            delete mockFs[key];
          }
        });
        Array.from(mockDirs).forEach((dir) => {
          if (dir.startsWith(prefix)) {
            mockDirs.delete(dir);
          }
        });
      } else {
        throw new Error(`ENOENT: no such file or directory: ${path}`);
      }
    }),
    moveFile: jest.fn(async (from: string, to: string) => {
      if (!mockFs.hasOwnProperty(from) && !mockDirs.has(from)) {
        throw new Error(`ENOENT: source does not exist: ${from}`);
      }

      if (mockDirs.has(from)) {
        // Move directory
        mockDirs.delete(from);
        mockDirs.add(to);

        // Move all files and subdirs
        const prefix = from + '/';
        const newPrefix = to + '/';
        Object.keys(mockFs).forEach((key) => {
          if (key.startsWith(prefix)) {
            const newKey = newPrefix + key.slice(prefix.length);
            mockFs[newKey] = mockFs[key];
            delete mockFs[key];
          }
        });
        Array.from(mockDirs).forEach((dir) => {
          if (dir.startsWith(prefix)) {
            const newDir = newPrefix + dir.slice(prefix.length);
            mockDirs.add(newDir);
            mockDirs.delete(dir);
          }
        });
      } else {
        // Move file
        mockFs[to] = mockFs[from];
        delete mockFs[from];
      }
    }),
    writeFile: jest.fn(
      async (path: string, content: string, encoding: string) => {
        if (encoding === 'base64') {
          mockFs[path] = Buffer.from(content, 'base64');
        } else {
          mockFs[path] = content;
        }
      },
    ),
    readFile: jest.fn(async (path: string, encoding: string) => {
      if (!mockFs.hasOwnProperty(path)) {
        throw new Error(`ENOENT: no such file or directory: ${path}`);
      }
      const content = mockFs[path];
      if (encoding === 'utf8') {
        return typeof content === 'string'
          ? content
          : Buffer.from(content).toString('utf8');
      }
      return content;
    }),
    readDir: jest.fn(async (path: string) => {
      if (!mockDirs.has(path)) {
        throw new Error(`ENOENT: no such file or directory: ${path}`);
      }

      const items: Array<{
        name: string;
        path: string;
        isDirectory: () => boolean;
      }> = [];
      const prefix = path + '/';

      // Find direct children only
      const children = new Set<string>();

      // Add files
      Object.keys(mockFs).forEach((key) => {
        if (key.startsWith(prefix)) {
          const relative = key.slice(prefix.length);
          const parts = relative.split('/');
          if (parts.length === 1) {
            children.add(parts[0]);
          }
        }
      });

      // Add directories
      Array.from(mockDirs).forEach((dir) => {
        if (dir.startsWith(prefix)) {
          const relative = dir.slice(prefix.length);
          const parts = relative.split('/');
          if (parts.length === 1) {
            children.add(parts[0]);
          }
        }
      });

      children.forEach((name) => {
        const fullPath = `${path}/${name}`;
        items.push({
          name,
          path: fullPath,
          isDirectory: () => mockDirs.has(fullPath),
        });
      });

      return items;
    }),
    stat: jest.fn(async (path: string) => {
      if (mockDirs.has(path)) {
        return {
          size: 0,
          isDirectory: () => true,
        };
      }

      if (mockFs.hasOwnProperty(path)) {
        const content = mockFs[path];
        const size =
          typeof content === 'string' ? content.length : content.length;
        return {
          size,
          isDirectory: () => false,
        };
      }

      throw new Error(`ENOENT: no such file or directory: ${path}`);
    }),
  };

  return {
    __esModule: true,
    default: mockRNFS,
    ...mockRNFS,
  };
});

import RNFS from 'react-native-fs';
import { createRegionStorage } from '../storage/regionStorage';

describe('RegionStorage', () => {
  let storage: ReturnType<typeof createRegionStorage>;

  beforeEach(() => {
    // Clear mock filesystem
    Object.keys(mockFs).forEach((key) => delete mockFs[key]);
    mockDirs.clear();
    jest.clearAllMocks();

    storage = createRegionStorage();
  });

  describe('Initialization', () => {
    it('should initialize storage directories', async () => {
      await storage.init();

      expect(RNFS.mkdir).toHaveBeenCalledWith(
        '/mock/documents/offline',
        expect.any(Object),
      );
      expect(RNFS.mkdir).toHaveBeenCalledWith(
        '/mock/documents/offline/regions',
        expect.any(Object),
      );
      expect(RNFS.mkdir).toHaveBeenCalledWith(
        '/mock/documents/offline/tmp',
        expect.any(Object),
      );
    });

    it('should not fail if directories already exist', async () => {
      await storage.init();
      await storage.init();

      expect(RNFS.mkdir).toHaveBeenCalled();
    });
  });

  describe('Temp Region Directory', () => {
    beforeEach(async () => {
      await storage.init();
    });

    it('should create temp region directory', async () => {
      const dirPath = await storage.ensureTempRegionDir('region-1');

      expect(dirPath).toBe('/mock/documents/offline/tmp/region-1');
      expect(mockDirs.has(dirPath)).toBe(true);
    });

    it('should return path for existing temp directory', async () => {
      await storage.ensureTempRegionDir('region-1');
      const dirPath = await storage.ensureTempRegionDir('region-1');

      expect(dirPath).toBe('/mock/documents/offline/tmp/region-1');
    });
  });

  describe('Final Region Directory', () => {
    beforeEach(async () => {
      await storage.init();
    });

    it('should create final region directory', async () => {
      const dirPath = await storage.ensureFinalRegionDir('region-1');

      expect(dirPath).toBe('/mock/documents/offline/regions/region-1');
      expect(mockDirs.has(dirPath)).toBe(true);
    });
  });

  describe('Atomic JSON Writes', () => {
    beforeEach(async () => {
      await storage.init();
    });

    it('should write JSON atomically to temp region', async () => {
      const testJson = { test: 'data', value: 123 };

      await storage.writeTempJson('region-1', 'test.json', testJson);

      const filePath = '/mock/documents/offline/tmp/region-1/test.json';
      expect(mockFs[filePath]).toBe(JSON.stringify(testJson, null, 2));
    });

    it('should not leave temp file after atomic write', async () => {
      const testJson = { test: 'data' };

      await storage.writeTempJson('region-1', 'test.json', testJson);

      const tmpPath = '/mock/documents/offline/tmp/region-1/test.json.tmp';
      expect(mockFs.hasOwnProperty(tmpPath)).toBe(false);
    });

    it('should overwrite existing file', async () => {
      const json1 = { version: 1 };
      const json2 = { version: 2 };

      await storage.writeTempJson('region-1', 'data.json', json1);
      await storage.writeTempJson('region-1', 'data.json', json2);

      const filePath = '/mock/documents/offline/tmp/region-1/data.json';
      expect(mockFs[filePath]).toBe(JSON.stringify(json2, null, 2));
    });
  });

  describe('Package Validation', () => {
    beforeEach(async () => {
      await storage.init();
      await storage.ensureTempRegionDir('region-1');
    });

    const createValidPackage = async (regionId: string) => {
      await storage.writeTempJson(regionId, 'region.json', { id: regionId });
      await storage.writeTempJson(regionId, 'water.json', { features: [] });
      await storage.writeTempJson(regionId, 'cities.json', { cities: [] });
      await storage.writeTempJson(regionId, 'roads.json', { roads: [] });

      // Create a non-empty tiles.mbtiles file
      const tilesPath = `/mock/documents/offline/tmp/${regionId}/tiles.mbtiles`;
      mockFs[tilesPath] = 'mock mbtiles data';
    };

    it('should validate a complete package', async () => {
      await createValidPackage('region-1');

      await expect(
        storage.validateTempPackage('region-1'),
      ).resolves.not.toThrow();
    });

    it('should fail validation if temp directory does not exist', async () => {
      await expect(storage.validateTempPackage('non-existent')).rejects.toThrow(
        'Temp directory does not exist',
      );
    });

    it('should fail validation if region.json is missing', async () => {
      await storage.writeTempJson('region-1', 'water.json', {});
      await storage.writeTempJson('region-1', 'cities.json', {});
      await storage.writeTempJson('region-1', 'roads.json', {});
      mockFs['/mock/documents/offline/tmp/region-1/tiles.mbtiles'] =
        'mock data';

      await expect(storage.validateTempPackage('region-1')).rejects.toThrow(
        'region.json is missing',
      );
    });

    it('should fail validation if tiles.mbtiles is missing', async () => {
      await storage.writeTempJson('region-1', 'region.json', {});
      await storage.writeTempJson('region-1', 'water.json', {});
      await storage.writeTempJson('region-1', 'cities.json', {});
      await storage.writeTempJson('region-1', 'roads.json', {});

      await expect(storage.validateTempPackage('region-1')).rejects.toThrow(
        'tiles.mbtiles is missing',
      );
    });

    it('should fail validation if file is empty', async () => {
      await createValidPackage('region-1');
      // Overwrite with empty file
      mockFs['/mock/documents/offline/tmp/region-1/water.json'] = '';

      await expect(storage.validateTempPackage('region-1')).rejects.toThrow(
        'water.json is empty',
      );
    });

    it('should fail validation if JSON is invalid', async () => {
      await createValidPackage('region-1');
      // Overwrite with invalid JSON
      mockFs['/mock/documents/offline/tmp/region-1/cities.json'] =
        'invalid json';

      await expect(storage.validateTempPackage('region-1')).rejects.toThrow(
        'not valid JSON',
      );
    });

    it('should validate manifest if present', async () => {
      await createValidPackage('region-1');

      const manifest = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        regionId: 'region-1',
        files: [
          {
            name: 'region.json',
            sizeBytes: JSON.stringify({ id: 'region-1' }, null, 2).length,
          },
          { name: 'tiles.mbtiles', sizeBytes: 'mock mbtiles data'.length },
        ],
      };

      await storage.writeTempJson('region-1', 'manifest.json', manifest);

      await expect(
        storage.validateTempPackage('region-1'),
      ).resolves.not.toThrow();
    });

    it('should fail validation if manifest regionId does not match', async () => {
      await createValidPackage('region-1');

      const manifest = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        regionId: 'wrong-region',
        files: [],
      };

      await storage.writeTempJson('region-1', 'manifest.json', manifest);

      await expect(storage.validateTempPackage('region-1')).rejects.toThrow(
        'does not match',
      );
    });
  });

  describe('Finalisation', () => {
    beforeEach(async () => {
      await storage.init();
    });

    const createValidPackage = async (regionId: string) => {
      await storage.ensureTempRegionDir(regionId);
      await storage.writeTempJson(regionId, 'region.json', { id: regionId });
      await storage.writeTempJson(regionId, 'water.json', { features: [] });
      await storage.writeTempJson(regionId, 'cities.json', { cities: [] });
      await storage.writeTempJson(regionId, 'roads.json', { roads: [] });
      mockFs[`/mock/documents/offline/tmp/${regionId}/tiles.mbtiles`] =
        'mock mbtiles data';
    };

    it('should finalize temp package to final location', async () => {
      await createValidPackage('region-1');

      await storage.finaliseTempToFinal('region-1');

      const finalDir = '/mock/documents/offline/regions/region-1';
      expect(mockDirs.has(finalDir)).toBe(true);

      const tmpDir = '/mock/documents/offline/tmp/region-1';
      expect(mockDirs.has(tmpDir)).toBe(false);
    });

    it('should generate manifest during finalisation', async () => {
      await createValidPackage('region-1');

      await storage.finaliseTempToFinal('region-1');

      const manifestPath =
        '/mock/documents/offline/regions/region-1/manifest.json';
      expect(mockFs[manifestPath]).toBeDefined();

      const manifest = JSON.parse(mockFs[manifestPath] as string);
      expect(manifest.schemaVersion).toBe(1);
      expect(manifest.regionId).toBe('region-1');
      expect(Array.isArray(manifest.files)).toBe(true);
    });

    it('should replace existing final region', async () => {
      // Create existing final region
      await storage.ensureFinalRegionDir('region-1');
      const sentinelPath =
        '/mock/documents/offline/regions/region-1/sentinel.txt';
      mockFs[sentinelPath] = 'old version';

      // Create new temp package
      await createValidPackage('region-1');

      await storage.finaliseTempToFinal('region-1');

      const finalDir = '/mock/documents/offline/regions/region-1';
      expect(mockDirs.has(finalDir)).toBe(true);

      // Old sentinel should be gone
      expect(mockFs.hasOwnProperty(sentinelPath)).toBe(false);

      // New files should exist
      const newFilePath =
        '/mock/documents/offline/regions/region-1/region.json';
      expect(mockFs[newFilePath]).toBeDefined();
    });

    it('should fail if validation fails', async () => {
      await storage.ensureTempRegionDir('region-1');
      // Missing required files

      await expect(storage.finaliseTempToFinal('region-1')).rejects.toThrow();

      // Final directory should not exist
      const finalDir = '/mock/documents/offline/regions/region-1';
      expect(mockDirs.has(finalDir)).toBe(false);
    });
  });

  describe('Delete Operations', () => {
    beforeEach(async () => {
      await storage.init();
    });

    it('should delete region completely', async () => {
      await storage.ensureFinalRegionDir('region-1');
      await storage.ensureTempRegionDir('region-1');

      mockFs['/mock/documents/offline/regions/region-1/test.json'] = '{}';
      mockFs['/mock/documents/offline/tmp/region-1/test.json'] = '{}';

      await storage.deleteRegion('region-1');

      expect(mockDirs.has('/mock/documents/offline/regions/region-1')).toBe(
        false,
      );
      expect(mockDirs.has('/mock/documents/offline/tmp/region-1')).toBe(false);
    });

    it('should not throw if region does not exist', async () => {
      await expect(storage.deleteRegion('non-existent')).resolves.not.toThrow();
    });

    it('should delete temp directory', async () => {
      await storage.ensureTempRegionDir('region-1');
      mockFs['/mock/documents/offline/tmp/region-1/test.json'] = '{}';

      await storage.deleteTemp('region-1');

      expect(mockDirs.has('/mock/documents/offline/tmp/region-1')).toBe(false);
    });

    it('should not throw if temp does not exist', async () => {
      await expect(storage.deleteTemp('non-existent')).resolves.not.toThrow();
    });
  });

  describe('Size Calculation', () => {
    beforeEach(async () => {
      await storage.init();
    });

    it('should calculate temp size', async () => {
      await storage.ensureTempRegionDir('region-1');
      mockFs['/mock/documents/offline/tmp/region-1/file1.json'] = '12345';
      mockFs['/mock/documents/offline/tmp/region-1/file2.dat'] = '67890';

      const size = await storage.getTempSizeBytes('region-1');

      expect(size).toBe(10);
    });

    it('should calculate final size', async () => {
      await storage.ensureFinalRegionDir('region-1');
      mockFs['/mock/documents/offline/regions/region-1/file1.json'] = '123';
      mockFs['/mock/documents/offline/regions/region-1/file2.dat'] = '456';

      const size = await storage.getFinalSizeBytes('region-1');

      expect(size).toBe(6);
    });

    it('should return 0 for non-existent directory', async () => {
      const size = await storage.getTempSizeBytes('non-existent');

      expect(size).toBe(0);
    });
  });
});
