import fs from 'fs-extra';
import path from 'path';
import findup from 'findup-sync';
import { getCwd } from '../path';
import { downloadGithubRepoContents } from '../github';
import { logger } from '../logger';
import { throwErrorWithMessage } from '../../errors/standardErrors';
import { throwFileSystemError } from '../../errors/fileSystemErrors';
import { i18n } from '../../utils/lang';

import {
  FunctionConfig,
  FunctionConfigInfo,
  FunctionInfo,
  FunctionOptions,
} from '../../types/Functions';
const i18nKey = 'lib.cms.functions';

function isObjectOrFunction(value: object): boolean {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}

function createEndpoint(
  endpointMethod: string,
  filename: string
): { method: string; file: string } {
  return {
    method: endpointMethod || 'GET',
    file: filename,
  };
}

function createConfig({
  endpointPath,
  endpointMethod,
  functionFile,
}: FunctionConfigInfo): FunctionConfig {
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

function writeConfig(configFilePath: string, config: FunctionConfig): void {
  const configJson = JSON.stringify(config, null, '  ');
  fs.writeFileSync(configFilePath, configJson);
}

function updateExistingConfig(
  configFilePath: string,
  { endpointPath, endpointMethod, functionFile }: FunctionConfigInfo
): void {
  let configString!: string;
  try {
    configString = fs.readFileSync(configFilePath).toString();
  } catch (err) {
    logger.debug(
      i18n(`${i18nKey}.updateExistingConfig.unableToReadFile`, {
        configFilePath,
      })
    );
    throwFileSystemError(err, {
      filepath: configFilePath,
      read: true,
    });
  }

  let config!: FunctionConfig;
  try {
    config = JSON.parse(configString) as FunctionConfig;
  } catch (err) {
    logger.debug(
      i18n(`${i18nKey}.updateExistingConfig.invalidJSON`, {
        configFilePath,
      })
    );
    throwFileSystemError(err, {
      filepath: configFilePath,
      read: true,
    });
  }

  if (!isObjectOrFunction(config)) {
    throwErrorWithMessage(
      `${i18nKey}.updateExistingConfig.errors.configIsNotObjectError`,
      { configFilePath }
    );
  }
  if (config.endpoints) {
    if (config.endpoints[endpointPath]) {
      throwErrorWithMessage(
        `${i18nKey}.updateExistingConfig.errors.endpointAreadyExistsError`,
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
    logger.debug(
      i18n(`${i18nKey}.updateExistingConfig.couldNotUpdateFile`, {
        configFilePath,
      })
    );
    throwFileSystemError(err, {
      filepath: configFilePath,
      write: true,
    });
  }
}

export async function createFunction(
  functionInfo: FunctionInfo,
  dest: string,
  options: FunctionOptions = {}
): Promise<void> {
  const { functionsFolder, filename, endpointPath, endpointMethod } =
    functionInfo;

  const allowExistingFile = options.allowExistingFile || false;

  const ancestorFunctionsConfig = findup('serverless.json', {
    cwd: getCwd(),
    nocase: true,
  });

  if (ancestorFunctionsConfig) {
    throwErrorWithMessage(
      `${i18nKey}.createFunction.errors.nestedConfigError`,
      {
        ancestorConfigPath: path.dirname(ancestorFunctionsConfig),
      }
    );
  }

  const folderName = functionsFolder.endsWith('.functions')
    ? functionsFolder
    : `${functionsFolder}.functions`;
  const functionFile = filename.endsWith('.js') ? filename : `${filename}.js`;

  const destPath = path.join(dest, folderName);
  if (fs.existsSync(destPath)) {
    logger.log(
      i18n(`${i18nKey}.createFunction.destPathAlreadyExists`, {
        path: destPath,
      })
    );
  } else {
    fs.mkdirp(destPath);
    logger.log(
      i18n(`${i18nKey}.createFunction.createdDest`, {
        path: destPath,
      })
    );
  }
  const functionFilePath = path.join(destPath, functionFile);
  const configFilePath = path.join(destPath, 'serverless.json');

  if (!allowExistingFile && fs.existsSync(functionFilePath)) {
    throwErrorWithMessage(
      `${i18nKey}.createFunction.errors.jsFileConflictError`,
      {
        functionFilePath,
      }
    );
  }

  await downloadGithubRepoContents(
    'HubSpot/cms-sample-assets',
    'functions/sample-function.js',
    functionFilePath
  );

  logger.log(
    i18n(`${i18nKey}.createFunction.createdFunctionFile`, {
      path: functionFilePath,
    })
  );

  if (fs.existsSync(configFilePath)) {
    updateExistingConfig(configFilePath, {
      endpointPath,
      endpointMethod,
      functionFile,
    });

    logger.log(
      i18n(`${i18nKey}.createFunction.createdFunctionFile`, {
        path: functionFilePath,
      })
    );
    logger.log(
      i18n(`${i18nKey}.createFunction.success`, {
        endpointPath: endpointPath,
        folderName,
      })
    );
  } else {
    const config = createConfig({ endpointPath, endpointMethod, functionFile });
    try {
      writeConfig(configFilePath, config);
    } catch (err) {
      logger.debug(
        i18n(`${i18nKey}.createFunction.failedToCreateFile`, {
          configFilePath,
        })
      );
      throwFileSystemError(err, {
        filepath: configFilePath,
        write: true,
      });
    }
    logger.log(
      i18n(`${i18nKey}.createFunction.createdConfigFile`, {
        path: configFilePath,
      })
    );
    logger.log(
      i18n(`${i18nKey}.createFunction.success`, {
        endpointPath: endpointPath,
        folderName,
      })
    );
  }
}
