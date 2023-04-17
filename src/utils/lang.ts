import { join } from 'path';
import { existsSync, readFileSync } from 'fs-extra';
import { load } from 'js-yaml';
import { interpolate } from './interpolation';

const MISSING_LANGUAGE_DATA_PREFIX = '[Missing language data]';

type LanguageObject = {
  [key: string]: LanguageObject | string;
};

let locale = '';
let languageObj: LanguageObject;

function loadLanguageFromYaml(): void {
  if (languageObj) return;

  try {
    const nodeLocale = Intl.DateTimeFormat()
      .resolvedOptions()
      .locale.split('-')[0];
    const languageFilePath = join(__dirname, `../lang/${nodeLocale}.lyaml`);
    const languageFileExists = existsSync(languageFilePath);

    // Fall back to using the default language file
    locale = languageFileExists ? nodeLocale : 'en';
    languageObj = load(
      readFileSync(join(__dirname, `../lang/${locale}.lyaml`), 'utf8')
    ) as LanguageObject;
  } catch (e) {
    throw new Error(`Error loading language data: ${e}`);
  }
}

function getTextValue(lookupDotNotation: string): string {
  const lookupProps = [locale, ...lookupDotNotation.split('.')];
  const missingTextData = `${MISSING_LANGUAGE_DATA_PREFIX}: ${lookupProps.join(
    '.'
  )}`;
  let textValue = languageObj as LanguageObject | string;
  let previouslyCheckedProp = lookupProps[0];

  lookupProps.forEach(prop => {
    previouslyCheckedProp = prop;
    if (typeof textValue === 'object') {
      textValue = textValue[prop];
    } else {
      console.debug(
        `Unable to access language property: ${lookupProps.join(
          '.'
        )}. Failed to access prop "${previouslyCheckedProp}".`
      );
    }
  });

  if (typeof textValue !== 'string') {
    return missingTextData;
  }

  return textValue;
}

export function i18n(
  lookupDotNotation: string,
  options: { [identifier: string]: string | number } = {}
) {
  if (typeof lookupDotNotation !== 'string') {
    throw new Error(
      `i18n must be passed a string value for lookupDotNotation, received ${typeof lookupDotNotation}`
    );
  }

  const textValue = getTextValue(lookupDotNotation);
  const shouldInterpolate = !textValue.startsWith(MISSING_LANGUAGE_DATA_PREFIX);

  return shouldInterpolate ? interpolate(textValue, options) : textValue;
}

loadLanguageFromYaml();
