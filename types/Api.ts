import { HTTP_METHOD_VERBS } from '../constants/api';

export type HttpMethod = keyof typeof HTTP_METHOD_VERBS;
