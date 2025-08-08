export function isDeepEqual(
  object1: unknown,
  object2: unknown,
  ignoreKeys?: string[]
): boolean {
  if (object1 === object2) {
    return true;
  }

  if (
    object1 === null ||
    object2 === null ||
    typeof object1 !== 'object' ||
    typeof object2 !== 'object'
  ) {
    return object1 === object2;
  }

  if (typeof object1 !== typeof object2) {
    return false;
  }

  const isArray1 = Array.isArray(object1);
  const isArray2 = Array.isArray(object2);
  if (isArray1 !== isArray2) {
    return false;
  }

  const objKeys1 = Object.keys(object1).filter(
    key => !ignoreKeys?.includes(key)
  );
  const objKeys2 = Object.keys(object2).filter(
    key => !ignoreKeys?.includes(key)
  );

  if (objKeys1.length !== objKeys2.length) return false;

  for (const key of objKeys1) {
    const value1 = object1[key as keyof typeof object1];
    const value2 = object2[key as keyof typeof object2];

    if (!isDeepEqual(value1, value2, ignoreKeys)) {
      return false;
    }
  }
  return true;
}
