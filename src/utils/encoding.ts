export function base64EncodeString(valueToEncode: string): string {
  if (typeof valueToEncode !== 'string') {
    return valueToEncode;
  }

  const stringBuffer = Buffer.from(valueToEncode);
  return encodeURIComponent(stringBuffer.toString('base64'));
}
