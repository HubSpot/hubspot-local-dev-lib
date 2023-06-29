import lang from '../lang/en.yml' assert { type: 'yaml' };

type LanguageData = typeof lang.en;
type DebugLanguageData = typeof lang.en.debug;
type ErrorLanguageData = typeof lang.en.errors;

export type LanguageObject = {
  [key: string]: LanguageObject | string;
};

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;

export type Leaves<T> = [10] extends [never]
  ? never
  : T extends object
  ? { [K in keyof T]-?: Join<K, Leaves<T[K]>> }[keyof T]
  : '';

type Split<S extends string> = string extends S
  ? string[]
  : S extends ''
  ? []
  : S extends `${infer T}.${infer U}`
  ? [T, ...Split<U>]
  : [S];

type TrimArray<A extends Array<any>> = A extends [...infer First, string]
  ? First
  : never;

type Tail<Items extends string[]> = Items extends [string, ...infer Tail]
  ? Tail
  : never;

type HasTail<Items extends string[]> = Items extends [any, any, ...any[]]
  ? true
  : false;

type JoinArray<Items> = Items extends [string, ...string[]]
  ? `${Items[0]}${HasTail<Items> extends true
      ? `.${JoinArray<Tail<Items>>}`
      : ``}`
  : string[] extends Items
  ? string
  : ``;

export type LangKey = Leaves<LanguageData>;
export type DebugLangKey = Leaves<DebugLanguageData>;
export type ErrorLangKey = Leaves<ErrorLanguageData>;
export type CustomLoggerPrimaryLangKey = JoinArray<
  TrimArray<Split<DebugLangKey>>
>;

// export type CustomLoggerSecondaryLangKey<K extends CustomLoggerPrimaryLangKey> =
//   DebugLangKey extends `${K}.${infer Rest}` ? Rest : never;
