export function isObject(value: object): boolean {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}
