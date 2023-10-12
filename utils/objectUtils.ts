export function isObject(value: object): boolean {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}

export function mergeDeep(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: { [key: string]: any },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...sources: Array<{ [key: string]: any }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { [key: string]: any } {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && source && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}
