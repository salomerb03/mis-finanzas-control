"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const STORAGE_KEY = "mis-finanzas-movimientos";

const CATEGORIAS_GASTO = [
  "Comida",
  "Transporte",
  "Vivienda",
  "Servicios",
  "Salud",
  "Ocio",
  "Otro",
];

const COLOR_CATEGORIA = {
  Comida: "#C97C3D",
  Transporte: "#3D6FA8",
  Vivienda: "#6B4F9E",
  Servicios: "#2E8B87",
  Salud: "#B04C6A",
  Ocio: "#B98423",
  Otro: "#8A8F80",
};

function formatoCOP(valor) {
  return valor.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function formatoFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function soloDigitos(texto) {
  return texto.replace(/\D/g, "");
}

function conPuntosDeMil(digitos) {
  if (!digitos) return "";
  return Number(digitos).toLocaleString("es-CO");
}

function claveMes(iso) {
  return iso.slice(0, 7); // "YYYY-MM"
}

function nombreMes(claveYYYYMM) {
  const [anio, mes] = claveYYYYMM.split("-").map(Number);
  const d = new Date(anio, mes - 1, 1);
  const texto = d.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function mesAnteriorDe(claveYYYYMM) {
  const [anio, mes] = claveYYYYMM.split("-").map(Number);
  const d = new Date(anio, mes - 2, 1); // mes - 1 (0-index) - 1 (anterior)
  const anioA = d.getFullYear();
  const mesA = String(d.getMonth() + 1).padStart(2, "0");
  return `${anioA}-${mesA}`;
}

function formatoFechaCompleta(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Home() {
  const [movimientos, setMovimientos] = useState([]);
  const [cargado, setCargado] = useState(false);

  const [tipo, setTipo] = useState("gasto"); // "ingreso" | "gasto"
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_GASTO[0]);
  const [error, setError] = useState("");
  const [mesSeleccionado, setMesSeleccionado] = useState("todos");

  // cargar desde localStorage al iniciar
  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(STORAGE_KEY);
      if (guardado) setMovimientos(JSON.parse(guardado));
    } catch (e) {
      console.error("No se pudo leer lo guardado", e);
    }
    setCargado(true);
  }, []);

  // guardar cada vez que cambian los movimientos
  useEffect(() => {
    if (!cargado) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(movimientos));
    } catch (e) {
      console.error("No se pudo guardar", e);
    }
  }, [movimientos, cargado]);

  const saldo = useMemo(() => {
    return movimientos.reduce((acc, m) => {
      return m.tipo === "ingreso" ? acc + m.monto : acc - m.monto;
    }, 0);
  }, [movimientos]);

  const totalIngresos = useMemo(
    () =>
      movimientos
        .filter((m) => m.tipo === "ingreso")
        .reduce((a, m) => a + m.monto, 0),
    [movimientos]
  );

  const totalGastos = useMemo(
    () =>
      movimientos
        .filter((m) => m.tipo === "gasto")
        .reduce((a, m) => a + m.monto, 0),
    [movimientos]
  );

  // movimientos ordenados del más nuevo al más viejo, con saldo acumulado calculado en orden cronológico
  const movimientosConSaldo = useMemo(() => {
    const cronologico = [...movimientos].sort((a, b) => a.fecha.localeCompare(b.fecha));
    let acumulado = 0;
    const conSaldo = cronologico.map((m) => {
      acumulado += m.tipo === "ingreso" ? m.monto : -m.monto;
      return { ...m, saldoAcumulado: acumulado };
    });
    return conSaldo.reverse();
  }, [movimientos]);

  // lista de meses que tienen movimientos, del más reciente al más viejo
  const mesesDisponibles = useMemo(() => {
    const claves = new Set(movimientos.map((m) => claveMes(m.fecha)));
    claves.add(claveMes(new Date().toISOString())); // siempre incluye el mes actual
    return Array.from(claves).sort().reverse();
  }, [movimientos]);

  const movimientosDelMes = useMemo(() => {
    if (mesSeleccionado === "todos") return movimientosConSaldo;
    return movimientosConSaldo.filter((m) => claveMes(m.fecha) === mesSeleccionado);
  }, [movimientosConSaldo, mesSeleccionado]);

  const totalesDelMes = useMemo(() => {
    return movimientosDelMes.reduce(
      (acc, m) => {
        if (m.tipo === "ingreso") acc.ingresos += m.monto;
        else acc.gastos += m.monto;
        return acc;
      },
      { ingresos: 0, gastos: 0 }
    );
  }, [movimientosDelMes]);

  // comparación de gastos con el mes anterior (solo tiene sentido si hay un mes específico elegido)
  const comparacionMesAnterior = useMemo(() => {
    if (mesSeleccionado === "todos") return null;
    const claveAnterior = mesAnteriorDe(mesSeleccionado);
    const gastosAnterior = movimientos
      .filter((m) => m.tipo === "gasto" && claveMes(m.fecha) === claveAnterior)
      .reduce((a, m) => a + m.monto, 0);

    if (gastosAnterior === 0) return null;

    const diferencia = totalesDelMes.gastos - gastosAnterior;
    const porcentaje = (diferencia / gastosAnterior) * 100;
    return { porcentaje, subio: diferencia > 0, mesAnteriorNombre: nombreMes(claveAnterior) };
  }, [movimientos, mesSeleccionado, totalesDelMes]);

  // desglose de gastos por categoría, respetando el mes elegido
  const gastosPorCategoria = useMemo(() => {
    const acumulado = {};
    movimientosDelMes
      .filter((m) => m.tipo === "gasto")
      .forEach((m) => {
        acumulado[m.categoria] = (acumulado[m.categoria] || 0) + m.monto;
      });
    return Object.entries(acumulado)
      .map(([categoria, valor]) => ({ name: categoria, value: valor }))
      .sort((a, b) => b.value - a.value);
  }, [movimientosDelMes]);

  function agregarMovimiento(e) {
    e.preventDefault();
    const valor = parseFloat(monto);

    if (!descripcion.trim()) {
      setError("Escribe una descripción.");
      return;
    }
    if (!valor || valor <= 0) {
      setError("Escribe un monto válido, mayor a cero.");
      return;
    }

    const nuevo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tipo,
      descripcion: descripcion.trim(),
      categoria: tipo === "gasto" ? categoria : "Ingreso",
      monto: valor,
      fecha: new Date().toISOString(),
    };

    setMovimientos((prev) => [...prev, nuevo]);
    setDescripcion("");
    setMonto("");
    setError("");
  }

  function borrarMovimiento(id) {
    setMovimientos((prev) => prev.filter((m) => m.id !== id));
  }

  function borrarTodoElHistorial() {
    const confirmado = window.confirm(
      "¿Seguro que quieres borrar TODO el historial? Esta acción no se puede deshacer."
    );
    if (confirmado) {
      setMovimientos([]);
      setMesSeleccionado("todos");
    }
  }

  async function exportarAExcel() {
    if (movimientos.length === 0) return;

    const XLSX = await import("xlsx");

    // orden cronológico ascendente, más natural para leer en Excel
    const filas = [...movimientosConSaldo].reverse().map((m) => ({
      Fecha: formatoFechaCompleta(m.fecha),
      Tipo: m.tipo === "ingreso" ? "Ingreso" : "Gasto",
      Descripción: m.descripcion,
      Categoría: m.categoria,
      Monto: m.monto,
      "Saldo acumulado": m.saldoAcumulado,
    }));

    const hoja = XLSX.utils.json_to_sheet(filas);
    hoja["!cols"] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 28 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Movimientos");

    const nombreArchivo = `mis-cuentas-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(libro, nombreArchivo);
  }

  return (
    <main className="min-h-screen bg-paper-100 text-ink-900">
      <div className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        {/* Encabezado */}
        <header className="mb-8 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-ink-900">Mis Cuentas</h1>
            <p className="mt-1 font-mono text-sm text-muted">
              tu libreta de ingresos y gastos, sin enredos.
            </p>
          </div>
          {movimientos.length > 0 && (
            <button
              onClick={exportarAExcel}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-paper-300 bg-paper-50 px-3 py-1.5 font-mono text-xs text-ink-900 transition-colors hover:border-gold hover:text-gold"
              title="Exportar a Excel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Excel
            </button>
          )}
        </header>

        {/* Panel de saldo */}
        <section className="rounded-md border border-paper-300 bg-paper-50 px-6 py-7 sm:px-8 sm:py-8">
          <p className="font-mono text-xs tracking-wide text-muted">Saldo disponible</p>
          <p
            key={saldo}
            className={`mt-2 font-mono text-4xl sm:text-5xl font-semibold ${
              saldo < 0 ? "text-expense" : "text-gold"
            }`}
            style={{ animation: "pop 0.28s ease-out" }}
          >
            {formatoCOP(saldo)}
          </p>

          <div className="mt-6 flex gap-8 border-t border-paper-300 pt-5">
            <div>
              <p className="font-mono text-xs text-muted">Ingresos</p>
              <p className="font-mono text-lg text-income">{formatoCOP(totalIngresos)}</p>
            </div>
            <div>
              <p className="font-mono text-xs text-muted">Gastos</p>
              <p className="font-mono text-lg text-expense">{formatoCOP(totalGastos)}</p>
            </div>
          </div>
        </section>

        {/* Formulario para agregar movimiento */}
        <section className="mt-6 rounded-md border border-paper-300 bg-paper-50 p-5 sm:p-6">
          <div className="mb-4 inline-flex rounded-full border border-paper-300 p-1">
            <button
              type="button"
              onClick={() => setTipo("ingreso")}
              className={`rounded-full px-4 py-1.5 font-mono text-sm transition-colors ${
                tipo === "ingreso"
                  ? "bg-income text-paper-50"
                  : "text-muted hover:text-ink-900"
              }`}
            >
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => setTipo("gasto")}
              className={`rounded-full px-4 py-1.5 font-mono text-sm transition-colors ${
                tipo === "gasto"
                  ? "bg-expense text-ink-900"
                  : "text-muted hover:text-ink-900"
              }`}
            >
              Gasto
            </button>
          </div>

          <form onSubmit={agregarMovimiento} className="space-y-4">
            <div>
              <label className="mb-1 block font-mono text-xs text-muted">
                {tipo === "ingreso" ? "¿De dónde viene?" : "¿En qué gastaste?"}
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder={tipo === "ingreso" ? "Sueldo, freelance, regalo..." : "Almuerzo, Uber, mercado..."}
                className="w-full rounded border border-paper-300 bg-white px-3 py-2 font-mono text-sm text-ink-900 placeholder:text-muted/60 outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block font-mono text-xs text-muted">Monto (COP)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={conPuntosDeMil(monto)}
                  onChange={(e) => setMonto(soloDigitos(e.target.value))}
                  placeholder="50.000"
                  className="w-full rounded border border-paper-300 bg-white px-3 py-2 font-mono text-sm text-ink-900 placeholder:text-muted/60 outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>

              {tipo === "gasto" && (
                <div className="flex-1">
                  <label className="mb-1 block font-mono text-xs text-muted">Categoría</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full rounded border border-paper-300 bg-white px-3 py-2 font-mono text-sm text-ink-900 outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  >
                    {CATEGORIAS_GASTO.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {error && <p className="font-mono text-xs text-expense">{error}</p>}

            <button
              type="submit"
              className={`w-full rounded py-2.5 font-mono text-sm font-medium transition-colors ${
                tipo === "ingreso"
                  ? "bg-income text-paper-50 hover:brightness-110"
                  : "bg-expense text-ink-900 hover:brightness-110"
              }`}
            >
              {tipo === "ingreso" ? "Registrar ingreso" : "Registrar gasto"}
            </button>
          </form>
        </section>

        {/* Historial */}
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-xs text-muted">Movimientos</p>
            {movimientos.length > 0 && (
              <button
                onClick={borrarTodoElHistorial}
                aria-label="Borrar todo el historial"
                title="Borrar todo el historial"
                className="flex items-center gap-1 rounded px-2 py-1 font-mono text-xs text-muted transition-colors hover:text-expense"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                Borrar todo
              </button>
            )}
          </div>

          {/* Pestañas de meses */}
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setMesSeleccionado("todos")}
              className={`shrink-0 rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
                mesSeleccionado === "todos"
                  ? "border-gold bg-gold text-paper-50"
                  : "border-paper-300 text-muted hover:text-ink-900"
              }`}
            >
              Todos
            </button>
            {mesesDisponibles.map((clave) => (
              <button
                key={clave}
                onClick={() => setMesSeleccionado(clave)}
                className={`shrink-0 rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
                  mesSeleccionado === clave
                    ? "border-gold bg-gold text-paper-50"
                    : "border-paper-300 text-muted hover:text-ink-900"
                }`}
              >
                {nombreMes(clave)}
              </button>
            ))}
          </div>

          {mesSeleccionado !== "todos" && movimientosDelMes.length > 0 && (
            <div className="mb-3 rounded-md border border-paper-300 bg-paper-50 px-4 py-3">
              <div className="flex gap-6">
                <div>
                  <p className="font-mono text-xs text-muted">Ingresos del mes</p>
                  <p className="font-mono text-sm text-income">{formatoCOP(totalesDelMes.ingresos)}</p>
                </div>
                <div>
                  <p className="font-mono text-xs text-muted">Gastos del mes</p>
                  <p className="font-mono text-sm text-expense">{formatoCOP(totalesDelMes.gastos)}</p>
                </div>
              </div>

              {comparacionMesAnterior && (
                <p
                  className={`mt-2.5 border-t border-paper-300 pt-2.5 font-mono text-xs ${
                    comparacionMesAnterior.subio ? "text-expense" : "text-income"
                  }`}
                >
                  {comparacionMesAnterior.subio ? "▲" : "▼"}{" "}
                  {Math.abs(comparacionMesAnterior.porcentaje).toFixed(0)}%{" "}
                  {comparacionMesAnterior.subio ? "más" : "menos"} gastos que en{" "}
                  {comparacionMesAnterior.mesAnteriorNombre}
                </p>
              )}
            </div>
          )}

          {/* Gráfica de gastos por categoría */}
          {gastosPorCategoria.length > 0 && (
            <div className="mb-3 rounded-md border border-paper-300 bg-paper-50 px-4 py-4">
              <p className="mb-2 font-mono text-xs text-muted">Gastos por categoría</p>
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gastosPorCategoria}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                        stroke="none"
                        animationDuration={500}
                      >
                        {gastosPorCategoria.map((entrada) => (
                          <Cell
                            key={entrada.name}
                            fill={COLOR_CATEGORIA[entrada.name] || "#8A8F80"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(valor) => formatoCOP(valor)}
                        contentStyle={{
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: 12,
                          borderRadius: 6,
                          border: "1px solid #D7DAC8",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-1.5">
                  {gastosPorCategoria.map((c) => (
                    <div key={c.name} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-mono text-xs text-ink-900">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: COLOR_CATEGORIA[c.name] || "#8A8F80" }}
                        />
                        {c.name}
                      </span>
                      <span className="font-mono text-xs text-muted">{formatoCOP(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {movimientosDelMes.length === 0 ? (
            <div className="rounded-md border border-dashed border-paper-300 px-5 py-10 text-center">
              <p className="font-mono text-sm text-muted">
                {movimientos.length === 0
                  ? "Tu libreta está vacía. Registra tu primer ingreso para empezar."
                  : "No hay movimientos en este mes."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-paper-300 bg-paper-50">
              <AnimatePresence initial={false}>
                {movimientosDelMes.map((m, i) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className={`ledger-row flex items-center justify-between gap-3 overflow-hidden px-4 py-3 sm:px-5 ${
                      i !== movimientosDelMes.length - 1 ? "" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm text-ink-900">{m.descripcion}</p>
                      <p className="font-mono text-xs text-muted">
                        {formatoFecha(m.fecha)} · {m.categoria}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-mono text-sm font-medium ${
                          m.tipo === "ingreso" ? "text-income" : "text-expense"
                        }`}
                      >
                        {m.tipo === "ingreso" ? "+" : "-"}
                        {formatoCOP(m.monto)}
                      </p>
                      <p className="font-mono text-xs text-muted">
                        saldo: {formatoCOP(m.saldoAcumulado)}
                      </p>
                    </div>

                    <button
                      onClick={() => borrarMovimiento(m.id)}
                      aria-label="Eliminar movimiento"
                      className="ml-1 shrink-0 rounded px-2 py-1 font-mono text-muted transition-colors hover:text-expense"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        <footer className="mt-10 text-center">
          <p className="font-mono text-xs text-muted">
            Tus datos se guardan solo en este navegador.
          </p>
        </footer>
      </div>
    </main>
  );
}
