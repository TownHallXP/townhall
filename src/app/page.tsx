"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";

// ─── Datos ────────────────────────────────────────────────────────────────────

const CHAOS_WIDGETS = [
  { color: "#25D366", icon: "chat",     pos: { top: "10%",    left: "-5%"  }, dur: "2.5s", delay: "0s",   z: 20 },
  { color: "#0088cc", icon: "send",     pos: { top: "25%",    right: "5%"  }, dur: "3.2s", delay: "0.8s", z: 10 },
  { color: "#5865F2", icon: "groups",   pos: { top: "45%",    left: "-5%"  }, dur: "2.8s", delay: "1.5s", z: 30 },
  { color: "#E4405F", icon: "favorite", pos: { top: "55%",    right: "-8%" }, dur: "3.5s", delay: "0.4s", z: 20 },
  { color: "#25D366", icon: "call",     pos: { bottom: "15%", left: "10%"  }, dur: "2.2s", delay: "1.1s", z: 40 },
  { color: "#25D366", icon: "chat",     pos: { bottom: "5%",  right: "15%" }, dur: "2.1s", delay: "1.8s", z: 50 },
  { color: "#0088cc", icon: "send",     pos: { top: "5%",     right: "38%" }, dur: "3.8s", delay: "2.2s", z: 10 },
  { color: "#5865F2", icon: "groups",   pos: { bottom: "35%", left: "18%"  }, dur: "2.6s", delay: "0.5s", z: 20 },
];

const PILLARS = [
  { num: "I.",   icon: "how_to_reg", title: "Identidad Verificada",  desc: "Solo ciudadanos reales, validados en persona." },
  { num: "II.",  icon: "forum",      title: "Foro Deliberativo",      desc: "Debates con historial público e inmutable." },
  { num: "III.", icon: "ballot",     title: "Votaciones Legítimas",   desc: "Procesos auditables y colectivos." },
  { num: "IV.",  icon: "hub",        title: "Colectivización",  desc: "Gobernanza horizontal por consenso." },
];

const STEPS = [
  { icon: "person_add",    title: "Crea tu cuenta",      desc: "Regístrate con tu nombre y ubicación básica." },
  { icon: "verified_user", title: "Valídate en persona", desc: "Acude con tu identificación oficial a un punto de validación." },
  { icon: "how_to_vote",   title: "Participa",           desc: "Accede al foro, debate y vota. Tu nombre real, tu voz real." },
];

const DOTS = ["I", "II", "III", "IV"];

// ─── Tokens de color ──────────────────────────────────────────────────────────

const T = {
  accent:   "#B5A642",
  bg1:      "#0D0F0E",   // slides 1 y 4
  bg2:      "#121413",   // slides 2 y 3
  textMain: "#F0EDE6",
  textSub:  "#8A8A82",
  border:   "#4a4737",
} as const;

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  const [headerHidden, setHeaderHidden] = useState(false);

  // Redirigir a /foro si ya hay sesión activa
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push("/foro");
    })();
  }, []);

  // IntersectionObserver — sincronizar slide activo y visibilidad del header
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const sections = Array.from(container.querySelectorAll("[data-slide]"));
    let lastY = 0;
    let active = 0;

    const syncHeader = (scrollTop: number) => {
      const goingDown = scrollTop > lastY;
      const first = active === 0;
      const last  = active === sections.length - 1;
      setHeaderHidden(!first && !last && goingDown);
      lastY = scrollTop;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            active = sections.indexOf(e.target as HTMLElement);
            setSlide(active);
            syncHeader(container.scrollTop);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    sections.forEach((s) => observer.observe(s));
    const onScroll = () => syncHeader(container.scrollTop);
    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", onScroll);
    };
  }, []);

  const goTo = (i: number) => {
    const container = scrollRef.current;
    if (!container) return;
    container.querySelectorAll("[data-slide]")[i]?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* ── Grain overlay ─────────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999,
          opacity: 0.03,
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")',
        }}
      />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 w-full z-[60] flex justify-between items-center px-6 py-4 md:px-10 md:py-6 shadow-2xl"
        style={{
          backgroundColor: T.bg2,
          transform: headerHidden ? "translateY(-100%)" : "translateY(0)",
          opacity: headerHidden ? 0 : 1,
          pointerEvents: headerHidden ? "none" : "auto",
          transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease",
        }}
      >
        <span className="font-serif text-xl font-bold uppercase tracking-tighter" style={{ color: T.textMain }}>
          TownHall
        </span>
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 text-[11px] font-medium uppercase tracking-widest hover:scale-95 transition-transform"
          style={{ backgroundColor: T.accent, color: T.bg2 }}
        >
          Iniciar Sesión
        </button>
      </header>

      {/* ── Dot navigation ────────────────────────────────────────────────── */}
      <aside className="fixed top-1/2 -translate-y-1/2 right-4 md:right-10 z-50 flex flex-col gap-5 items-center">
        {DOTS.map((label, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            title={label}
            className="group flex flex-col items-center gap-1 transition-all duration-300"
          >
            <span
              className="font-serif text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: i === slide ? T.accent : T.textSub }}
            >
              {label}
            </span>
            <div
              className="rounded-full transition-all duration-300"
              style={
                i === slide
                  ? { width: 10, height: 10, backgroundColor: T.accent, transform: "scale(1.25)" }
                  : { width: 6,  height: 6,  border: `1px solid ${T.textSub}`, opacity: 0.4 }
              }
            />
          </button>
        ))}
      </aside>

      {/* ── Scroll container ──────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="th-scroll"
        style={{ scrollSnapType: "y mandatory", overflowY: "scroll", height: "100vh" }}
      >

        {/* ━━ SLIDE 1 — IDENTITY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          data-slide
          className="relative flex flex-col items-center justify-center overflow-hidden px-6"
          style={{ scrollSnapAlign: "start", height: "100vh", backgroundColor: T.bg1 }}
        >
          <div className="relative z-10 text-center max-w-2xl pt-14">
            <span
              className="block text-[10px] font-medium uppercase mb-3"
              style={{ color: T.accent, letterSpacing: "0.2em" }}
            >
              INFRAESTRUCTURA CÍVICA DIGITAL
            </span>
            <h1
              className="font-serif font-bold leading-none mb-4 text-5xl md:text-7xl"
              style={{ color: T.textMain }}
            >
              TownHall
            </h1>
            <p
              className="text-sm md:text-base font-light mb-10 max-w-md mx-auto"
              style={{ color: T.textSub }}
            >
              Democracia directa, verificable y legítima para la gente.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push("/registro")}
                className="w-full sm:w-auto px-8 py-3 text-[11px] font-medium uppercase tracking-widest hover:scale-105 transition-transform"
                style={{ backgroundColor: T.accent, color: T.bg2 }}
              >
                CREAR CUENTA
              </button>
              <button
                onClick={() => goTo(1)}
                className="w-full sm:w-auto border px-8 py-3 text-[11px] font-medium uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                style={{ borderColor: T.textMain, color: T.textMain }}
              >
                ¿Qué es TownHall?
              </button>
            </div>
          </div>
          <div className="absolute bottom-8 left-6" aria-hidden>
            <span className="font-serif text-6xl" style={{ color: T.textSub, opacity: 0.15 }}>I</span>
          </div>
        </section>

        {/* ━━ SLIDE 2 — EL PROBLEMA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          data-slide
          className="relative flex items-center justify-center overflow-hidden px-6"
          style={{ scrollSnapAlign: "start", height: "100vh", backgroundColor: T.bg2 }}
        >
          <div className="container mx-auto z-10 grid grid-cols-12 gap-6 items-center h-full">
            {/* Texto */}
            <div className="col-span-12 lg:col-span-6 flex flex-col justify-center gap-6 mt-16 lg:mt-0">
              <span
                className="text-[10px] font-medium uppercase"
                style={{ color: T.accent, letterSpacing: "0.2em" }}
              >
                EL PROBLEMA
              </span>
              <h2
                className="font-serif font-bold leading-tight text-3xl md:text-5xl"
                style={{ color: T.textMain }}
              >
                Decidir en el caos no es democracia
              </h2>
              <p className="text-sm md:text-base" style={{ color: T.textSub }}>
                Grupos con cientos de mensajes sin leer. Votaciones difíciles de organizar. Bots que distorsionan el consenso. Las herramientas que usamos para organizarnos no fueron diseñadas para una democracia entre miles.
              </p>
            </div>
            {/* Burbujas caóticas */}
            <div className="col-span-12 lg:col-span-6 relative h-[380px] md:h-[560px] flex items-center justify-center overflow-hidden pointer-events-none">
              <div className="relative w-full h-full max-w-lg mx-auto">
                {CHAOS_WIDGETS.map((w, i) => (
                  <div
                    key={i}
                    className="chaos-widget absolute p-3 flex gap-3 items-center shadow-2xl border"
                    style={{
                      ...w.pos,
                      width: "min(160px, 42vw)",
                      backgroundColor: "#1a1c1b",
                      borderColor: T.border,
                      zIndex: w.z,
                      "--duration": w.dur,
                      "--delay": w.delay,
                    } as unknown as React.CSSProperties}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: w.color }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{w.icon}</span>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: T.border }} />
                      <div className="h-1.5 w-1/2 rounded" style={{ backgroundColor: T.border }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute bottom-8 left-6" aria-hidden>
            <span className="font-serif text-6xl" style={{ color: T.textSub, opacity: 0.15 }}>II</span>
          </div>
        </section>

        {/* ━━ SLIDE 3 — LA SOLUCIÓN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          data-slide
          className="relative flex flex-col justify-center items-center px-6 md:px-10 overflow-hidden"
          style={{ scrollSnapAlign: "start", height: "100vh", backgroundColor: T.bg2 }}
        >
          <div className="max-w-5xl w-full z-10">
            <div
              className="mb-8 md:mb-10 text-center md:text-left pl-4 md:pl-6 border-l-2"
              style={{ borderColor: T.accent }}
            >
              <span
                className="block text-[10px] font-medium uppercase mb-2"
                style={{ color: T.accent, letterSpacing: "0.2em" }}
              >
                LA SOLUCIÓN
              </span>
              <h2 className="font-serif font-bold text-2xl md:text-4xl" style={{ color: T.textMain }}>
                Un lugar seguro.{" "}
                <em className="font-normal">Decisiones legítimas.</em>
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {PILLARS.map((p) => (
                <div
                  key={p.num}
                  className="p-5 md:p-7 flex flex-col gap-4 border transition-colors"
                  style={{ backgroundColor: T.bg1, borderColor: T.border }}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-serif text-xl" style={{ color: T.accent }}>{p.num}</span>
                    <span className="material-symbols-outlined" style={{ color: T.accent, fontSize: 26 }}>{p.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-base md:text-lg mb-1.5" style={{ color: T.textMain }}>{p.title}</h3>
                    <p className="text-xs md:text-sm leading-relaxed" style={{ color: T.textSub }}>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-8 left-6" aria-hidden>
            <span className="font-serif text-6xl" style={{ color: T.textSub, opacity: 0.15 }}>III</span>
          </div>
        </section>

        {/* ━━ SLIDE 4 — CÓMO FUNCIONA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          data-slide
          className="relative flex flex-col items-center justify-center overflow-hidden px-6"
          style={{ scrollSnapAlign: "start", height: "100vh", backgroundColor: T.bg1 }}
        >
          <div className="text-center mb-10 z-10">
            <p
              className="text-[10px] font-medium uppercase mb-2"
              style={{ color: T.accent, letterSpacing: "0.2em" }}
            >
              CÓMO FUNCIONA
            </p>
            <h2 className="font-serif font-bold text-2xl md:text-4xl" style={{ color: T.textMain }}>
              Tres Pasos Para Entrar
            </h2>
          </div>

          <div className="relative w-full max-w-md z-10">
            {/* Línea vertical del timeline */}
            <div
              className="absolute left-5 top-6 bottom-6 w-px"
              style={{
                background: `linear-gradient(to bottom, transparent, ${T.border} 15%, ${T.border} 85%, transparent)`,
                opacity: 0.35,
              }}
            />
            <div className="flex flex-col gap-8 md:gap-10">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-5">
                  <div
                    className="shrink-0 w-10 h-10 rounded-full border flex items-center justify-center z-10 relative"
                    style={{ borderColor: T.accent, backgroundColor: T.bg2 }}
                  >
                    <span className="material-symbols-outlined" style={{ color: T.accent, fontSize: 16 }}>{step.icon}</span>
                  </div>
                  <div className="pt-1.5">
                    <h3 className="font-serif font-semibold text-base md:text-lg mb-1" style={{ color: T.textMain }}>
                      {step.title}
                    </h3>
                    <p className="text-xs md:text-sm leading-relaxed" style={{ color: T.textSub }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 z-10">
            <button
              onClick={() => router.push("/registro")}
              className="px-12 py-4 text-[11px] font-medium uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
              style={{ backgroundColor: T.accent, color: T.bg2 }}
            >
              CREAR CUENTA
            </button>
          </div>

          <div className="absolute bottom-8 left-6" aria-hidden>
            <span className="font-serif text-6xl" style={{ color: T.textSub, opacity: 0.15 }}>IV</span>
          </div>
        </section>

      </div>
    </>
  );
}