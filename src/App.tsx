import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TexEngine, exportPngBlob } from '@/lib/texgen/engine';
import { CUSTOM_DEFAULT, GRADIENT_PRESETS } from '@/lib/texgen/gradients';
import { CATEGORIES, PATTERNS, PATTERN_MAP, defaultParams } from '@/lib/texgen/patterns';
import { useThumb } from '@/lib/texgen/thumbs';
import type { GradientStop } from '@/lib/texgen/types';

const PREVIEW = 640;
const RESOLUTIONS = [256, 512, 1024, 2048];
const LOOP = 4; 

type RailTab = 'params' | 'color' | 'output';

function gradientCss(stops: GradientStop[]): string {
  const s = [...stops].sort((a, b) => a.t - b.t);
  return `linear-gradient(to right, ${s.map((x) => `${x.color} ${Math.round(x.t * 100)}%`).join(', ')})`;
}

export default function App() {
  const [pid, setPid] = useState(PATTERNS[0].id);
  const [paramMap, setParamMap] = useState<Record<string, number[]>>({});
  const [cat, setCat] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<RailTab>('params');
  const [presetId, setPresetId] = useState('mono');
  const [customStops, setCustomStops] = useState<GradientStop[]>(CUSTOM_DEFAULT);
  const [invert, setInvert] = useState(false);
  const [size, setSize] = useState(1024);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [hint, setHint] = useState('就绪');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TexEngine | null>(null);
  const playRef = useRef({ playing: true, t: 0 });

  const pattern = PATTERN_MAP.get(pid)!;
  const params = paramMap[pid] ?? defaultParams(pattern);
  const stops: GradientStop[] =
    presetId === 'custom'
      ? customStops
      : GRADIENT_PRESETS.find((g) => g.id === presetId)!.stops;

  const selectPattern = useCallback((id: string) => setPid(id), []);
  const catCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of PATTERNS) m.set(p.cat, (m.get(p.cat) ?? 0) + 1);
    return m;
  }, []);

  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      engineRef.current = new TexEngine(canvas);
    } catch (e) {
      setHint(e instanceof Error ? e.message : 'WebGL2 初始化失败');
      return;
    }
    setHint((h) => h);
  }, []);

  
  const settingsRef = useRef({ pattern, params, stops, invert, time });
  settingsRef.current = { pattern, params, stops, invert, time };
  playRef.current.playing = playing;

  const renderFrame = useCallback((t?: number) => {
    const eng = engineRef.current;
    if (!eng) return;
    const s = settingsRef.current;
    eng.setGradient(s.stops);
    eng.render(s.pattern, s.params, { time: t ?? s.time, invert: s.invert });
  }, []);

  useEffect(() => {
    renderFrame();
  }, [pattern, params, stops, invert, time, renderFrame]);

  
  useEffect(() => {
    const ping = () => {
      try {
        const img = new Image();
        img.src = `http://localhost:3456/__ping__?t=${Date.now()}`;
      } catch {
        
      }
    };
    ping();
    const t = setInterval(ping, 3000);
    return () => clearInterval(t);
  }, []);

  
  useEffect(() => {
    if (!pattern.anim || !playing) return;
    let raf = 0;
    const start = performance.now() - time * 1000;
    const tick = () => {
      const t = ((performance.now() - start) / 1000) % LOOP;
      playRef.current.t = t;
      renderFrame(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    
  }, [pattern.anim, playing]);

  const setParam = (idx: number, v: number) => {
    setParamMap((m) => {
      const cur = m[pid] ?? defaultParams(pattern);
      const next = [...cur];
      next[idx] = v;
      return { ...m, [pid]: next };
    });
  };

  const randomize = () => {
    const next = pattern.params.map((d) => {
      const v = d.min + Math.random() * (d.max - d.min);
      const snapped = Math.round(v / d.step) * d.step;
      return Math.min(d.max, Math.max(d.min, Number(snapped.toFixed(4))));
    });
    setParamMap((m) => ({ ...m, [pid]: next }));
  };

  const doExport = async () => {
    setHint('正在导出…');
    try {
      const blob = await exportPngBlob(pattern, params, stops, { time, invert, size });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `texloom_${pattern.id}_${size}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setHint(`已导出 ${pattern.zh} · ${size}×${size} PNG`);
    } catch (e) {
      setHint('导出失败：' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const visiblePatterns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PATTERNS.filter(
      (p) => (cat === 'all' || p.cat === cat) && (!q || p.zh.toLowerCase().includes(q) || p.id.includes(q)),
    );
  }, [cat, query]);

  const catZh = (id: string) => CATEGORIES.find((c) => c.id === id)?.zh ?? id;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="hsl(var(--primary))" strokeWidth="1.6" />
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.55" />
          <circle cx="12" cy="12" r="2.4" fill="hsl(var(--accent))" />
        </svg>
        <span className="text-sm font-bold tracking-[0.2em]">TEX</span>
        <span className="text-xs text-muted-foreground">织纹 · 程序化贴图台</span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] tracking-wider text-muted-foreground">
          v0.1 · LOCAL
        </span>
        <div className="flex-1" />
        <div className="tnum text-[11px] text-muted-foreground">{size} × {size}</div>
        <Button size="sm" className="h-8 gap-1.5 font-bold" onClick={doExport}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 16l5-5h-3V4h-4v7H7l5 5zM5 18h14v2H5z" />
          </svg>
          导出 PNG
        </Button>
      </header>

      {}
      <div className="flex min-h-0 flex-1">
        <section className="dotgrid relative flex min-w-0 flex-1 items-center justify-center bg-background p-6">
          <canvas
            ref={canvasRef}
            width={PREVIEW}
            height={PREVIEW}
            className="max-h-full max-w-full rounded-md shadow-[0_0_0_1px_hsl(var(--border)),0_18px_50px_-12px_rgba(0,0,0,0.8)]"
          />
          {}
          <div className="absolute bottom-4 left-5 flex items-center gap-2">
            <span className="rounded bg-card/90 px-2.5 py-1 text-xs font-bold shadow ring-1 ring-border">
              {pattern.zh}
            </span>
            <span className="rounded bg-card/90 px-2 py-1 text-[10px] tracking-wider text-muted-foreground shadow ring-1 ring-border">
              {catZh(pattern.cat)}
            </span>
            {pattern.anim && (
              <span className="rounded bg-accent/15 px-2 py-1 text-[10px] tracking-wider text-accent shadow ring-1 ring-accent/30">
                动画
              </span>
            )}
          </div>
          {pattern.anim && (
            <div className="absolute bottom-4 right-5 flex w-64 items-center gap-2 rounded bg-card/90 p-2 shadow ring-1 ring-border">
              <button
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground"
                onClick={() => setPlaying((v) => !v)}
                title={playing ? '暂停' : '播放'}
              >
                {playing ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z" /></svg>
                )}
              </button>
              <input
                type="range"
                className="tx-slider"
                min={0}
                max={LOOP}
                step={0.01}
                value={playing ? time : time}
                style={{ ['--fill' as string]: `${(time / LOOP) * 100}%` }}
                onChange={(e) => {
                  setPlaying(false);
                  setTime(Number(e.target.value));
                }}
              />
              <span className="tnum w-8 shrink-0 text-right text-[10px] text-muted-foreground">
                {time.toFixed(1)}s
              </span>
            </div>
          )}
        </section>

        {}
        <aside className="flex w-[300px] shrink-0 flex-col border-l border-border bg-card">
          <div className="flex gap-1 border-b border-border p-2">
            {(
              [
                ['params', '参数'],
                ['color', '色彩'],
                ['output', '输出'],
              ] as [RailTab, string][]
            ).map(([id, zh]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 rounded px-3 py-1.5 text-xs font-bold tracking-widest transition-colors ${
                  tab === id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {zh}
              </button>
            ))}
          </div>

          <div className="tx-scroll min-h-0 flex-1 overflow-y-auto p-4">
            {tab === 'params' && (
              <div className="space-y-5">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-sm font-bold">{pattern.zh}</h2>
                  <button className="text-[11px] text-accent hover:underline" onClick={randomize}>
                    随机参数
                  </button>
                </div>
                {pattern.params.map((d, i) => (
                  <ParamRow
                    key={i}
                    label={d.label}
                    min={d.min}
                    max={d.max}
                    step={d.step}
                    value={params[i] ?? d.def}
                    onChange={(v) => setParam(i, v)}
                  />
                ))}
              </div>
            )}

            {tab === 'color' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold">配色渐变</h2>
                <div className="grid grid-cols-3 gap-1.5">
                  {GRADIENT_PRESETS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setPresetId(g.id)}
                      className={`rounded px-2 py-1.5 text-[11px] transition-colors ${
                        presetId === g.id
                          ? 'bg-primary font-bold text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {g.zh}
                    </button>
                  ))}
                  <button
                    onClick={() => setPresetId('custom')}
                    className={`rounded px-2 py-1.5 text-[11px] transition-colors ${
                      presetId === 'custom'
                        ? 'bg-primary font-bold text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    自定义
                  </button>
                </div>
                <div
                  className="h-4 w-full rounded ring-1 ring-border"
                  style={{ background: gradientCss(stops) }}
                />
                {presetId === 'custom' && (
                  <div className="space-y-3">
                    {customStops.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={s.color}
                          className="h-7 w-10 cursor-pointer rounded bg-transparent ring-1 ring-border"
                          onChange={(e) =>
                            setCustomStops((arr) => arr.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))
                          }
                        />
                        <span className="tnum w-10 text-[10px] text-muted-foreground">{s.color}</span>
                        {i === 1 && (
                          <input
                            type="range"
                            className="tx-slider flex-1"
                            min={0.05}
                            max={0.95}
                            step={0.01}
                            value={s.t}
                            style={{ ['--fill' as string]: `${(s.t - 0.05) / 0.9 * 100}%` }}
                            onChange={(e) =>
                              setCustomStops((arr) =>
                                arr.map((x, j) => (j === 1 ? { ...x, t: Number(e.target.value) } : x)),
                              )
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'output' && (
              <div className="space-y-5">
                <h2 className="text-sm font-bold">输出</h2>
                <div>
                  <div className="mb-2 text-[11px] text-muted-foreground">分辨率</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {RESOLUTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setSize(r)}
                        className={`tnum rounded px-2 py-1.5 text-[11px] transition-colors ${
                          size === r
                            ? 'bg-primary font-bold text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex cursor-pointer items-center justify-between text-xs">
                  <span>反相输出</span>
                  <button
                    onClick={() => setInvert((v) => !v)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${invert ? 'bg-primary' : 'bg-secondary'}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${
                        invert ? 'left-[18px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </label>
                <Button className="w-full font-bold" onClick={doExport}>
                  导出 PNG · {size}
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-border px-4 py-2.5">
            <div className="truncate text-[11px] text-muted-foreground">{hint}</div>
          </div>
        </aside>
      </div>

      {}
      <footer className="shrink-0 border-t border-border bg-card">
        <div className="tx-scroll flex items-center gap-2 overflow-x-auto border-b border-border px-4 py-2">
          <button
            onClick={() => setCat('all')}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] transition-colors ${
              cat === 'all'
                ? 'bg-primary font-bold text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            全部 · {PATTERNS.length}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] transition-colors ${
                cat === c.id
                  ? 'bg-primary font-bold text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.zh} · {catCounts.get(c.id) ?? 0}
            </button>
          ))}
          <div className="w-2 shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索图案…"
            className="ml-auto h-7 w-44 shrink-0 text-xs"
          />
        </div>
        <div className="tx-scroll flex gap-2 overflow-x-auto px-4 py-2.5">
          {visiblePatterns.map((p) => (
            <GalleryItem key={p.id} id={p.id} zh={p.zh} active={pid === p.id} onSelect={selectPattern} />
          ))}
          {visiblePatterns.length === 0 && (
            <div className="py-4 text-xs text-muted-foreground">没有匹配的图案</div>
          )}
        </div>
      </footer>
    </div>
  );
}


const GalleryItem = memo(function GalleryItem(props: {
  id: string;
  zh: string;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    
    const fallback = setTimeout(() => setInView(true), 2000);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
          clearTimeout(fallback);
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, []);
  const thumb = useThumb(inView ? props.id : null);
  return (
    <button
      ref={ref}
      onClick={() => props.onSelect(props.id)}
      className={`w-[76px] shrink-0 rounded-md p-1 text-center transition-colors ${
        props.active ? 'bg-secondary ring-1 ring-primary' : 'hover:bg-secondary'
      }`}
    >
      {thumb ? (
        <img src={thumb} alt={props.zh} className="h-14 w-14 rounded ring-1 ring-border" draggable={false} />
      ) : (
        <div className="h-14 w-14 animate-pulse rounded bg-secondary ring-1 ring-border" />
      )}
      <div
        className={`mt-1 truncate text-[10px] ${props.active ? 'font-bold text-primary' : 'text-muted-foreground'}`}
      >
        {props.zh}
      </div>
    </button>
  );
});

function ParamRow(props: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const { label, min, max, step, value, onChange } = props;
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-secondary-foreground">{label}</span>
        <input
          type="number"
          className="tnum w-16 rounded bg-secondary px-1.5 py-0.5 text-right text-[11px] outline-none ring-1 ring-transparent focus:ring-primary"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
        />
      </div>
      <input
        type="range"
        className="tx-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ['--fill' as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
