"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const SUPERADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;

type Colectivo = {
  id: string;
  nombre: string;
  activo: boolean;
  creado_en: string;
};

type Invitacion = {
  id: string;
  token: string;
  usado: boolean;
  expira_en: string;
  creado_en: string;
  colectivo_id: string;
  colectivo?: { nombre: string };
};

export default function SupAdmin() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [seccion, setSeccion] = useState<"colectivos" | "invitaciones">("colectivos");

  // Colectivos
  const [colectivos, setColectivos] = useState<Colectivo[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [creandoColectivo, setCreandoColectivo] = useState(false);
  const [errorColectivo, setErrorColectivo] = useState("");

  // Invitaciones
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [colectivoSeleccionado, setColectivoSeleccionado] = useState("");
  const [creandoInvitacion, setCreandoInvitacion] = useState(false);
  const [linkGenerado, setLinkGenerado] = useState("");

  useEffect(() => {
    const verificar = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || session.user.email !== SUPERADMIN_EMAIL) {
        router.push("/");
        return;
      }

      setAutorizado(true);
      await Promise.all([fetchColectivos(), fetchInvitaciones()]);
      setCargando(false);
    };

    verificar();
  }, []);

  const fetchColectivos = async () => {
    const { data } = await supabase
      .from("colectivos")
      .select("id, nombre, activo, creado_en")
      .order("creado_en", { ascending: false });
    if (data) setColectivos(data);
  };

  const fetchInvitaciones = async () => {
    const { data } = await supabase
      .from("invitaciones")
      .select("id, token, usado, expira_en, creado_en, colectivo_id")
      .order("creado_en", { ascending: false });
    if (data) {
      // Enriquecer con nombre de colectivo
      const enriquecidas = await Promise.all(
        data.map(async (inv) => {
          const { data: col } = await supabase
            .from("colectivos")
            .select("nombre")
            .eq("id", inv.colectivo_id)
            .single();
          return { ...inv, colectivo: col ?? { nombre: "—" } };
        })
      );
      setInvitaciones(enriquecidas);
    }
  };

  const crearColectivo = async () => {
    if (!nuevoNombre.trim()) return;
    setCreandoColectivo(true);
    setErrorColectivo("");

    const { error } = await supabase
      .from("colectivos")
      .insert({ nombre: nuevoNombre.trim(), activo: true });

    if (error) {
      setErrorColectivo(error.message);
    } else {
      setNuevoNombre("");
      await fetchColectivos();
    }
    setCreandoColectivo(false);
  };

  const crearInvitacion = async () => {
    if (!colectivoSeleccionado) return;
    setCreandoInvitacion(true);
    setLinkGenerado("");

    const { data, error } = await supabase
      .from("invitaciones")
      .insert({ colectivo_id: colectivoSeleccionado })
      .select()
      .single();

    if (!error && data) {
      const link = `${window.location.origin}/invitacion/${data.token}`;
      setLinkGenerado(link);
      await fetchInvitaciones();
    }
    setCreandoInvitacion(false);
  };

  const eliminarInvitacion = async (id: string) => {
    await supabase.from("invitaciones").delete().eq("id", id);
    await fetchInvitaciones();
  };

  const copiarLink = (link: string) => {
    navigator.clipboard.writeText(link);
  };

  const estadoInvitacion = (inv: Invitacion) => {
    if (inv.usado) return { label: "Usado", color: "bg-black/10 text-[#6b6356]" };
    if (new Date(inv.expira_en) < new Date()) return { label: "Expirado", color: "bg-red-100 text-red-600" };
    return { label: "Activo", color: "bg-green-100 text-green-700" };
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#f7f2eb] flex items-center justify-center">
        <p className="text-[#6b6356] text-sm">Verificando acceso...</p>
      </div>
    );
  }

  if (!autorizado) return null;

  return (
    <div className="min-h-screen bg-[#f7f2eb] flex flex-col">

      {/* TOP BAR */}
      <div className="h-13 bg-[#f7f2eb]/90 backdrop-blur-sm border-b border-black/10 flex items-center justify-between px-5 sticky top-0 z-50">
        <Link href="/" className="font-serif text-base font-bold tracking-wide text-[#1a1208]">
          TownHall
        </Link>
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#c04a1e]">
          SuperAdmin
        </span>
      </div>

      <div className="flex flex-col max-w-2xl mx-auto w-full px-5 py-10 gap-8">

        <div>
          <p className="text-[#c04a1e] text-[10px] tracking-[0.3em] uppercase mb-1">Panel de control</p>
          <h1 className="font-serif text-[#1a1208] text-3xl font-bold">Administración</h1>
        </div>

        {/* TABS */}
        <div className="flex gap-2 border-b border-black/10">
          {(["colectivos", "invitaciones"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSeccion(tab)}
              className={`text-[11px] tracking-widest uppercase font-medium pb-3 px-1 border-b-2 transition-colors ${
                seccion === tab
                  ? "border-[#c04a1e] text-[#c04a1e]"
                  : "border-transparent text-[#6b6356]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SECCIÓN COLECTIVOS */}
        {seccion === "colectivos" && (
          <div className="flex flex-col gap-6">

            {/* Crear colectivo */}
            <div className="bg-white border border-black/10 rounded-xl p-5 flex flex-col gap-3">
              <p className="text-[10px] tracking-widest uppercase text-[#6b6356] font-medium">Nuevo colectivo</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre del colectivo"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && crearColectivo()}
                  className="flex-1 bg-[#f7f2eb] border border-black/15 rounded text-sm text-[#1a1208] px-3 py-2.5 outline-none focus:border-[#c04a1e] placeholder:text-[#6b6356]/50"
                />
                <button
                  onClick={crearColectivo}
                  disabled={creandoColectivo || !nuevoNombre.trim()}
                  className="bg-[#c04a1e] text-white text-xs font-medium tracking-widest uppercase px-4 py-2.5 rounded disabled:opacity-50"
                >
                  {creandoColectivo ? "..." : "Crear"}
                </button>
              </div>
              {errorColectivo && (
                <p className="text-red-600 text-xs">{errorColectivo}</p>
              )}
            </div>

            {/* Lista de colectivos */}
            <div className="flex flex-col gap-2">
              {colectivos.length === 0 && (
                <p className="text-sm text-[#6b6356]">No hay colectivos todavía.</p>
              )}
              {colectivos.map((c) => (
                <div key={c.id} className="bg-white border border-black/10 rounded-xl px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-serif font-bold text-[#1a1208]">{c.nombre}</p>
                    <p className="text-[11px] text-[#6b6356] mt-0.5">
                      Creado {new Date(c.creado_en).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  <span className={`text-[10px] tracking-widest uppercase font-medium px-2.5 py-1 rounded ${c.activo ? "bg-green-100 text-green-700" : "bg-black/10 text-[#6b6356]"}`}>
                    {c.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN INVITACIONES */}
        {seccion === "invitaciones" && (
          <div className="flex flex-col gap-6">

            {/* Generar invitación */}
            <div className="bg-white border border-black/10 rounded-xl p-5 flex flex-col gap-3">
              <p className="text-[10px] tracking-widest uppercase text-[#6b6356] font-medium">Nueva invitación</p>
              <select
                value={colectivoSeleccionado}
                onChange={(e) => setColectivoSeleccionado(e.target.value)}
                className="bg-[#f7f2eb] border border-black/15 rounded text-sm text-[#1a1208] px-3 py-2.5 outline-none focus:border-[#c04a1e]"
              >
                <option value="" disabled>— Selecciona un colectivo —</option>
                {colectivos.filter(c => c.activo).map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <button
                onClick={crearInvitacion}
                disabled={creandoInvitacion || !colectivoSeleccionado}
                className="bg-[#c04a1e] text-white text-xs font-medium tracking-widest uppercase px-4 py-3 rounded disabled:opacity-50"
              >
                {creandoInvitacion ? "Generando..." : "Generar link →"}
              </button>

              {/* Link generado */}
              {linkGenerado && (
                <div className="bg-[#f7f2eb] border border-black/10 rounded p-3 flex flex-col gap-2">
                  <p className="text-[10px] tracking-widest uppercase text-[#6b6356]">Link generado</p>
                  <p className="text-xs text-[#1a1208] break-all font-mono">{linkGenerado}</p>
                  <button
                    onClick={() => copiarLink(linkGenerado)}
                    className="text-[11px] font-medium tracking-widest uppercase text-[#c04a1e] text-left"
                  >
                    Copiar →
                  </button>
                </div>
              )}
            </div>

            {/* Lista de invitaciones */}
            <div className="flex flex-col gap-2">
              {invitaciones.length === 0 && (
                <p className="text-sm text-[#6b6356]">No hay invitaciones todavía.</p>
              )}
              {invitaciones.map((inv) => {
                const estado = estadoInvitacion(inv);
                const link = `${typeof window !== "undefined" ? window.location.origin : ""}/invitacion/${inv.token}`;
                return (
                  <div key={inv.id} className="bg-white border border-black/10 rounded-xl px-5 py-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#1a1208]">{inv.colectivo?.nombre}</p>
                      <span className={`text-[10px] tracking-widest uppercase font-medium px-2.5 py-1 rounded ${estado.color}`}>
                        {estado.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6b6356] font-mono break-all">{link}</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => copiarLink(link)}
                        className="text-[11px] font-medium tracking-widest uppercase text-[#c04a1e]"
                      >
                        Copiar
                      </button>
                      {!inv.usado && (
                        <button
                          onClick={() => eliminarInvitacion(inv.id)}
                          className="text-[11px] font-medium tracking-widest uppercase text-[#6b6356]"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-[#6b6356]">
                      Expira {new Date(inv.expira_en).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}