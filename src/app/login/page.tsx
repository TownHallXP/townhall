"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

type Estado = "idle" | "cargando" | "error";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [form, setForm] = useState({ email: "", password: "" });
  const [estado, setEstado] = useState<Estado>("idle");
  const [mensajeError, setMensajeError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("cargando");
    setMensajeError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) throw error;

      const { data: validador } = await supabase
        .from("validadores")
        .select("id")
        .eq("auth_id", data.user.id)
        .single();

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("estado")
        .eq("auth_id", data.user.id)
        .single();

      if (redirect) {
        router.push(redirect);
      } else if (validador) {
        router.push("/foro");
      } else if (usuario?.estado === "aprobado") {
        router.push("/foro");
      } else {
        router.push("/pendiente");
      }
    } catch (error: unknown) {
      setEstado("error");
      if (error instanceof Error) {
        setMensajeError(error.message);
      } else {
        setMensajeError("Ocurrió un error inesperado.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center px-5 py-10">
      <p className="text-[#c04a1e] text-[10px] tracking-[0.3em] uppercase mb-3">
        Bienvenido de vuelta
      </p>
      <h1 className="font-serif text-[#1a1208] text-3xl font-bold text-center mb-8">
        Inicia sesión
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-black/10 rounded-xl p-6 w-full max-w-sm flex flex-col gap-4"
      >
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
            placeholder="Tu contraseña"
            value={form.password}
            onChange={handleChange}
            required
            className="bg-[#f7f2eb] border border-black/15 rounded text-sm text-[#1a1208] px-3 py-2.5 outline-none focus:border-[#c04a1e] placeholder:text-[#6b6356]/50"
          />
        </div>

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
          {estado === "cargando" ? "Entrando..." : "Entrar →"}
        </button>

        <p className="text-[12px] text-[#6b6356] text-center">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-[#c04a1e] font-medium">
            Crear cuenta
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function Login() {
  return (
    <div className="min-h-screen bg-[#f7f2eb] flex flex-col">
      <div className="h-13 bg-[#f7f2eb]/90 backdrop-blur-sm border-b border-black/10 flex items-center justify-between px-5 sticky top-0 z-50">
        <Link href="/" className="font-serif text-base font-bold tracking-wide text-[#1a1208]">
          TownHall
        </Link>
      </div>
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-[#6b6356] text-sm">Cargando...</p></div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}