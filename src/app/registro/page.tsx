"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

const PAISES = [
  { codigo: "MX", nombre: "🇲🇽 México" },
  { codigo: "US", nombre: "🇺🇸 Estados Unidos" },
  { codigo: "ES", nombre: "🇪🇸 España" },
  { codigo: "AR", nombre: "🇦🇷 Argentina" },
  { codigo: "CO", nombre: "🇨🇴 Colombia" },
  { codigo: "BR", nombre: "🇧🇷 Brasil" },
  { codigo: "DE", nombre: "🇩🇪 Alemania" },
  { codigo: "FR", nombre: "🇫🇷 Francia" },
  { codigo: "GB", nombre: "🇬🇧 Reino Unido" },
  { codigo: "JP", nombre: "🇯🇵 Japón" },
  { codigo: "KR", nombre: "🇰🇷 Corea del Sur" },
  { codigo: "NG", nombre: "🇳🇬 Nigeria" },
  { codigo: "ZA", nombre: "🇿🇦 Sudáfrica" },
  { codigo: "IN", nombre: "🇮🇳 India" },
  { codigo: "OTRO", nombre: "🌐 Otro" },
];

type Estado = "idle" | "cargando" | "exito" | "error";

export default function Registro() {
  const [form, setForm] = useState({
    nombre: "",
    fecha_nacimiento: "",
    pais: "",
    ciudad: "",
    email: "",
    password: "",
  });
  const [estado, setEstado] = useState<Estado>("idle");
  const [mensajeError, setMensajeError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("cargando");
    setMensajeError("");

    try {
      // 1. Crear cuenta en Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });

      if (authError) throw authError;

      // 2. Guardar datos del usuario en la tabla usuarios
      const { error: dbError } = await supabase.from("usuarios").insert({
        auth_id: authData.user?.id,
        nombre_completo: form.nombre,
        fecha_nacimiento: form.fecha_nacimiento,
        email: form.email,
        pais: form.pais,
        ciudad: form.ciudad,
        estado: "pendiente",
      });

      if (dbError) throw dbError;

      setEstado("exito");
    } catch (error: unknown) {
      setEstado("error");
      if (error instanceof Error) {
        setMensajeError(error.message);
      } else {
        setMensajeError("Ocurrió un error inesperado.");
      }
    }
  };

  // PANTALLA DE ÉXITO
  if (estado === "exito") {
    return (
      <div className="min-h-screen bg-[#f7f2eb] flex flex-col items-center justify-center px-5">
        <div className="bg-white border border-black/10 rounded-xl p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-[#c04a1e]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-[#c04a1e] text-2xl">✓</span>
          </div>
          <h2 className="font-serif text-[#1a1208] text-2xl font-bold mb-3">
            Cuenta creada
          </h2>
          <p className="text-[#6b6356] text-sm leading-relaxed mb-6">
            Revisa tu correo electrónico para confirmar tu cuenta. Después
            podrás ver los puntos de validación disponibles.
          </p>
          <Link
            href="/pendiente"
            className="block bg-[#c04a1e] text-white text-sm font-medium tracking-widest uppercase py-3.5 rounded text-center"
          >
            Ver puntos de validación →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f2eb] flex flex-col">
      {/* TOP BAR */}
      <div className="h-13 bg-[#f7f2eb]/90 backdrop-blur-sm border-b border-black/10 flex items-center justify-between px-5 sticky top-0 z-50">
        <Link
          href="/"
          className="font-serif text-base font-bold tracking-wide text-[#1a1208]"
        >
          TownHall
        </Link>
        <Link
          href="/login"
          className="text-xs font-medium tracking-widest uppercase text-[#6b6356]"
        >
          Iniciar sesión
        </Link>
      </div>

      {/* CONTENIDO */}
      <div className="flex flex-col items-center px-5 py-10">
        <p className="text-[#c04a1e] text-[10px] tracking-[0.3em] uppercase mb-3">
          Únete a TownHall
        </p>
        <h1 className="font-serif text-[#1a1208] text-3xl font-bold text-center mb-8">
          Crea tu cuenta
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-black/10 rounded-xl p-6 w-full max-w-sm flex flex-col gap-4"
        >
          <p className="text-[10px] tracking-[0.1em] uppercase text-[#6b6356]">
            Tu identidad
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium tracking-widest uppercase text-[#6b6356]">
              Nombre completo
            </label>
            <input
              name="nombre"
              type="text"
              placeholder="Como aparece en tu identificación oficial"
              value={form.nombre}
              onChange={handleChange}
              required
              className="bg-[#f7f2eb] border border-black/15 rounded text-sm text-[#1a1208] px-3 py-2.5 outline-none focus:border-[#c04a1e] placeholder:text-[#6b6356]/50"
            />
            <p className="text-[11px] text-[#6b6356] mt-0.5">
              Tu validador confirmará este dato en persona.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium tracking-widest uppercase text-[#6b6356]">
              Fecha de nacimiento
            </label>
            <input
              name="fecha_nacimiento"
              type="date"
              value={form.fecha_nacimiento}
              onChange={handleChange}
              required
              className="bg-[#f7f2eb] border border-black/15 rounded text-sm text-[#1a1208] px-3 py-2.5 outline-none focus:border-[#c04a1e]"
            />
          </div>

          <hr className="border-black/8" />

          <p className="text-[10px] tracking-[0.1em] uppercase text-[#6b6356]">
            Tu ubicación
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium tracking-widest uppercase text-[#6b6356]">
                País
              </label>
              <select
                name="pais"
                value={form.pais}
                onChange={handleChange}
                required
                className="bg-[#f7f2eb] border border-black/15 rounded text-sm text-[#1a1208] px-3 py-2.5 outline-none focus:border-[#c04a1e]"
              >
                <option value="" disabled>
                  — Selecciona —
                </option>
                {PAISES.map((p) => (
                  <option key={p.codigo} value={p.codigo}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium tracking-widest uppercase text-[#6b6356]">
                Ciudad
              </label>
              <input
                name="ciudad"
                type="text"
                placeholder="Tu ciudad"
                value={form.ciudad}
                onChange={handleChange}
                required
                className="bg-[#f7f2eb] border border-black/15 rounded text-sm text-[#1a1208] px-3 py-2.5 outline-none focus:border-[#c04a1e] placeholder:text-[#6b6356]/50"
              />
            </div>
          </div>

          <p className="text-[11px] text-[#6b6356] -mt-2">
            Tu validador confirmará tu domicilio en persona.
          </p>

          <hr className="border-black/8" />

          <p className="text-[10px] tracking-[0.1em] uppercase text-[#6b6356]">
            Tu acceso
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium tracking-widest uppercase text-[#6b6356]">
              Correo electrónico
            </label>
            <input
              name="email"
              type="email"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={handleChange}
              required
              className="bg-[#f7f2eb] border border-black/15 rounded text-sm text-[#1a1208] px-3 py-2.5 outline-none focus:border-[#c04a1e] placeholder:text-[#6b6356]/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium tracking-widest uppercase text-[#6b6356]">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              className="bg-[#f7f2eb] border border-black/15 rounded text-sm text-[#1a1208] px-3 py-2.5 outline-none focus:border-[#c04a1e] placeholder:text-[#6b6356]/50"
            />
          </div>

          {/* ERROR */}
          {estado === "error" && (
            <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
              <p className="text-red-600 text-xs">{mensajeError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={estado === "cargando"}
            className="bg-[#c04a1e] text-white text-sm font-medium tracking-widest uppercase py-3.5 rounded mt-2 disabled:opacity-50"
          >
            {estado === "cargando" ? "Creando cuenta..." : "Solicitar acceso →"}
          </button>

          <p className="text-[12px] text-[#6b6356] text-center">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-[#c04a1e] font-medium">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}