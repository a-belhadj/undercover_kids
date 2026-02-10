export function isImageUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}
