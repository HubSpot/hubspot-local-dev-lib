import lang from '../lang/en.yml' assert { type: 'yaml' };

export type LanguageObject = typeof lang;

export type RecusirveLanguageObject = LanguageObject;

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;

type Leaves<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
  ? { [K in keyof T]-?: Join<K, Leaves<T[K]>> }[keyof T]
  : '';

export type LangKey = Leaves<LanguageObject>;

// Add more locales when needed
export type Locale = 'en';
