export type LogCallbacks<T extends string> = {
  [key in T]: () => void;
};
