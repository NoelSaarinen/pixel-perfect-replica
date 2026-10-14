import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";
import { Activity, Droplets, Zap, AlertTriangle, CheckCircle2, Cpu } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Optinen hydrogeeli – älysormuksen sensorisimulaatio" },
      { name: "description", content: "Interaktiivinen simulaatio: miten optinen hydrogeeli poistaa liikehäiriön ja valon karkaamisen älysormuksen PPG-sensorissa." },
      { property: "og:title", content: "Optinen hydrogeeli – älysormuksen sensorisimulaatio" },
      { property: "og:description", content: "Näe, miten geelikerros puhdistaa sykesignaalin liikkeen aikana." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap" },
    ],
  }),
  component: Index,
});

const BPM = 68;
const N = 120;

function useSignal(motionLevel: number, gel: boolean) {
  const [data, setData] = useState(() => Array.from({ length: N }, (_, i) => ({ i, v: 0 })));
  const t = useRef(0);
  const cfg = useRef({ motionLevel, gel });
  cfg.current = { motionLevel, gel };
  useEffect(() => {
    const id = setInterval(() => {
      t.current += 0.04;
      const ph = (t.current * BPM) / 60;
      const p = ph % 1;
      // PPG-like waveform: systolic peak + dicrotic notch
      const base = Math.exp(-((p - 0.2) ** 2) / 0.006) + 0.35 * Math.exp(-((p - 0.45) ** 2) / 0.01);
      const amp = (cfg.current.motionLevel / 100) * 2.2 * (cfg.current.gel ? 0.05 : 1);
      const noise = amp * ((Math.random() - 0.5) * 1.6 + Math.sin(t.current * 7) * 0.6 + Math.sin(t.current * 2.3) * 0.8);
      setData((d) => [...d.slice(1), { i: (d[d.length - 1]?.i ?? 0) + 1, v: base + noise }]);
    }, 40);
    return () => clearInterval(id);
  }, []);
  return data;
}

function CrossSection({ motionLevel, gel }: { motionLevel: number; gel: boolean }) {
  const m = motionLevel / 100;
  const shake = m * (gel ? 4 : 18);
  const gap = gel ? 0 : m * 10;
  const beat = 60 / BPM;
  const rays: [number, number] = [-1, 1];
  return (
    <svg viewBox="0 0 400 420" className="h-full w-full">
      <defs>
        <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--metal-hi)" />
          <stop offset="1" stopColor="var(--metal)" />
        </linearGradient>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--skin)" />
          <stop offset="1" stopColor="var(--skin-deep)" />
        </linearGradient>
        <radialGradient id="ledGlow">
          <stop offset="0" stopColor="var(--led)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--led)" stopOpacity="0" />
        </radialGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>

      {/* Skin */}
      <rect x="0" y="210" width="400" height="210" fill="url(#skin)" />
      <path d="M0 210 Q100 205 200 210 T400 210" stroke="var(--skin)" strokeWidth="2" fill="none" />
      {[280, 330, 375].map((y, k) => (
        <motion.ellipse key={y} cx={80 + k * 120} cy={y} rx={30 - k * 4} ry={11 - k} fill="var(--vessel)"
          animate={{ ry: [11 - k, 14 - k, 11 - k] }} transition={{ duration: beat, repeat: Infinity }} />
      ))}
      <text x="12" y="408" className="fill-muted-foreground font-mono" fontSize="10">IHO · VERISUONET</text>

      {/* Gel */}
      <AnimatePresence>
        {gel && (
          <motion.g initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0 }} style={{ originY: "210px" }}>
            <motion.rect x="40" y="168" width="320" height="44" rx="6" fill="var(--gel)" fillOpacity="0.28"
              stroke="var(--gel)" strokeOpacity="0.8"
              animate={{ height: [44, 44 - shake, 44 + shake * 0.5, 44] }}
              transition={{ duration: 0.12, repeat: Infinity }} />
            <rect x="40" y="168" width="320" height="44" fill="var(--gel)" opacity="0.25" filter="url(#blur)" />
            <text x="290" y="196" className="fill-gel font-mono" fontSize="10">GEELI n≈1.4</text>
          </motion.g>
        )}
      </AnimatePresence>
      {!gel && <text x="268" y="198" className="fill-muted-foreground font-mono" fontSize="10">ILMARAKO n=1.0</text>}

      {/* Ring assembly */}
      <motion.g
        animate={m > 0 ? { x: [0, shake, -shake, shake * 0.5, 0], y: [0, -shake * 0.3 - gap, shake * 0.2, -gap, 0] } : { x: 0, y: 0 }}
        transition={{ duration: 0.18, repeat: Infinity }}
      >
        <rect x="20" y="60" width="360" height="90" rx="40" fill="url(#metal)" />
        <rect x="40" y="72" width="320" height="6" rx="3" fill="var(--metal-hi)" opacity="0.5" />
        <text x="200" y="105" textAnchor="middle" className="fill-muted-foreground font-mono" fontSize="11">SORMUKSEN RUNKO</text>
        <rect x="40" y="148" width="320" height="20" rx="4" fill="var(--metal)" />
        {/* LEDs */}
        {[110, 290].map((x) => (
          <g key={x}>
            <motion.circle cx={x} cy={168} r="26" fill="url(#ledGlow)" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: beat, repeat: Infinity }} />
            <rect x={x - 10} y="156" width="20" height="10" rx="2" fill="var(--led)" />
          </g>
        ))}
        <rect x="186" y="155" width="28" height="12" rx="2" fill="var(--gel)" opacity="0.9" />
        <text x="200" y="146" textAnchor="middle" className="fill-foreground font-mono" fontSize="9">PD</text>
        <text x="110" y="146" textAnchor="middle" className="fill-led font-mono" fontSize="9">LED</text>
        <text x="290" y="146" textAnchor="middle" className="fill-led font-mono" fontSize="9">LED</text>
      </motion.g>

      {/* Light rays */}
      {[110, 290].map((x, k) =>
        gel ? (
          <motion.path key={x + "g"} d={`M${x} 170 L${x + rays[k as 0] * -20} 300 Q200 330 200 172`} stroke="var(--led)" strokeWidth="3" fill="none"
            strokeDasharray="8 10" animate={{ strokeDashoffset: [0, -36] }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }} opacity="0.9" />
        ) : (
          <g key={x + "a"}>
            <motion.path d={`M${x} 170 L${x + rays[k as 0] * 25} 210 L${x + rays[k as 0] * 110} 150`} stroke="var(--led)" strokeWidth="3" fill="none"
              strokeDasharray="8 10" animate={{ strokeDashoffset: [0, -36] }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }} />
            <motion.path d={`M${x} 170 L${x + rays[k as 0] * -10} 260 Q200 290 200 172`} stroke="var(--led)" strokeWidth="1.5" fill="none" opacity={0.6 - m * 0.5}
              strokeDasharray="4 10" animate={{ strokeDashoffset: [0, -28] }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }} />
            <motion.circle cx={x + rays[k as 0] * 25} cy={210} r="6" fill="var(--led)" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
          </g>
        ),
      )}
    </svg>
  );
}

function Index() {
  const [motionLevel, setMotion] = useState(40);
  const [gel, setGel] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = useSignal(motionLevel, gel);
  const effNoise = (motionLevel / 100) * (gel ? 0.05 : 1);
  const quality = Math.round(100 - effNoise * 100);
  const clean = effNoise < 0.25;
  const color = clean ? "var(--clean)" : "var(--noisy)";

  return (
    <main className="min-h-screen p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">PPG-laboratorio · v2.6</p>
          <h1 className="text-3xl font-bold md:text-4xl">Optinen hydrogeelikerros älysormuksessa</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-2 font-mono text-xs">
          <motion.span className="h-2 w-2 rounded-full bg-clean" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          LIVE · {BPM} BPM
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="relative overflow-hidden rounded-2xl border border-border bg-panel p-4 backdrop-blur">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs text-muted-foreground"><Cpu className="h-4 w-4" /> POIKKILEIKKAUS</div>
          <div className="aspect-[400/420] w-full"><CrossSection motionLevel={motionLevel} gel={gel} /></div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-panel p-5 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground"><Activity className="h-4 w-4" /> PPG-SIGNAALI</span>
              <span className="font-mono text-sm" style={{ color }}>Signaalin laatu {quality}%</span>
            </div>
            <div className="h-52">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <YAxis domain={[-2, 3]} hide />
                    <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border border-border bg-panel p-5 backdrop-blur">
            <label className="block">
              <div className="mb-2 flex justify-between text-sm"><span className="flex items-center gap-2"><Zap className="h-4 w-4 text-noisy" /> Liikehäiriön voimakkuus</span><span className="font-mono">{motionLevel}</span></div>
              <input type="range" min={0} max={100} value={motionLevel} onChange={(e) => setMotion(+e.target.value)} className="w-full accent-primary" />
            </label>
            <button onClick={() => setGel(!gel)} className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${gel ? "border-gel bg-gel/15" : "border-border bg-muted"}`}>
              <span className="flex items-center gap-3 font-medium"><Droplets className="h-5 w-5 text-gel" /> Ota optinen geeli käyttöön</span>
              <span className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${gel ? "bg-gel" : "bg-background"}`}>
                <motion.span layout className={`h-5 w-5 rounded-full bg-foreground ${gel ? "ml-auto" : ""}`} />
              </span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={String(gel)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className={`rounded-2xl border p-5 ${gel ? "border-gel/50 bg-gel/10" : "border-noisy/50 bg-noisy/10"}`}>
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
                {gel ? <CheckCircle2 className="h-5 w-5 text-clean" /> : <AlertTriangle className="h-5 w-5 text-noisy" />}
                {gel ? "Ratkaisu: Optinen Sovitushydrogeeli" : "Ongelma: Ilmarako ja Mikroliikkeet"}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {gel
                  ? "Geeli ratkaisee molemmat ongelmat. Sen taitekerroin vastaa ihmisen ihoa, jolloin valo etenee suoraan ihoon ilman häviötä. Lisäksi geeli toimii mekaanisena iskunvaimentimena, joka pitää sensorin optisesti kytkettynä ihoon jopa voimakkaan tärinän aikana."
                  : "Sormuksen ja ihon väliin jäävä ilmarako aiheuttaa kaksi ongelmaa. Ensinnäkin valo heijastuu ihon pinnalta pois (valon karkaaminen). Toiseksi pienikin sormen liike irrottaa sensorin ihosta, mikä rikkoo PPG-signaalin täysin (liikehäiriö)."}
              </p>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
