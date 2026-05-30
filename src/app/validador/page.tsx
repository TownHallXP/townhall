"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Tab = "pendientes" | "validadores" | "promociones";

type UsuarioPendiente = {
  id: string;
  nombre_completo: string;
  ciudad: string;
  pais: string;
  email: string;
  creado_en: string;
};

type Validador = {
  id: string;
  creado_en: string;
  usuario: {
    nombre_completo: string;
  };
  colectivo: {
    nombre: string;
  };
};

type Promocion = {
  id: string;
  estado: string;
  cierra_en: string;
  creado_en: string;
  nominado: {
    nombre_completo: string;
  };
  propuesto_por_usuario: {
    nombre_completo: string;
  };
  colectivo: {
    nombre: string;
  };
  votos?: VotoPromocion[];
};

type VotoPromocion = {
  id: string;
  validador_id: string;
  voto: boolean;
};

type ValidadorActual = {
  id: string;
  colectivo_id: string;
};

export default function Validador() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pendientes");
  const [cargando, setCargando] = useState(true);
  const [validadorActual, setValidadorActual] = useState<ValidadorActual | null>(null);

  // Datos
  const [pendientes, setPendientes] = useState<UsuarioPendiente[]>([]);
  const [validadores, setValidadores] = useState<Validador[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);

  // Panel de validación
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioPendiente | null>(null);
  const [fotoIne, setFotoIne] = useState<File | null>(null);
  const [fotoDomicilio, setFotoDomicilio] = useState<File | null>(null);
  const [fotoRostro, setFotoRostro] = useState<File | null>(null);
  const [formafisica, setFormaFisica] = useState(false);
  const [notas, setNotas] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState("");

  // Promociones
  const [mostrarFormPromocion, setMostrarFormPromocion] = useState(false);
  const [emailNominado, setEmailNominado] = useState("");
  const [creandoPromocion, setCreandoPromocion] = useState(false);
  const [errorPromocion, setErrorPromocion] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login?redirect=/validador");
        return;
      }

      const { data: validador } = await supabase
        .from("validadores")
        .select("id, colectivo_id")
        .eq("auth_id", session.user.id)
        .eq("activo", true)
        .single();

      if (!validador) {
        router.push("/pendiente");
        return;
      }

      setValidadorActual(validador);
      await Promise.all([
        fetchPendientes(),
        fetchValidadores(),
        fetchPromociones(),
      ]);
      setCargando(false);
    };

    init();
  }, []);

  const fetchPendientes = async () => {
    const { data } = await supabase
      .from("usuarios")
      .select("id, nombre_completo, ciudad, pais, email, creado_en")
      .eq("estado", "pendiente")
      .order("creado_en", { ascending: true });
    if (data) setPendientes(data);
  };

  const fetchValidadores = async () => {
    const { data } = await supabase
      .from("validadores")
      .select("id, creado_en, usuario_id, colectivo_id")
      .eq("activo", true)
      .order("creado_en", { ascending: false });

    if (!data) return;

    const enriquecidos = await Promise.all(
      data.map(async (v) => {
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("nombre_completo")
          .eq("id", v.usuario_id)
          .single();

        const { data: colectivo } = await supabase
          .from("colectivos")
          .select("nombre")
          .eq("id", v.colectivo_id)
          .single();

        return {
          ...v,
          usuario: usuario ?? { nombre_completo: "—" },
          colectivo: colectivo ?? { nombre: "—" },
        };
      })
    );

    setValidadores(enriquecidos);
  };

  const fetchPromociones = async () => {
    const { data } = await supabase
      .from("promociones_validador")
      .select("id, estado, cierra_en, creado_en, nominado_id, propuesto_por, colectivo_id")
      .eq("estado", "pendiente")
      .order("creado_en", { ascending: false });

    if (!data) return;

    const enriquecidas = await Promise.all(
      data.map(async (p) => {
        const { data: nominado } = await supabase
          .from("usuarios")
          .select("nombre_completo")
          .eq("id", p.nominado_id)
          .single();

        const { data: propuesto } = await supabase
          .from("validadores")
          .select("usuario_id")
          .eq("id", p.propuesto_por)
          .single();

        let propuesto_por_usuario = { nombre_completo: "—" };
        if (propuesto) {
          const { data: u } = await supabase
            .from("usuarios")
            .select("nombre_completo")
            .eq("id", propuesto.usuario_id)
            .single();
          if (u) propuesto_por_usuario = u;
        }

        const { data: colectivo } = await supabase
          .from("colectivos")
          .select("nombre")
          .eq("id", p.colectivo_id)
          .single();

        const { data: votos } = await supabase
          .from("votos_promocion")
          .select("id, validador_id, voto")
          .eq("promocion_id", p.id);

        return {
          ...p,
          nominado: nominado ?? { nombre_completo: "—" },
          propuesto_por_usuario,
          colectivo: colectivo ?? { nombre: "—" },
          votos: votos ?? [],
        };
      })
    );

    setPromociones(enriquecidas);
  };

  const subirFoto = async (file: File, nombre: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${nombre}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("validaciones")
      .upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from("validaciones").getPublicUrl(path);
    return data.publicUrl;
  };

  const aprobarUsuario = async () => {
    if (!usuarioSeleccionado || !validadorActual) return;
    if (!fotoIne || !fotoDomicilio || !fotoRostro) {
      setErrorValidacion("Debes subir las 3 fotos para aprobar.");
      return;
    }
    if (!formafisica) {
      setErrorValidacion("Debes confirmar que la forma física fue firmada.");
      return;
    }

    setProcesando(true);
    setErrorValidacion("");

    const [urlIne, urlDomicilio, urlRostro] = await Promise.all([
      subirFoto(fotoIne, "ine"),
      subirFoto(fotoDomicilio, "domicilio"),
      subirFoto(fotoRostro, "rostro"),
    ]);

    if (!urlIne || !urlDomicilio || !urlRostro) {
      setErrorValidacion("Error al subir las fotos. Intenta de nuevo.");
      setProcesando(false);
      return;
    }

    const { error: sesionError } = await supabase
      .from("sesiones_validacion")
      .insert({
        validador_id: validadorActual.id,
        usuario_id: usuarioSeleccionado.id,
        foto_ine_url: urlIne,
        foto_domicilio_url: urlDomicilio,
        foto_rostro_url: urlRostro,
        forma_fisica_firmada: formafisica,
        notas,
        resultado: "aprobado",
      });

    if (sesionError) {
      setErrorValidacion("Error al guardar la sesión.");
      setProcesando(false);
      return;
    }

    await supabase
      .from("usuarios")
      .update({ estado: "aprobado" })
      .eq("id", usuarioSeleccionado.id);

    setUsuarioSeleccionado(null);
    resetForm();
    await fetchPendientes();
    setProcesando(false);
  };

  const rechazarUsuario = async () => {
    if (!usuarioSeleccionado || !validadorActual) return;
    setProcesando(true);

    await supabase.from("sesiones_validacion").insert({
      validador_id: validadorActual.id,
      usuario_id: usuarioSeleccionado.id,
      notas,
      resultado: "rechazado",
    });

    await supabase
      .from("usuarios")
      .update({ estado: "rechazado" })
      .eq("id", usuarioSeleccionado.id);

    setUsuarioSeleccionado(null);
    resetForm();
    await fetchPendientes();
    setProcesando(false);
  };

  const resetForm = () => {
    setFotoIne(null);
    setFotoDomicilio(null);
    setFotoRostro(null);
    setFormaFisica(false);
    setNotas("");
    setErrorValidacion("");
  };

  const proponerValidador = async () => {
    if (!emailNominado.trim() || !validadorActual) return;
    setCreandoPromocion(true);
    setErrorPromocion("");

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("id")
      .eq("email", emailNominado.trim())
      .single();

    if (!usuario) {
      setErrorPromocion("No se encontró un usuario con ese email.");
      setCreandoPromocion(false);
      return;
    }

    const { error } = await supabase.from("promociones_validador").insert({
      nominado_id: usuario.id,
      propuesto_por: validadorActual.id,
      colectivo_id: validadorActual.colectivo_id,
    });

    if (error) {
      setErrorPromocion("Error al crear la propuesta.");
    } else {
      setEmailNominado("");
      setMostrarFormPromocion(false);
      await fetchPromociones();
    }
    setCreandoPromocion(false);
  };

  const votar = async (promocionId: string, voto: boolean) => {
    if (!validadorActual) return;

    const { data: yaVoto } = await supabase
      .from("votos_promocion")
      .select("id")
      .eq("promocion_id", promocionId)
      .eq("validador_id", validadorActual.id)
      .single();

    if (yaVoto) return;

    await supabase.from("votos_promocion").insert({
      promocion_id: promocionId,
      validador_id: validadorActual.id,
      voto,
    });

    await fetchPromociones();
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#f7f2eb] flex items-center justify-center">
        <p className="text-[#6b6356] text-sm">Cargando panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f2eb] flex flex-col">

      {/* TOP BAR */}
      <div className="h-13 bg-[#f7f2eb]/90 backdrop-blur-sm border-b border-black/10 flex items-center justify-between px-5 sticky top-0 z-50">
        <Link href="/" className="font-serif text-base font-bold tracking-wide text-[#1a1208]">
          TownHall
        </Link>
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#c04a1e]">
          Panel Validador
        </span>
      </div>

      <div className="flex flex-col max-w-2xl mx-auto w-full px-5 py-10 gap-8">

        <div>
          <p className="text-[#c04a1e] text-[10px] tracking-[0.3em] uppercase mb-1">Validador activo</p>
          <h1 className="font-serif text-[#1a1208] text-3xl font-bold">Panel de validación</h1>
        </div>

        {/* TABS */}
        <div className="flex gap-2 border-b border-black/10">
          {([
            { key: "pendientes", label: `Pendientes (${pendientes.length})` },
            { key: "validadores", label: `Validadores (${validadores.length})` },
            { key: "promociones", label: `Promociones (${promociones.length})` },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-[11px] tracking-widest uppercase font-medium pb-3 px-1 border-b-2 transition-colors ${
                tab === t.key
                  ? "border-[#c04a1e] text-[#c04a1e]"
                  : "border-transparent text-[#6b6356]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: PENDIENTES */}
        {tab === "pendientes" && !usuarioSeleccionado && (
          <div className="flex flex-col gap-3">
            {pendientes.length === 0 && (
              <p className="text-sm text-[#6b6356]">No hay ciudadanos pendientes.</p>
            )}
            {pendientes.map((u) => (
              <button
                key={u.id}
                onClick={() => setUsuarioSeleccionado(u)}
                className="bg-white border border-black/10 rounded-xl px-5 py-4 flex items-center justify-between text-left hover:border-[#c04a1e] transition-colors"
              >
                <div>
                  <p className="font-serif font-bold text-[#1a1208]">{u.nombre_completo}</p>
                  <p className="text-[11px] text-[#6b6356] mt-0.5">{u.ciudad}, {u.pais}</p>
                  <p className="text-[11px] text-[#6b6356]">
                    Registrado {new Date(u.creado_en).toLocaleDateString("es-MX")}
                  </p>
                </div>
                <span className="text-[#c04a1e] text-lg">→</span>
              </button>
            ))}
          </div>
        )}

        {/* PANEL DE VALIDACIÓN */}
        {tab === "pendientes" && usuarioSeleccionado && (
          <div className="flex flex-col gap-5">
            <button
              onClick={() => { setUsuarioSeleccionado(null); resetForm(); }}
              className="text-[11px] tracking-widest uppercase text-[#6b6356] text-left"
            >
              ← Volver a la lista
            </button>

            <div className="bg-white border border-black/10 rounded-xl p-5 flex flex-col gap-1">
              <p className="font-serif font-bold text-[#1a1208] text-lg">{usuarioSeleccionado.nombre_completo}</p>
              <p className="text-sm text-[#6b6356]">{usuarioSeleccionado.email}</p>
              <p className="text-sm text-[#6b6356]">{usuarioSeleccionado.ciudad}, {usuarioSeleccionado.pais}</p>
            </div>

            {/* Fotos */}
            <div className="bg-white border border-black/10 rounded-xl p-5 flex flex-col gap-4">
              <p className="text-[10px] tracking-widest uppercase text-[#6b6356] font-medium">Documentos</p>

              {[
                { label: "INE (frente y reverso)", setter: setFotoIne, file: fotoIne },
                { label: "Comprobante de domicilio", setter: setFotoDomicilio, file: fotoDomicilio },
                { label: "Foto del rostro", setter: setFotoRostro, file: fotoRostro },
              ].map(({ label, setter, file }) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium tracking-widest uppercase text-[#6b6356]">
                    {label}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setter(e.target.files?.[0] ?? null)}
                    className="text-sm text-[#1a1208]"
                  />
                  {file && (
                    <p className="text-[11px] text-green-600">✓ {file.name}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Forma física */}
            <div className="bg-white border border-black/10 rounded-xl p-5 flex items-center gap-3">
              <input
                type="checkbox"
                id="forma"
                checked={formafisica}
                onChange={(e) => setFormaFisica(e.target.checked)}
                className="w-4 h-4 accent-[#c04a1e]"
              />
              <label htmlFor="forma" className="text-sm text-[#1a1208]">
                Forma física firmada
              </label>
            </div>

            {/* Notas */}
            <div className="bg-white border border-black/10 rounded-xl p-5 flex flex-col gap-2">
              <label className="text-[10px] font-medium tracking-widest uppercase text-[#6b6356]">
                Notas (opcional)
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                placeholder="Observaciones sobre la validación..."
                className="bg-[#f7f2eb] border border-black/15 rounded text-sm text-[#1a1208] px-3 py-2.5 outline-none focus:border-[#c04a1e] placeholder:text-[#6b6356]/50 resize-none"
              />
            </div>

            {errorValidacion && (
              <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
                <p className="text-red-600 text-xs">{errorValidacion}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={aprobarUsuario}
                disabled={procesando || !fotoIne || !fotoDomicilio || !fotoRostro || !formafisica}
                className="flex-1 bg-[#c04a1e] text-white text-sm font-medium tracking-widest uppercase py-3.5 rounded disabled:opacity-40"
              >
                {procesando ? "Procesando..." : "Aprobar →"}
              </button>
              <button
                onClick={rechazarUsuario}
                disabled={procesando}
                className="flex-1 border border-black/15 text-[#1a1208] text-sm font-medium tracking-widest uppercase py-3.5 rounded disabled:opacity-40"
              >
                Rechazar
              </button>
            </div>
          </div>
        )}

        {/* TAB: VALIDADORES */}
        {tab === "validadores" && (
          <div className="flex flex-col gap-3">
            {validadores.length === 0 && (
              <p className="text-sm text-[#6b6356]">No hay validadores registrados.</p>
            )}
            {validadores.map((v) => (
              <div key={v.id} className="bg-white border border-black/10 rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-serif font-bold text-[#1a1208]">{v.usuario.nombre_completo}</p>
                  <p className="text-[11px] text-[#6b6356] mt-0.5">{v.colectivo.nombre}</p>
                  <p className="text-[11px] text-[#6b6356]">
                    Validador desde {new Date(v.creado_en).toLocaleDateString("es-MX")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: PROMOCIONES */}
        {tab === "promociones" && (
          <div className="flex flex-col gap-5">

            {/* Proponer nuevo validador */}
            <div className="bg-white border border-black/10 rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-widest uppercase text-[#6b6356] font-medium">
                  Proponer nuevo validador
                </p>
                <button
                  onClick={() => setMostrarFormPromocion(!mostrarFormPromocion)}
                  className="text-[11px] tracking-widest uppercase text-[#c04a1e] font-medium"
                >
                  {mostrarFormPromocion ? "Cancelar" : "Proponer →"}
                </button>
              </div>

              {mostrarFormPromocion && (
                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    placeholder="Email del ciudadano a proponer"
                    value={emailNominado}
                    onChange={(e) => setEmailNominado(e.target.value)}
                    className="bg-[#f7f2eb] border border-black/15 rounded text-sm text-[#1a1208] px-3 py-2.5 outline-none focus:border-[#c04a1e] placeholder:text-[#6b6356]/50"
                  />
                  {errorPromocion && (
                    <p className="text-red-600 text-xs">{errorPromocion}</p>
                  )}
                  <button
                    onClick={proponerValidador}
                    disabled={creandoPromocion || !emailNominado.trim()}
                    className="bg-[#c04a1e] text-white text-xs font-medium tracking-widest uppercase px-4 py-3 rounded disabled:opacity-50"
                  >
                    {creandoPromocion ? "Enviando..." : "Enviar propuesta →"}
                  </button>
                </div>
              )}
            </div>

            {/* Lista de promociones */}
            {promociones.length === 0 && (
              <p className="text-sm text-[#6b6356]">No hay promociones pendientes.</p>
            )}
            {promociones.map((p) => {
              const favor = p.votos?.filter(v => v.voto).length ?? 0;
              const contra = p.votos?.filter(v => !v.voto).length ?? 0;
              const yaVote = p.votos?.some(v => v.validador_id === validadorActual?.id);

              return (
                <div key={p.id} className="bg-white border border-black/10 rounded-xl px-5 py-4 flex flex-col gap-3">
                  <div>
                    <p className="font-serif font-bold text-[#1a1208]">{p.nominado.nombre_completo}</p>
                    <p className="text-[11px] text-[#6b6356]">
                      Propuesto por {p.propuesto_por_usuario.nombre_completo} · {p.colectivo.nombre}
                    </p>
                    <p className="text-[11px] text-[#6b6356]">
                      Cierra {new Date(p.cierra_en).toLocaleDateString("es-MX")}
                    </p>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <span className="text-green-700">✓ {favor} a favor</span>
                    <span className="text-red-600">✗ {contra} en contra</span>
                  </div>

                  {!yaVote && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => votar(p.id, true)}
                        className="flex-1 bg-green-100 text-green-700 text-xs font-medium tracking-widest uppercase py-2.5 rounded"
                      >
                        A favor
                      </button>
                      <button
                        onClick={() => votar(p.id, false)}
                        className="flex-1 bg-red-50 text-red-600 text-xs font-medium tracking-widest uppercase py-2.5 rounded"
                      >
                        En contra
                      </button>
                    </div>
                  )}

                  {yaVote && (
                    <p className="text-[11px] text-[#6b6356]">Ya votaste en esta promoción.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}