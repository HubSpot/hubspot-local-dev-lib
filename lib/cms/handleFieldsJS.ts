import fs from 'fs-extra';
import { FieldsJs, createTmpDirSync } from './FieldsJs';

export async function handleMultipleFieldsJs(
  filePaths: string[],
  projectRoot: string,
  saveOutput: boolean,
  fieldOptions?: string
): Promise<[string[], string]> {
  const tempDirPath = createTmpDirSync('hubspot-temp-fieldsjs-output-');

  const fieldsJs = filePaths.map(
    path => new FieldsJs(projectRoot, path, fieldOptions)
  );

  const destPaths = await Promise.all(
    fieldsJs.map(async fjs => {
      const jsonOutput = await fjs.convert();
      const writePath = fjs.getWritePath(tempDirPath);

      if (!jsonOutput) throw new Error();

      fs.writeFileSync(writePath, jsonOutput);

      if (saveOutput) {
        const saveWritePath = fjs.getWritePath(projectRoot);
        fs.copyFileSync(writePath, saveWritePath);
      }
      return writePath;
    })
  ).catch(err => {
    console.log('err', err);
    throw new Error(err);
  });

  if (!destPaths) {
    throw new Error();
  }

  return [destPaths, tempDirPath];
}

export async function handleFieldsJs(
  filePath: string,
  projectRoot: string,
  saveOutput: boolean,
  fieldOptions?: string
): Promise<[string, string]> {
  const [destPaths, tempDirPath] = await handleMultipleFieldsJs(
    [filePath],
    projectRoot,
    saveOutput,
    fieldOptions
  );
  if (destPaths.length === 1) {
    return [destPaths[0], tempDirPath];
  }
  throw new Error();
}
