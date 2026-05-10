import React, { useState, useMemo, useEffect } from "react";

export default function FinanzasApp() {
  const [movimientos, setMovimientos] = useState(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("movimientos") || "[]");
  });

  const [pagados, setPagados] = useState(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("pagados") || "[]");
  });

  const [dineroActual, setDineroActual] = useState(() => {
    if (typeof window === "undefined") return 0;
    return JSON.parse(localStorage.getItem("dineroActual") || "0");
  });

  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("gasto");
  const [categoria, setCategoria] = useState("Tarjeta");
  const [vencimientoDia, setVencimientoDia] = useState(10);
  const [vencimientoMes, setVencimientoMes] = useState(new Date().getMonth() + 1);
  const [vencimientoAnio, setVencimientoAnio] = useState(String(new Date().getFullYear()).slice(-2));

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [editandoId, setEditandoId] = useState(null);
  const [mesCalendario, setMesCalendario] = useState(new Date().getMonth());
  const [anioCalendario, setAnioCalendario] = useState(new Date().getFullYear());

  const nombresDias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    localStorage.setItem("movimientos", JSON.stringify(movimientos));
  }, [movimientos]);

  useEffect(() => {
    localStorage.setItem("pagados", JSON.stringify(pagados));
  }, [pagados]);

  useEffect(() => {
    localStorage.setItem("dineroActual", JSON.stringify(dineroActual));
  }, [dineroActual]);

  const agregarMovimiento = () => {
    if (!descripcion || !monto) return;

    const nuevoMovimiento = {
      id: Date.now(),
      descripcion,
      monto: parseFloat(monto),
      tipo,
      categoria,
      vencimientoDia: Number(vencimientoDia),
      vencimientoMes: Number(vencimientoMes),
      vencimientoAnio,
      fecha: new Date().toLocaleDateString(),
    };

    if (editandoId) {
      setMovimientos(
        movimientos.map((m) =>
          m.id === editandoId ? { ...nuevoMovimiento, id: editandoId } : m
        )
      );
      setEditandoId(null);
    } else {
      setMovimientos([nuevoMovimiento, ...movimientos]);
    }

    setDescripcion("");
    setMonto("");
  };

  const marcarComoPagado = (movimiento) => {
    setPagados([
      {
        ...movimiento,
        fechaPago: new Date().toLocaleDateString(),
      },
      ...pagados,
    ]);

    setMovimientos(movimientos.filter((m) => m.id !== movimiento.id));
  };

  const eliminarMovimiento = (id) => {
    const movimiento = movimientos.find((m) => m.id === id);

    if (
      movimiento?.tipo === "ingreso" &&
      movimiento?.categoria === "Fijo mensual"
    ) {
      return;
    }

    setMovimientos(movimientos.filter((m) => m.id !== id));
  };

  const movimientosFiltrados = useMemo(() => {
    return movimientos
      .filter((m) => {
        const coincideBusqueda = m.descripcion
          .toLowerCase()
          .includes(busqueda.toLowerCase());

        const coincideCategoria =
          filtroCategoria === "Todas" ||
          m.categoria === filtroCategoria;

        const coincideMes =
          Number(m.vencimientoMes) === Number(filtroMes);

        return coincideBusqueda && coincideCategoria && coincideMes;
      })
      .sort((a, b) => {
        const fechaA = new Date(
          2000 + Number(a.vencimientoAnio),
          a.vencimientoMes - 1,
          a.vencimientoDia
        );

        const fechaB = new Date(
          2000 + Number(b.vencimientoAnio),
          b.vencimientoMes - 1,
          b.vencimientoDia
        );

        return fechaA - fechaB;
      });
  }, [movimientos, busqueda, filtroCategoria, filtroMes]);

  const alertasProximas = useMemo(() => {
    const hoy = new Date();

    return movimientos.filter((m) => {
      const fechaVencimiento = new Date(
        2000 + Number(m.vencimientoAnio),
        Number(m.vencimientoMes) - 1,
        Number(m.vencimientoDia)
      );

      const diferencia = Math.ceil(
        (fechaVencimiento - hoy) / (1000 * 60 * 60 * 24)
      );

      return diferencia >= 0 && diferencia <= 5;
    });
  }, [movimientos]);

  const resumen = useMemo(() => {
    const ingresos = movimientos
      .filter((m) => m.tipo === "ingreso")
      .reduce((acc, m) => acc + m.monto, 0);

    const gastos = movimientos
      .filter((m) => m.tipo === "gasto")
      .reduce((acc, m) => acc + m.monto, 0);

    const plataRestante = Number(dineroActual) + ingresos - gastos;

    return {
      ingresos,
      gastos,
      balance: ingresos - gastos,
      necesarioFinMes: gastos - (Number(dineroActual) + ingresos),
      plataRestante,
    };
  }, [movimientos, dineroActual]);

  const diasEnMes = new Date(anioCalendario, mesCalendario + 1, 0).getDate();

  const primerDiaSemana = new Date(
    anioCalendario,
    mesCalendario,
    1
  ).getDay();

  const siguienteMes = () => {
    setMesCalendario((m) => {
      if (m === 11) {
        setAnioCalendario((a) => a + 1);
        return 0;
      }
      return m + 1;
    });
  };

  const mesAnterior = () => {
    setMesCalendario((m) => {
      if (m === 0) {
        setAnioCalendario((a) => a - 1);
        return 11;
      }
      return m - 1;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
          <h1 className="text-3xl font-black">💸 FinanceFlow</h1>
          <p className="text-gray-400">Control inteligente de gastos</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-3xl">
            <p className="text-sm text-green-400 uppercase font-bold">Ingresos Totales</p>
            <h3 className="text-3xl font-bold">${resumen.ingresos.toLocaleString()}</h3>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl">
            <p className="text-sm text-red-400 uppercase font-bold">Gastos Pendientes</p>
            <h3 className="text-3xl font-bold">${resumen.gastos.toLocaleString()}</h3>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl">
            <p className="text-sm text-blue-400 uppercase font-bold">Disponible Real</p>
            <h3 className="text-3xl font-bold">${resumen.plataRestante.toLocaleString()}</h3>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-3xl">
            <p className="text-sm text-yellow-400 uppercase font-bold">Necesario para Fin de Mes</p>
            <h3 className="text-3xl font-bold">
              ${Math.max(resumen.necesarioFinMes, 0).toLocaleString()}
            </h3>
          </div>
        </div>

        {alertasProximas.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-3xl">
            <h2 className="font-bold text-yellow-300 mb-2">⚠️ Próximos Vencimientos</h2>
            <div className="flex flex-wrap gap-2">
              {alertasProximas.map((m) => (
                <div key={m.id} className="bg-yellow-500/20 px-3 py-2 rounded-xl text-sm">
                  {m.descripcion} • {m.vencimientoDia}/{m.vencimientoMes}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
          <label className="block text-sm mb-2 text-gray-400">
            ¿Cuánta plata tenés hoy?
          </label>

          <input
            type="number"
            value={dineroActual}
            onChange={(e) => setDineroActual(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 w-full text-2xl font-bold focus:outline-none"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
            <h2 className="text-xl font-bold">Nuevo Movimiento</h2>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Descripción"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="col-span-2 bg-black/20 border border-white/10 p-3 rounded-xl"
              />

              <input
                type="number"
                placeholder="Monto"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="bg-black/20 border border-white/10 p-3 rounded-xl text-white"
              />

              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="bg-black/20 border border-white/10 p-3 rounded-xl text-white"
              >
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>

              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="col-span-2 bg-black/20 border border-white/10 p-3 rounded-xl"
              >
                <option value="Tarjeta">Tarjeta</option>
                <option value="Fijo mensual">Fijo mensual</option>
                <option value="Spotify">Spotify</option>
                <option value="Meli+">Meli+</option>
                <option value="Moto - Nafta">Moto - Nafta</option>
                <option value="Extra">Extra</option>
              </select>

              <div className="col-span-2 flex gap-2">
                <input
                  type="number"
                  placeholder="Día"
                  value={vencimientoDia}
                  onChange={(e) => setVencimientoDia(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 p-3 rounded-xl"
                />

                <input
                  type="number"
                  placeholder="Mes"
                  value={vencimientoMes}
                  onChange={(e) => setVencimientoMes(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 p-3 rounded-xl"
                />

                <input
                  type="number"
                  placeholder="Año"
                  value={vencimientoAnio}
                  onChange={(e) => setVencimientoAnio(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 p-3 rounded-xl"
                />
              </div>
            </div>

            <button
              onClick={agregarMovimiento}
              className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold transition-all"
            >
              Agregar Movimiento
            </button>
          </section>

          <section className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">
                {nombresMeses[mesCalendario]} {anioCalendario}
              </h2>

              <div className="flex gap-2">
                <button onClick={mesAnterior} className="p-2 bg-white/10 rounded-lg">
                  ←
                </button>

                <button onClick={siguienteMes} className="p-2 bg-white/10 rounded-lg">
                  →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {nombresDias.map((d) => (
                <div key={d} className="text-gray-500 font-bold">
                  {d}
                </div>
              ))}

              {Array.from({ length: primerDiaSemana }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="h-14 rounded-lg"
                />
              ))}

              {Array.from({ length: diasEnMes }).map((_, i) => {
                const diaActual = i + 1;

                const movimientosDelDia = movimientos.filter(
                  (m) =>
                    Number(m.vencimientoDia) === diaActual &&
                    Number(m.vencimientoMes) === mesCalendario + 1
                );

                const tieneGastos = movimientosDelDia.some((m) => m.tipo === "gasto");
                const tieneIngresos = movimientosDelDia.some((m) => m.tipo === "ingreso");

                return (
                  <div
                    key={i}
                    className={`h-14 flex flex-col items-center justify-center rounded-lg border transition-all relative overflow-hidden ${
                      tieneGastos
                        ? "bg-red-500/20 border-red-500/40"
                        : tieneIngresos
                        ? "bg-green-500/20 border-green-500/40"
                        : diaActual === new Date().getDate()
                        ? "bg-blue-600 border-blue-400"
                        : "border-white/5 bg-white/5"
                    }`}
                  >
                    <span className="font-bold text-sm">{diaActual}</span>

                    {movimientosDelDia.length > 0 && (
                      <div className="mt-1 flex flex-col gap-1 w-full px-1 overflow-hidden">
                        {movimientosDelDia.slice(0, 2).map((m) => (
                          <div
                            key={m.id}
                            className={`text-[9px] leading-none px-1 py-[2px] rounded truncate font-semibold w-full ${
                              m.tipo === "gasto"
                                ? "bg-red-500/70 text-white"
                                : "bg-green-500/70 text-white"
                            }`}
                          >
                            {m.descripcion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="bg-white/5 p-6 rounded-3xl border border-white/10">
          <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
            <h2 className="text-2xl font-bold">Pendientes</h2>

            <input
              type="text"
              placeholder="Buscar movimientos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="bg-black/20 border border-white/10 px-4 py-2 rounded-xl"
            />

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="bg-black/20 border border-white/10 px-4 py-2 rounded-xl"
            >
              <option value="Todas">Todas</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Fijo mensual">Fijo mensual</option>
              <option value="Moto - Nafta">Moto - Nafta</option>
              <option value="Extra">Extra</option>
            </select>
          </div>

          <div className="space-y-3">
            {movimientosFiltrados.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5"
              >
                <div>
                  <p className="font-bold">{m.descripcion}</p>
                  <p className="text-xs text-gray-400">
                    {m.categoria} • Vence: {m.vencimientoDia}/{m.vencimientoMes}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`font-bold ${
                      m.tipo === "ingreso" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {m.tipo === "ingreso" ? "+" : "-"}$
                    {m.monto.toLocaleString()}
                  </span>

                  <button
                    onClick={() => {
                      setDescripcion(m.descripcion);
                      setMonto(m.monto);
                      setTipo(m.tipo);
                      setCategoria(m.categoria);
                      setVencimientoDia(m.vencimientoDia);
                      setVencimientoMes(m.vencimientoMes);
                      setVencimientoAnio(m.vencimientoAnio);
                      setEditandoId(m.id);
                    }}
                    className="bg-blue-500 text-xs px-3 py-2 rounded-lg font-bold"
                  >
                    EDITAR
                  </button>

                  <button
                    onClick={() => marcarComoPagado(m)}
                    className="bg-green-600 text-xs px-3 py-2 rounded-lg font-bold"
                  >
                    PAGAR
                  </button>

                  <button
                    disabled={m.tipo === "ingreso" && m.categoria === "Fijo mensual"}
                    onClick={() => eliminarMovimiento(m.id)}
                    className={`p-2 rounded-lg ${
                      m.tipo === "ingreso" && m.categoria === "Fijo mensual"
                        ? "text-gray-600 cursor-not-allowed"
                        : "text-red-500 hover:bg-red-500/10"
                    }`}
                  >
                    {m.tipo === "ingreso" && m.categoria === "Fijo mensual"
                      ? "🔒"
                      : "✕"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/5 p-6 rounded-3xl border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-green-400">
              ✅ Pagos del Mes
            </h2>

            <span className="text-sm text-gray-400">
              {pagados.length} pagos realizados
            </span>
          </div>

          {pagados.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Todavía no registraste pagos realizados.
            </div>
          ) : (
            <div className="space-y-3">
              {pagados.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between bg-green-500/5 border border-green-500/10 p-4 rounded-2xl"
                >
                  <div>
                    <p className="font-bold line-through opacity-80">
                      {m.descripcion}
                    </p>

                    <p className="text-xs text-gray-400">
                      {m.categoria} • Pagado el {m.fechaPago}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold text-green-400">
                      ${m.monto.toLocaleString()}
                    </span>

                    <button
                      onClick={() => {
                        setMovimientos([m, ...movimientos]);
                        setPagados(pagados.filter((p) => p.id !== m.id));
                      }}
                      className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs px-3 py-2 rounded-lg font-bold transition-all"
                    >
                      RESTAURAR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white/5 p-6 rounded-3xl border border-white/10">
          <h2 className="text-2xl font-bold mb-4">💾 Backup</h2>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                const data = {
                  movimientos,
                  pagados,
                  dineroActual,
                };

                const blob = new Blob(
                  [JSON.stringify(data, null, 2)],
                  { type: "application/json" }
                );

                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = `financeflow-backup-${new Date().toLocaleDateString()}.json`;
                a.click();

                URL.revokeObjectURL(url);
              }}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-2xl font-bold"
            >
              Exportar Backup
            </button>

            <label className="bg-green-600 hover:bg-green-500 px-4 py-3 rounded-2xl font-bold cursor-pointer">
              Importar Backup

              <input
                type="file"
                accept=".json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (!file) return;

                  const reader = new FileReader();

                  reader.onload = (event) => {
                    try {
                      const data = JSON.parse(event.target.result);

                      setMovimientos(data.movimientos || []);
                      setPagados(data.pagados || []);
                      setDineroActual(data.dineroActual || 0);

                      alert("Backup restaurado correctamente");
                    } catch {
                      alert("Archivo inválido");
                    }
                  };

                  reader.readAsText(file);
                }}
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
