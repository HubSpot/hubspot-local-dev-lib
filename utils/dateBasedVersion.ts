export function getDateBasedVersionSegment(
  version: string,
  stableStartDate: Date
): string {
  return Date.now() < stableStartDate.getTime() ? `${version}-beta` : version;
}
