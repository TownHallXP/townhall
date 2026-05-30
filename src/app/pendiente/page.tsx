"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type Colectivo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  logo_url: string | null;
  direccion: string | null;
  whatsapp_url: string | null;
  instagram_url: string | null;
  email_contacto: string | null;
  horario: string | null;
};

export default function Pendiente() {
  const [colectivos, setColectivos] = useState<Colectivo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchColectivos = async () => {
      const { data, error } = await supabase
        .from("colectivos")
        .select("id, nombre, descripcion, logo_url, direccion, whatsapp_url, instagram_url, email_contacto, horario")
        .eq("activo", true)
        .order("nombre");

      if (!error && data) setColectivos(data);
      setCargando(false);
    };

    fetchColectivos();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f2eb] flex flex-col">

      {/* TOP BAR */}
      <div className="h-13 bg-[#f7f2eb]/90 backdrop-blur-sm border-b border-black/10 flex items-center px-5 sticky top-0 z-50">
        <Link href="/" className="font-serif text-base font-bold tracking-wide text-[#1a1208]">
          TownHall
        </Link>
      </div>

      <div className="flex flex-col items-center px-5 py-10 gap-8 max-w-lg mx-auto w-full">

        {/* BARRA DE PROGRESO */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            {/* Paso 1 */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-[#c04a1e] flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-[10px] tracking-widest uppercase text-[#c04a1e] font-medium">Cuenta creada</span>
            </div>

            {/* Línea */}
            <div className="flex-1 h-px bg-[#d4930a] mx-2 mb-4" />

            {/* Paso 2 */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-[#d4930a] flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <span className="text-[10px] tracking-widest uppercase text-[#d4930a] font-medium">Validación</span>
            </div>

            {/* Línea */}
            <div className="flex-1 h-px bg-black/15 mx-2 mb-4" />

            {/* Paso 3 */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center">
                <span className="text-[#6b6356] text-xs font-bold">3</span>
              </div>
              <span className="text-[10px] tracking-widest uppercase text-[#6b6356]">Acceso al foro</span>
            </div>
          </div>
        </div>

        {/* TEXTO INTRODUCTORIO */}
        <div className="w-full bg-white border border-black/10 rounded-xl p-6">
          <h1 className="font-serif text-[#1a1208] text-2xl font-bold mb-2">
            Tu cuenta está en revisión
          </h1>
          <p className="text-[#6b6356] text-sm leading-relaxed mb-4">
            Para completar tu registro, acude en persona a uno de los colectivos de validación. Lleva tu <strong className="text-[#1a1208]">INE</strong> y un <strong className="text-[#1a1208]">comprobante de domicilio</strong>.
          </p>
          <p className="text-[#6b6356] text-sm leading-relaxed">
            Un validador confirmará tu identidad y te dará acceso al foro.
          </p>
        </div>

        {/* LISTA DE COLECTIVOS */}
        <div className="w-full flex flex-col gap-4">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#c04a1e]">
            Puntos de validación
          </p>

          {cargando && (
            <p className="text-sm text-[#6b6356]">Cargando colectivos...</p>
          )}

          {!cargando && colectivos.length === 0 && (
            <p className="text-sm text-[#6b6356]">No hay colectivos activos por el momento.</p>
          )}

          {colectivos.map((c) => (
            <div key={c.id} className="bg-white border border-black/10 rounded-xl p-5 flex flex-col gap-3">

              {/* Header */}
              <div className="flex items-center gap-3">
                {c.logo_url ? (
                  <img src={c.logo_url} alt={c.nombre} className="w-10 h-10 rounded-full object-cover border border-black/10" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#c04a1e]/10 flex items-center justify-center">
                    <span className="text-[#c04a1e] text-base font-serif font-bold">{c.nombre[0]}</span>
                  </div>
                )}
                <div>
                  <p className="font-serif font-bold text-[#1a1208] text-base">{c.nombre}</p>
                  {c.descripcion && (
                    <p className="text-[#6b6356] text-xs leading-snug">{c.descripcion}</p>
                  )}
                </div>
              </div>

              {/* Dirección y horario */}
              <div className="flex flex-col gap-1 text-sm text-[#6b6356]">
                {c.direccion && (
                  <p>📍 {c.direccion}</p>
                )}
                {c.horario && (
                  <p>🕐 {c.horario}</p>
                )}
              </div>

              {/* Links */}
              <div className="flex gap-2 flex-wrap">
                {c.whatsapp_url && (
                  <a href={c.whatsapp_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-medium tracking-widest uppercase bg-[#c04a1e]/10 text-[#c04a1e] px-3 py-1.5 rounded">
                    WhatsApp
                  </a>
                )}
                {c.instagram_url && (
                  <a href={c.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-medium tracking-widest uppercase bg-black/5 text-[#1a1208] px-3 py-1.5 rounded">
                    Instagram
                  </a>
                )}
                {c.email_contacto && (
                  <a href={`mailto:${c.email_contacto}`}
                    className="text-[11px] font-medium tracking-widest uppercase bg-black/5 text-[#1a1208] px-3 py-1.5 rounded">
                    Email
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* NOTA DE SEGURIDAD */}
        <div className="w-full border border-black/10 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-[#d4930a] text-base mt-0.5">🔒</span>
          <p className="text-[11px] text-[#6b6356] leading-relaxed">
            Tu información personal está protegida. Los validadores solo confirman tu identidad — nunca comparten tus datos con terceros.
          </p>
        </div>

      </div>
    </div>
  );
}