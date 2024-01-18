import lang from '../lang/en.json';
import { Leaves } from './Utils';

export type GenericLanguageObject = {
  [key: string]: string | GenericLanguageObject;
};

export type LanguageObject = typeof lang;

export type LangKey = Leaves<LanguageObject>;

export type InterpolationData = {
  [identifier: string]: string | number;
};
