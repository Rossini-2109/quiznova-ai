export function sanitizeName(name: string): string {
  // Remove trailing patterns like " (123)" or " (abc)"
  return name.replace(/\s+\(\d+\)$/, '').trim();
}
