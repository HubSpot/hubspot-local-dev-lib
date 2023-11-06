import lang from '../lang/en.json';
import { Leaves } from './Utils';

type LanguageData = typeof lang.en;

export type LangKey = Leaves<LanguageData>;
