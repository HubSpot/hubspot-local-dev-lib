import { InterpolationData } from './Lang';

export type LogCallbacks<T extends string> = {
  [key in T]?: (interpolationData?: InterpolationData) => void;
};

export type LogCallbacksArg<T extends readonly string[]> = {
  [key in T[number]]?: () => void;
};
