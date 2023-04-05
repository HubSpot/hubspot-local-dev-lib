export type LogCallbacks<T extends string> = {
  [key in T]?: () => void;
};

export type LogCallbacksArg<T extends readonly string[]> = {
  [key in T[number]]?: () => void;
};
