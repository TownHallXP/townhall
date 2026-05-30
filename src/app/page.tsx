"use client";

import { useState } from "react";

const SLIDES = [
  {
    id: "hero",
    bg: "bg-[#1a1208]",
    content: (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="text-[#d4930a] text-[11px] tracking-[0.35em] uppercase mb-10 font-light">
          Plataforma de Democracia Cívica
        </p>
        <h1 className="font-serif text-white text-7xl font-black leading-[0.9] tracking-tight mb-2">
          Town
        </h1>
        <h1 className="font-serif text-[#c04a1e] text-7xl font-black leading-[0.9] tracking-tight mb-6">
          Hall
        </h1>
        <p className="text-white/60 text-[15px] font-light leading-relaxed max-w-[280px] mb-12">
          La plaza pública digital para ciudadanos verificados de cualquier ciudad del mundo.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          <button
            className="bg-[#c04a1e] text-white text-sm font-medium tracking-widest uppercase py-4 rounded-[4px] w-full"
            onClick={() => {}}
          >
            Crear cuenta
          </button>
          <button
            className="bg-transparent text-white/70 text-sm border border-white/25 py-4 rounded-[4px] w-full"
            onClick={() => {}}
          >
            ¿Qué es TownHall?
          </button>
        </div>
      </div>
    ),
  },
  {
    id: "problema",
    bg: "bg-[#f7f2eb]",
    content: (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="text-[#c04a1e] text-[10px] tracking-[0.3em] uppercase mb-6">
          El problema
        </p>
        <h2 className="font-serif text-[#1a1208] text-4xl font-bold leading-tight max-w-[300px] mb-8">
          Tu colectivo vive en el caos
        </h2>
        <div className="grid grid-cols-2 gap-2 w-full max-w-[320px] mb-6">
          {[
            { color: "bg-[#25D366]", label: "WhatsApp" },
            { color: "bg-[#2AABEE]", label: "Telegram" },
            { color: "bg-[#E1306C]", label: "Instagram" },
            { color: "bg-[#5865F2]", label: "Discourse" },
          ].map((app) => (
            <div
              key={app.label}
              className="bg-white border border-black/10 rounded-full py-2 px-3 flex items-center justify-center gap-2 text-[12px] text-[#6b6356]"
            >
              <span className={`w-2 h-2 rounded-full ${app.color}`} />
              {app.label}
            </div>
          ))}
        </div>
        <p className="text-[#6b6356] text-[13px] leading-relaxed max-w-[260px] border-t border-black/10 pt-5">
          Cientos de mensajes sin leer. Votaciones informales. Decisiones que
          nadie recuerda haber tomado.{" "}
          <strong className="text-[#1a1208] font-medium">
            Ninguna plataforma da legitimidad real.
          </strong>
        </p>
      </div>
    ),
  },
  {
    id: "solucion",
    bg: "bg-[#1a1208]",
    content: (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="text-[#d4930a] text-[10px] tracking-[0.3em] uppercase mb-6">
          La solución
        </p>
        <h2 className="font-serif text-white text-4xl font-bold leading-tight mb-8">
          Un solo lugar.<br />Identidad real.<br />Decisiones que cuentan.
        </h2>
        <div className="w-full max-w-[320px] border border-white/10 rounded-lg overflow-hidden">
          {[
            { num: "I", title: "Identidad verificada", desc: "Solo ciudadanos reales, validados en persona." },
            { num: "II", title: "Foro deliberativo", desc: "Debates con historial público e inmutable." },
            { num: "III", title: "Votaciones legítimas", desc: "Elecciones con rondas y resultados transparentes." },
            { num: "IV", title: "Federación controlada", desc: "Otras ciudades pueden unirse con aprobación explícita." },
          ].map((pillar, i) => (
            <div
              key={pillar.num}
              className={`flex gap-3 items-start p-4 ${i < 3 ? "border-b border-white/10" : ""} bg-white/[0.04]`}
            >
              <span className="font-serif text-[#c04a1e] text-xl font-black w-6 shrink-0">
                {pillar.num}
              </span>
              <div className="text-left">
                <p className="text-white text-[13px] font-medium mb-0.5">{pillar.title}</p>
                <p className="text-white/45 text-[11px] leading-relaxed">{pillar.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "como",
    bg: "bg-[#c04a1e]",
    content: (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="text-white/60 text-[10px] tracking-[0.3em] uppercase mb-6">
          Cómo funciona
        </p>
        <h2 className="font-serif text-white text-4xl font-bold leading-tight mb-10">
          Tres pasos para entrar
        </h2>
        <div className="w-full max-w-[300px] flex flex-col gap-0">
          {[
            { n: "1", title: "Crea tu cuenta", desc: "Regístrala con tu nombre, correo y ubicación. Sin acceso al foro todavía." },
            { n: "2", title: "Valídate en persona", desc: "Acude con tu identificación oficial y comprobante de domicilio a un punto de validación." },
            { n: "3", title: "Participa", desc: "Accede al foro, debate y vota. Tu nombre real, tu voz real." },
          ].map((step, i) => (
            <div key={step.n} className="flex gap-4 items-start pb-5 relative">
              {i < 2 && (
                <div className="absolute left-[17px] top-9 bottom-0 w-px bg-white/25" />
              )}
              <div className="w-9 h-9 rounded-full border border-white/30 bg-white/15 flex items-center justify-center shrink-0 font-serif text-white font-bold text-sm">
                {step.n}
              </div>
              <div className="text-left pt-1">
                <p className="text-white text-sm font-medium mb-0.5">{step.title}</p>
                <p className="text-white/60 text-xs leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function Home() {
  const [current, setCurrent] = useState(0);

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* TOP BAR */}
      <div
        className={`fixed top-0 left-0 right-0 h-13 flex items-center justify-between px-5 z-50 transition-colors duration-300 ${
          current % 2 === 0
            ? "bg-[#1a1208]/85 backdrop-blur-sm"
            : current === 3
            ? "bg-[#c04a1e]/85 backdrop-blur-sm"
            : "bg-[#f7f2eb]/90 backdrop-blur-sm"
        }`}
      >
        <span
          className={`font-serif text-base font-bold tracking-wide ${
            current === 1 ? "text-[#1a1208]" : "text-white"
          }`}
        >
          TownHall
        </span>
        <button
          className={`text-xs font-medium tracking-widest uppercase px-3 py-1.5 ${
            current === 1 ? "text-[#6b6356]" : "text-white/70"
          }`}
          onClick={() => setCurrent(3)}
        >
          Iniciar sesión
        </button>
      </div>

      {/* SLIDES */}
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {SLIDES.map((slide) => (
          <div
            key={slide.id}
            className={`min-w-full h-full ${slide.bg} flex items-center justify-center pt-13`}
          >
            {slide.content}
          </div>
        ))}
      </div>

      {/* DOT NAVIGATION */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              i === current
                ? current === 1
                  ? "bg-[#c04a1e] scale-150"
                  : "bg-white scale-150"
                : current === 1
                ? "bg-[#1a1208]/20"
                : "bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* BOTTOM SWIPE HINT — only on first slide */}
      {current === 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-50">
          <span className="text-white/30 text-[10px] tracking-[0.2em] uppercase">
            Explorar
          </span>
          <div className="w-px h-7 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
        </div>
      )}
    </div>
  );
}