import fs from 'fs-extra';
import os from 'os';
import yaml from 'js-yaml';
import {
  getConfigFilePath,
  configFileExists,
  configFileIsBlank,
  deleteConfigFile,
  readConfigFile,
  parseConfig,
  loadConfigFromFile,
  writeConfigToFile,
} from '../configFile';
import {
  HUBSPOT_CONFIGURATION_FILE,
  HUBSPOT_CONFIGURATION_FOLDER,
} from '../../constants';
import { CLIConfig_NEW } from '../../types/Config';

// fs spy
const existsSyncSpy = jest.spyOn(fs, 'existsSync');
const readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
const unlinkSyncSpy = jest.spyOn(fs, 'unlinkSync');
const ensureFileSyncSpy = jest.spyOn(fs, 'ensureFileSync');
const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync');

// yamp spy
const loadSpy = jest.spyOn(yaml, 'load');
const dumpSpy = jest.spyOn(yaml, 'dump');

const CONFIG = {
  defaultAccount: '',
  accounts: [],
} as CLIConfig_NEW;

describe('config/configFile', () => {
  describe('getConfigFilePath method', () => {
    it('returns the config file path', () => {
      const configFilePath = getConfigFilePath();
      const homeDir = os.homedir();

      const homeDirIndex = configFilePath.indexOf(homeDir);
      const folderIndex = configFilePath.indexOf(HUBSPOT_CONFIGURATION_FOLDER);
      const fileIndex = configFilePath.indexOf(HUBSPOT_CONFIGURATION_FILE);

      expect(homeDirIndex).toBeGreaterThan(-1);
      expect(folderIndex).toBeGreaterThan(-1);
      expect(fileIndex).toBeGreaterThan(-1);
      expect(folderIndex).toBeGreaterThan(homeDirIndex);
      expect(fileIndex).toBeGreaterThan(folderIndex);
    });
  });

  describe('configFileExists method', () => {
    it('returns true if config file exists', () => {
      existsSyncSpy.mockImplementation(() => true);
      const exists = configFileExists();

      expect(existsSyncSpy).toHaveBeenCalled();
      expect(exists).toBe(true);
    });
  });

  describe('configFileIsBlank method', () => {
    it('returns true if config file is blank', () => {
      readFileSyncSpy.mockImplementation(() => Buffer.from(''));
      const isBlank = configFileIsBlank();

      expect(readFileSyncSpy).toHaveBeenCalled();
      expect(isBlank).toBe(true);
    });
    it('returns false if config file is not blank', () => {
      readFileSyncSpy.mockImplementation(() => Buffer.from('content'));
      const isBlank = configFileIsBlank();

      expect(readFileSyncSpy).toHaveBeenCalled();
      expect(isBlank).toBe(false);
    });
  });

  describe('deleteConfigFile method', () => {
    it('deletes a file', () => {
      unlinkSyncSpy.mockImplementation(() => null);
      deleteConfigFile();

      expect(unlinkSyncSpy).toHaveBeenLastCalledWith(getConfigFilePath());
    });
  });

  describe('readConfigFile method', () => {
    it('reads the config file', () => {
      readFileSyncSpy.mockImplementation(() => Buffer.from('content'));
      const result = readConfigFile('path/to/config/file');

      expect(result).toBeDefined();
    });
    it('throws error if it fails to read the config file', () => {
      readFileSyncSpy.mockImplementation(() => {
        throw new Error('failed to do the thing');
      });

      expect(() => readConfigFile('path/to/config/file')).toThrow();
    });
  });

  describe('parseConfig method', () => {
    it('parses the config file', () => {
      loadSpy.mockImplementation(() => ({}));
      const result = parseConfig('config-source');

      expect(result).toBeDefined();
    });
    it('throws error if it fails to parse the config file', () => {
      loadSpy.mockImplementation(() => {
        throw new Error('failed to do the thing');
      });

      expect(() => parseConfig('config-source')).toThrow();
    });
  });

  describe('loadConfigFromFile method', () => {
    it('loads the config from file', () => {
      readFileSyncSpy.mockImplementation(() => Buffer.from('content'));
      loadSpy.mockImplementation(() => ({}));
      const result = loadConfigFromFile();

      expect(result).toBeDefined();
    });
    it('throws error if it fails to load the config file', () => {
      loadSpy.mockImplementation(() => {
        throw new Error('Config file could not be read: /testpath');
      });

      expect(() => loadConfigFromFile()).toThrow();
    });
  });

  describe('writeConfigToFile method', () => {
    it('writes the config to a file', () => {
      ensureFileSyncSpy.mockImplementation(() => null);
      writeFileSyncSpy.mockImplementation(() => null);
      writeConfigToFile(CONFIG);

      expect(ensureFileSyncSpy).toHaveBeenCalled();
      expect(writeFileSyncSpy).toHaveBeenCalled();
    });
    it('throws error if it fails to parse the config json', () => {
      dumpSpy.mockImplementation(() => {
        throw new Error('failed to do the thing');
      });

      expect(() => writeConfigToFile(CONFIG)).toThrow();
    });
    it('throws error if it fails to write the config to a file', () => {
      ensureFileSyncSpy.mockImplementation(() => null);
      writeFileSyncSpy.mockImplementation(() => {
        throw new Error('failed to do the thing');
      });

      expect(() => writeConfigToFile(CONFIG)).toThrow();
    });
  });
});
