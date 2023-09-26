import fs from 'fs-extra';
import path from 'path';
import findup from 'findup-sync';
import { getCwd } from '../path';
import { downloadGithubRepoContents } from '../github';
import { debug, makeTypedLogger } from '../../utils/logger';
import { isObject } from '../../utils/objectUtils';
import { throwErrorWithMessage } from '../../errors/standardErrors';
import { throwFileSystemError } from '../../errors/fileSystemErrors';
import { BaseError } from '../../types/Error';
import { LogCallbacksArg } from '../../types/LogCallbacks';

const i18nKey = 'cms.functions';

type Config = {
  runtime: string;
  version: string;
  environment: object;
  secrets: Array<string>;
  endpoints: {
    [key: string]: {
      method: string;
      file: string;
    };
  };
};

function createEndpoint(endpointMethod: string, filename: string) {
  return {
    method: endpointMethod || 'GET',
    file: filename,
  };
}

type ConfigInfo = {
  endpointPath: string;
  endpointMethod: string;
  functionFile: string;
};

function createConfig({
  endpointPath,
  endpointMethod,
  functionFile,
}: ConfigInfo): Config {
  return {
    runtime: 'nodejs18.x',
    version: '1.0',
    environment: {},
    secrets: [],
    endpoints: {
      [endpointPath]: createEndpoint(endpointMethod, functionFile),
    },
  };
}

function writeConfig(configFilePath: string, config: Config): void {
  const configJson = JSON.stringify(config, null, '  ');
  fs.writeFileSync(configFilePath, configJson);
}

function updateExistingConfig(
  configFilePath: string,
  { endpointPath, endpointMethod, functionFile }: ConfigInfo
) {
  let configString!: string;
  try {
    configString = fs.readFileSync(configFilePath).toString();
  } catch (err) {
    debug(`${i18nKey}.updateExistingConfig.unableToReadFile`, {
      configFilePath,
    });
    throwFileSystemError(err as BaseError, {
      filepath: configFilePath,
      read: true,
    });
  }

  let config!: Config;
  try {
    config = JSON.parse(configString);
  } catch (err) {
    debug(`${i18nKey}.updateExistingConfig.invalidJSON`, {
      configFilePath,
    });
    throwFileSystemError(err as BaseError, {
      filepath: configFilePath,
      read: true,
    });
  }

  if (!isObject(config)) {
    throwErrorWithMessage(`${i18nKey}.updateExistingConfig.configIsNotObjectError`, {
      configFilePath,
    });
  }
  if (config.endpoints) {
    if (config.endpoints[endpointPath]) {
      throwErrorWithMessage(
        `${i18nKey}.updateExistingConfig.endpointAreadyExistsError`,
        {
          configFilePath,
          endpointPath,
        }
      );
    } else {
      config.endpoints[endpointPath] = createEndpoint(
        endpointMethod,
        functionFile
      );
    }
  } else {
    config.endpoints = {
      [endpointPath]: createEndpoint(endpointMethod, functionFile),
    };
  }
  try {
    writeConfig(configFilePath, config);
  } catch (err) {
    debug(`${i18nKey}.updateExistingConfig.couldNotUpdateFile`, {
      configFilePath,
    });
    throwFileSystemError(err as BaseError, {
      filepath: configFilePath,
      write: true,
    });
  }
}

type FunctionInfo = {
  functionsFolder: string;
  filename: string;
  endpointPath: string;
  endpointMethod: string;
};

type FunctionOptions = {
  allowExistingFile?: boolean;
};

const createFunctionCallbackKeys = [
  'destPathAlreadyExists',
  'createdDest',
  'createdFunctionFile',
  'createdConfigFile',
  'success',
];

export async function createFunction(
  functionInfo: FunctionInfo,
  dest: string,
  options: FunctionOptions,
  logCallbacks?: LogCallbacksArg<typeof createFunctionCallbackKeys>
): Promise<void> {
  const logger = makeTypedLogger<typeof createFunctionCallbackKeys>(
    logCallbacks,
    `${i18nKey}.createFunction`
  );
  const { functionsFolder, filename, endpointPath, endpointMethod } =
    functionInfo;

  const allowExistingFile = options.allowExistingFile || false;

  const ancestorFunctionsConfig = findup('serverless.json', {
    cwd: getCwd(),
    nocase: true,
  });

  if (ancestorFunctionsConfig) {
    throwErrorWithMessage(`${i18nKey}.createFunction.nestedConfigError`, {
      ancestorConfigPath: path.dirname(ancestorFunctionsConfig),
    });
  }

  const folderName = functionsFolder.endsWith('.functions')
    ? functionsFolder
    : `${functionsFolder}.functions`;
  const functionFile = filename.endsWith('.js') ? filename : `${filename}.js`;

  const destPath = path.join(dest, folderName);
  if (fs.existsSync(destPath)) {
    logger('destPathAlreadyExists', {
      path: destPath,
    });
  } else {
    fs.mkdirp(destPath);
    logger('createdDest', {
      path: destPath,
    });
  }
  const functionFilePath = path.join(destPath, functionFile);
  const configFilePath = path.join(destPath, 'serverless.json');

  if (!allowExistingFile && fs.existsSync(functionFilePath)) {
    throwErrorWithMessage(`${i18nKey}.createFunction.jsFileConflictError`, {
      functionFilePath,
    });
  }

  await downloadGithubRepoContents(
    'HubSpot/cms-sample-assets',
    'functions/sample-function.js',
    functionFilePath
  );

  logger('createdFunctionFile', {
    path: functionFilePath,
  });

  if (fs.existsSync(configFilePath)) {
    updateExistingConfig(configFilePath, {
      endpointPath,
      endpointMethod,
      functionFile,
    });

    logger('createdFunctionFile', {
      path: functionFilePath,
    });
    logger('success', {
      endpointPath: endpointPath,
      folderName,
    });
  } else {
    const config = createConfig({ endpointPath, endpointMethod, functionFile });
    try {
      writeConfig(configFilePath, config);
    } catch (err) {
      debug(`${i18nKey}.createFunction.failedToCreateFile`, {
        configFilePath,
      });
      throwFileSystemError(err as BaseError, {
        filepath: configFilePath,
        write: true,
      });
    }
    logger('createdConfigFile', {
      path: configFilePath,
    });
    logger('success', {
      endpointPath: endpointPath,
      folderName,
    });
  }
}
