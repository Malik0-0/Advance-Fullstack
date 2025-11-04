export const nowISO = () => new Date().toISOString();

export function nextId<T extends { id: number }>(arr: T[]): number {
  return arr.length ? Math.max(...arr.map(a => a.id)) + 1 : 1;
}
