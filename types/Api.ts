import { HTTP_METHOD_VERBS } from '../constants/api.js';

export type HttpMethod = keyof typeof HTTP_METHOD_VERBS;
