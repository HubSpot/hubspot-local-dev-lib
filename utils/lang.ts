import { join } from 'path';
import { existsSync, readFileSync } from 'fs-extra';
import { load } from 'js-yaml';

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
      // TODO - Replace with debug?
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

const delimiters = {
  interpolation: {
    start: '{{',
    end: '}}',
  },
};

function generateReplaceFn(
  matchedText: string,
  startIndex: number,
  replacementString: string | number
): (currentStringValue: string) => string {
  return function (currentStringValue: string): string {
    return `${currentStringValue.slice(0, startIndex)}${
      replacementString || ''
    }${currentStringValue.slice(startIndex + matchedText.length)}`;
  };
}

type InterpolationData = {
  [identifier: string]: string | number;
};

export function interpolate(
  stringValue: string,
  interpolationData: InterpolationData
): string {
  const interpolationIdentifierRegEx = new RegExp(
    `${delimiters.interpolation.start}(.*?)${delimiters.interpolation.end}`,
    'g'
  );
  const replaceQueue = [];
  let match: RegExpExecArray | null;

  // while & reduce necessary because RegExp.exec is stateful and only runs
  // from beginning to end of string
  while ((match = interpolationIdentifierRegEx.exec(stringValue)) != null) {
    const { 0: matchedText, 1: rawIdentifier, index } = match;
    const identifier = rawIdentifier.trim();

    if (identifier) {
      replaceQueue.unshift(
        generateReplaceFn(matchedText, index, interpolationData[identifier])
      );
    }
  }

  const compiledString = replaceQueue.reduce(
    (currentValue, replaceFn) => replaceFn(currentValue),
    stringValue
  );

  return compiledString;
}

export function i18n(
  lookupDotNotation: string,
  options: { [identifier: string]: string | number } = {}
) {
  if (!languageObj) {
    loadLanguageFromYaml();
  }

  if (typeof lookupDotNotation !== 'string') {
    throw new Error(
      `i18n must be passed a string value for lookupDotNotation, received ${typeof lookupDotNotation}`
    );
  }

  const textValue = getTextValue(lookupDotNotation);
  const shouldInterpolate = !textValue.startsWith(MISSING_LANGUAGE_DATA_PREFIX);

  return shouldInterpolate ? interpolate(textValue, options) : textValue;
}

export const setLangData = (newLocale: string, newLangObj: LanguageObject) => {
  locale = newLocale;
  languageObj = newLangObj;
};
