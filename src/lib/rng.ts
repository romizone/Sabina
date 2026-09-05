export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seedInput: string): () => number {
  let seed = hashSeed(seedInput) % 2147483646;
  if (seed === 0) seed = 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function amount(rng: () => number, min: number, max: number, step = 1000): number {
  const span = Math.floor((max - min) / step);
  return min + Math.floor(rng() * (span + 1)) * step;
}

export function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}
