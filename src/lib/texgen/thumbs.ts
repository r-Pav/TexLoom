import { useEffect, useState } from 'react';
import { renderThumb } from './engine';
import { GRADIENT_PRESETS } from './gradients';
import { PATTERNS } from './patterns';
import type { PatternDef } from './types';


const cache = new Map<string, string>();
const queued = new Set<string>();
let queue: PatternDef[] = [];
let running = false;
const listeners = new Set<() => void>();

function pump() {
  if (running) return;
  const next = queue.shift();
  if (!next) return;
  running = true;
  try {
    if (!cache.has(next.id)) {
      cache.set(next.id, renderThumb(next, GRADIENT_PRESETS[0].stops));
      listeners.forEach((fn) => fn());
    }
  } catch (e) {
    console.error(e);
  } finally {
    running = false;
    if (queue.length) setTimeout(pump, 0);
  }
}

export function getThumb(id: string): string | null {
  if (cache.has(id)) return cache.get(id)!;
  const p = PATTERNS.find((x) => x.id === id);
  if (p && !queued.has(id)) {
    queued.add(id);
    queue.push(p);
    setTimeout(pump, 30);
  }
  return null;
}

export function subscribeThumbs(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}





export function useThumb(id: string | null): string | null {
  const [thumb, setThumb] = useState<string | null>(() => (id ? getThumb(id) : null));
  useEffect(() => {
    if (!id) {
      setThumb(null);
      return;
    }
    let cur = getThumb(id);
    setThumb(cur);
    return subscribeThumbs(() => {
      const t = getThumb(id);
      if (t !== cur) {
        cur = t;
        setThumb(t);
      }
    });
  }, [id]);
  return thumb;
}
