export function getFlagInHash(flagName: string): boolean {
  // TODO: More exact matching after adding more flags
  return new RegExp(`\\b${flagName}\\b`).test(location.hash);
}
