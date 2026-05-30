"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Estado = "cargando" | "valido" | "procesando" | "exito" | "usado" | "expirado" | "invalido" | "sin_sesion";

export default function Invitacion() {
  const { token } = useParams();
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [colectivoNombre, setColectivoNombre] = useState("");

  useEffect(() => {
    const verificar = async () => {
      // 1. Verificar que el token existe y es válido
      const { data: invitacion, error } = await supabase
        .from("invitaciones")
        .select("id, token, usado, expira_en, colectivo_id")
        .eq("token", token)
        .single();

      if (error || !invitacion) {
        setEstado("invalido");
        return;
      }

      if (invitacion.usado) {
        setEstado("usado");
        return;
      }

      if (new Date(invitacion.expira_en) < new Date()) {
        setEstado("expirado");
        return;
      }

      // 2. Obtener nombre del colectivo
      const { data: colectivo } = await supabase
        .from("colectivos")
        .select("nombre")
        .eq("id", invitacion.colectivo_id)
        .single();

      if (colectivo) setColectivoNombre(colectivo.nombre);

      // 3. Verificar si hay sesión activa
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setEstado("sin_sesion");
        return;
      }

      // 4. Hay sesión — procesar invitación
      await procesarInvitacion(session.user.id, invitacion.id, invitacion.colectivo_id);
    };

    verificar();
  }, [token]);

  const procesarInvitacion = async (
    authId: string,
    invitacionId: string,
    colectivoId: string
  ) => {
    setEstado("procesando");

    // Obtener usuario de la tabla usuarios
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (!usuario) {
      setEstado("invalido");
      return;
    }

    // Crear registro en validadores
    const { error: validadorError } = await supabase
      .from("validadores")
      .insert({
        usuario_id: usuario.id,
        auth_id: authId,
        colectivo_id: colectivoId,
        tier: 1,
        activo: true,
        invitacion_id: invitacionId,
      });

    if (validadorError) {
      setEstado("invalido");
      return;
    }

    // Marcar invitación como usada
    await supabase
      .from("invitaciones")
      .update({ usado: true, usado_por: usuario.id })
      .eq("id", invitacionId);

    setEstado("exito");
  };

  // PANTALLAS
  if (estado === "cargando" || estado === "procesando") {
    return (
      <Pantalla>
        <p className="text-[#6b6356] text-sm">
          {estado === "cargando" ? "Verificando invitación..." : "Procesando..."}
        </p>
      </Pantalla>
    );
  }

  if (estado === "exito") {
    return (
      <Pantalla>
        <div className="bg-white border border-black/10 rounded-xl p-8 w-full max-w-sm text-center flex flex-col gap-4">
          <div className="w-14 h-14 bg-[#c04a1e]/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-[#c04a1e] text-2xl">✓</span>
          </div>
          <h2 className="font-serif text-[#1a1208] text-2xl font-bold">
            Ya eres validador
          </h2>
          <p className="text-[#6b6356] text-sm leading-relaxed">
            Ahora tienes permisos de validador en{" "}
            <strong className="text-[#1a1208]">{colectivoNombre}</strong>.
            Puedes comenzar a validar nuevos ciudadanos.
          </p>
          <Link
            href="/validador"
            className="block bg-[#c04a1e] text-white text-sm font-medium tracking-widest uppercase py-3.5 rounded"
          >
            Ir a mi panel →
          </Link>
        </div>
      </Pantalla>
    );
  }

  if (estado === "sin_sesion") {
    return (
      <Pantalla>
        <div className="bg-white border border-black/10 rounded-xl p-8 w-full max-w-sm text-center flex flex-col gap-4">
          <h2 className="font-serif text-[#1a1208] text-2xl font-bold">
            Invitación válida
          </h2>
          {colectivoNombre && (
            <p className="text-[#6b6356] text-sm leading-relaxed">
              Has sido invitado a ser validador de{" "}
              <strong className="text-[#1a1208]">{colectivoNombre}</strong>.
            </p>
          )}
          <p className="text-[#6b6356] text-sm">
            Para continuar, inicia sesión o crea una cuenta.
          </p>
          <Link
            href={`/login?redirect=/invitacion/${token}`}
            className="block bg-[#c04a1e] text-white text-sm font-medium tracking-widest uppercase py-3.5 rounded"
          >
            Iniciar sesión →
          </Link>
          <Link
            href={`/registro?redirect=/invitacion/${token}`}
            className="block border border-black/15 text-[#1a1208] text-sm font-medium tracking-widest uppercase py-3.5 rounded"
          >
            Crear cuenta →
          </Link>
        </div>
      </Pantalla>
    );
  }

  if (estado === "usado") {
    return (
      <Pantalla>
        <Mensaje
          titulo="Invitación ya utilizada"
          texto="Este link ya fue usado. Cada invitación es de un solo uso."
        />
      </Pantalla>
    );
  }

  if (estado === "expirado") {
    return (
      <Pantalla>
        <Mensaje
          titulo="Invitación expirada"
          texto="Este link ya no es válido. Solicita una nueva invitación."
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <Mensaje
        titulo="Invitación inválida"
        texto="Este link no existe o no es válido."
      />
    </Pantalla>
  );
}

// Componentes auxiliares
function Pantalla({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f2eb] flex flex-col">
      <div className="h-13 bg-[#f7f2eb]/90 backdrop-blur-sm border-b border-black/10 flex items-center px-5 sticky top-0 z-50">
        <Link href="/" className="font-serif text-base font-bold tracking-wide text-[#1a1208]">
          TownHall
        </Link>
      </div>
      <div className="flex flex-col items-center justify-center flex-1 px-5 py-10">
        {children}
      </div>
    </div>
  );
}

function Mensaje({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="bg-white border border-black/10 rounded-xl p-8 w-full max-w-sm text-center flex flex-col gap-3">
      <h2 className="font-serif text-[#1a1208] text-2xl font-bold">{titulo}</h2>
      <p className="text-[#6b6356] text-sm leading-relaxed">{texto}</p>
      <Link href="/" className="text-[#c04a1e] text-sm font-medium mt-2">
        Volver al inicio →
      </Link>
    </div>
  );
}