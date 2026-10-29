import React from 'react';
import { StaffTarifas } from '../types';
import { formatMoneda } from '../utils/formatters';
import { Users2, UserCheck, Wand2, ChefHat, Sparkles, ShieldCheck } from 'lucide-react';

interface Modulo2PersonalProps {
  tarifas: StaffTarifas;
  personal: {
    garzones: number;
    cocineros: number;
    aseo: number;
    maitre: number;
  };
  onChangePersonal: (nuevoPersonal: {
    garzones: number;
    cocineros: number;
    aseo: number;
    maitre: number;
  }) => void;
  invitados: number;
}

export const Modulo2Personal: React.FC<Modulo2PersonalProps> = ({
  tarifas,
  personal,
  onChangePersonal,
  invitados
}) => {
  // Cálculo de subtotales
  const costoGarzones = personal.garzones * tarifas.garzonJornada;
  const costoCocineros = personal.cocineros * tarifas.cocineroJornada;
  const costoAseo = personal.aseo * tarifas.aseoJornada;
  const costoMaitre = personal.maitre * tarifas.maitreJornada;
  const costoTotalPersonal = costoGarzones + costoCocineros + costoAseo + costoMaitre;

  // Función para autocalcular dotación óptima según la cantidad de comensales
  const aplicarDotacionRecomendada = () => {
    const garzonesSugeridos = Math.max(2, Math.ceil(invitados / tarifas.ratioGarzon));
    const cocinerosSugeridos = Math.max(1, Math.ceil(invitados / tarifas.ratioCocinero));
    const aseoSugerido = Math.max(1, Math.ceil(invitados / tarifas.ratioAseo));
    const maitreSugerido = invitados > 60 ? 1 : 0;

    onChangePersonal({
      garzones: garzonesSugeridos,
      cocineros: cocinerosSugeridos,
      aseo: aseoSugerido,
      maitre: maitreSugerido
    });
  };

  const handleUpdate = (campo: 'garzones' | 'cocineros' | 'aseo' | 'maitre', delta: number) => {
    const valorActual = personal[campo];
    const nuevoValor = Math.max(0, valorActual + delta);
    onChangePersonal({
      ...personal,
      [campo]: nuevoValor
    });
  };

  const totalTrabajadores = personal.garzones + personal.cocineros + personal.aseo + personal.maitre;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
            02
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users2 className="w-5 h-5 text-blue-600" />
              Brigada de Servicio & Personal de Operaciones
            </h2>
            <p className="text-xs text-slate-500">
              Personal necesario para la ejecución impecable de cocina, salón, bar y mantención del recinto.
            </p>
          </div>
        </div>

        {/* Resumen en vivo */}
        <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl px-4 py-2 text-right shrink-0">
          <div className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">
            Costo Total Brigada
          </div>
          <div className="text-lg font-extrabold text-blue-950 tabular-nums">
            {formatMoneda(costoTotalPersonal)}
          </div>
          <div className="text-[11px] text-blue-700 font-medium">
            {totalTrabajadores} personas en turno
          </div>
        </div>
      </div>

      {/* Botón de auto-sugerencia gastronómica */}
      <div className="my-5 p-3.5 bg-gradient-to-r from-blue-50/60 via-slate-50 to-amber-50/40 border border-blue-200/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <Wand2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            ¿No estás seguro de la cantidad? Calcula la dotación profesional estándar para tus <strong>{invitados} invitados</strong> (1 garzón c/12 pax, 1 cocinero c/35 pax).
          </span>
        </div>

        <button
          type="button"
          onClick={aplicarDotacionRecomendada}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-xs transition-all shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Aplicar Brigada Sugerida
        </button>
      </div>

      {/* Grid de Roles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Garzones */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 hover:bg-white hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Garzones / Camareros
            </span>
          </div>
          <p className="text-[11px] text-slate-500 min-h-[32px]">
            Atención en mesas, servicio de platos y cóctel de bienvenida.
          </p>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Jornada</span>
              <span className="text-xs font-bold text-slate-700 tabular-nums">
                {formatMoneda(tarifas.garzonJornada)}
              </span>
            </div>

            {/* Controles +/- */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
              <button
                type="button"
                onClick={() => handleUpdate('garzones', -1)}
                className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-sm active:scale-90"
              >
                -
              </button>
              <span className="w-7 text-center font-extrabold text-slate-900 text-sm tabular-nums">
                {personal.garzones}
              </span>
              <button
                type="button"
                onClick={() => handleUpdate('garzones', 1)}
                className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-sm active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-2 text-right text-[11px] font-bold text-blue-900 tabular-nums">
            Subtotal: {formatMoneda(costoGarzones)}
          </div>
        </div>

        {/* Cocineros */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 hover:bg-white hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-amber-600" />
              Cocineros / Parrilleros
            </span>
          </div>
          <p className="text-[11px] text-slate-500 min-h-[32px]">
            Producción caliente, emplatado al minuto y fuegos en vivo.
          </p>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Jornada</span>
              <span className="text-xs font-bold text-slate-700 tabular-nums">
                {formatMoneda(tarifas.cocineroJornada)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
              <button
                type="button"
                onClick={() => handleUpdate('cocineros', -1)}
                className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-sm active:scale-90"
              >
                -
              </button>
              <span className="w-7 text-center font-extrabold text-slate-900 text-sm tabular-nums">
                {personal.cocineros}
              </span>
              <button
                type="button"
                onClick={() => handleUpdate('cocineros', 1)}
                className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-sm active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-2 text-right text-[11px] font-bold text-blue-900 tabular-nums">
            Subtotal: {formatMoneda(costoCocineros)}
          </div>
        </div>

        {/* Personal de Aseo */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 hover:bg-white hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Personal de Aseo & Baños
            </span>
          </div>
          <p className="text-[11px] text-slate-500 min-h-[32px]">
            Limpieza continua de servicios higiénicos y retiro de loza sucia.
          </p>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Jornada</span>
              <span className="text-xs font-bold text-slate-700 tabular-nums">
                {formatMoneda(tarifas.aseoJornada)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
              <button
                type="button"
                onClick={() => handleUpdate('aseo', -1)}
                className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-sm active:scale-90"
              >
                -
              </button>
              <span className="w-7 text-center font-extrabold text-slate-900 text-sm tabular-nums">
                {personal.aseo}
              </span>
              <button
                type="button"
                onClick={() => handleUpdate('aseo', 1)}
                className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-sm active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-2 text-right text-[11px] font-bold text-blue-900 tabular-nums">
            Subtotal: {formatMoneda(costoAseo)}
          </div>
        </div>

        {/* Maître / Supervisor */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 hover:bg-white hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Maître / Jefe de Salón
            </span>
          </div>
          <p className="text-[11px] text-slate-500 min-h-[32px]">
            Coordinación del timing gastronómico, entrada de platos y anfitriones.
          </p>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Jornada</span>
              <span className="text-xs font-bold text-slate-700 tabular-nums">
                {formatMoneda(tarifas.maitreJornada)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
              <button
                type="button"
                onClick={() => handleUpdate('maitre', -1)}
                className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-sm active:scale-90"
              >
                -
              </button>
              <span className="w-7 text-center font-extrabold text-slate-900 text-sm tabular-nums">
                {personal.maitre}
              </span>
              <button
                type="button"
                onClick={() => handleUpdate('maitre', 1)}
                className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-sm active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-2 text-right text-[11px] font-bold text-blue-900 tabular-nums">
            Subtotal: {formatMoneda(costoMaitre)}
          </div>
        </div>
      </div>
    </div>
  );
};
