export function commaSeparatedValues(
  arr: Array<string>,
  conjunction: null | string = 'and',
  ifempty = ''
): string {
  const l = arr.length;
  if (!l) return ifempty;
  if (l < 2) return arr[0];
  if (l < 3) return arr.join(` ${conjunction} `);
  arr = arr.slice();
  arr[l - 1] = `${conjunction} ${arr[l - 1]}`;
  return arr.join(', ');
}

export function toKebabCase(str: string): string {
  return (
    str
      .replace(/[.,/#!$%^&*;:{}=\-_'"`~()]/g, '')
      .match(
        /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
      ) || []
  )
    .join('-')
    .toLowerCase();
}
