import React, { useState } from 'react';
import { MenuOption } from '../types';
import { Utensils, X, Plus, Sparkles, Check, DollarSign } from 'lucide-react';
import { formatMoneda } from '../utils/formatters';

interface ModalCrearMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardarMenu: (nuevoMenu: MenuOption) => void;
  tiempoInicial?: {
    tiempo: 'coctel' | 'entrada' | 'fondo' | 'postre' | 'trasnoche';
    nombrePlato: string;
  };
}

export const ModalCrearMenu: React.FC<ModalCrearMenuProps> = ({
  isOpen,
  onClose,
  onGuardarMenu,
  tiempoInicial
}) => {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<'formal' | 'campestre' | 'cocktail' | 'premium'>('formal');
  const [descripcion, setDescripcion] = useState('');
  const [costoPersona, setCostoPersona] = useState<number>(22000);
  const [margenSugerido, setMargenSugerido] = useState<number>(33); // 33% estándar gastronómico
  const [destacado, setDestacado] = useState(false);

  // Tiempos del menú
  const [coctel, setCoctel] = useState(
    tiempoInicial?.tiempo === 'coctel' ? tiempoInicial.nombrePlato : ''
  );
  const [entrada, setEntrada] = useState(
    tiempoInicial?.tiempo === 'entrada' ? tiempoInicial.nombrePlato : ''
  );
  const [fondo, setFondo] = useState(
    tiempoInicial?.tiempo === 'fondo' ? tiempoInicial.nombrePlato : ''
  );
  const [postre, setPostre] = useState(
    tiempoInicial?.tiempo === 'postre' ? tiempoInicial.nombrePlato : ''
  );
  const [trasnoche, setTrasnoche] = useState(
    tiempoInicial?.tiempo === 'trasnoche' ? tiempoInicial.nombrePlato : ''
  );

  const [mostrarTiemposDetallados, setMostrarTiemposDetallados] = useState(!!tiempoInicial);

  if (!isOpen) return null;

  // Cálculo de precio sugerido con Food Cost estándar del 33%
  const precioSugerido = Math.round(costoPersona / (margenSugerido / 100 || 0.33));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const id = 'menu-' + Date.now();
    const nuevoMenu: MenuOption = {
      id,
      nombre: nombre.trim(),
      categoria,
      costoPersona: Math.max(0, Number(costoPersona) || 0),
      precioSugeridoPersona: precioSugerido,
      descripcion: descripcion.trim() || `Propuesta gastronómica personalizada formato ${categoria}.`,
      tiempos: {
        coctel: coctel.trim() || 'Selección de bocados fríos y calientes gourmet en jardín.',
        entrada: entrada.trim() || 'Entrada fresca de temporada según minuta del chef.',
        fondo: fondo.trim() || 'Plato de fondo noble con guarnición rústica y salsa de autor.',
        postre: postre.trim() || 'Trilogía dulce de autor o buffet de postres artesanales.',
        trasnoche: trasnoche.trim() || 'Estación de trasnoche: mini hamburguesas brioche y consomé reconfortante.'
      },
      destacado,
      costoCalculadoDesdeRecetas: false
    };

    onGuardarMenu(nuevoMenu);
    onClose();

    // Resetear formulario
    setNombre('');
    setDescripcion('');
    setCostoPersona(22000);
    setCoctel('');
    setEntrada('');
    setFondo('');
    setPostre('');
    setTrasnoche('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Utensils className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Crear Nuevo Menú Gastronómico
              </h2>
              <p className="text-xs text-slate-500">
                Diseña una nueva propuesta de menú para el cotizador y la calculadora de recetas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Nombre del Menú */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nombre del Menú <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Banquete Gala Criolla, Menú Vegano Deluxe, Asado Campestre..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden font-medium text-slate-900"
            />
          </div>

          {/* Categoría y Destacado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Formato / Categoría
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden font-medium bg-white text-slate-800"
              >
                <option value="formal">Banquete Formal / Cena Servida</option>
                <option value="campestre">Asado Campestre / Parrilla</option>
                <option value="cocktail">Cóctel Dinámico / Finger Food</option>
                <option value="premium">Menú Premium / Signature</option>
              </select>
            </div>

            <div className="flex items-center pt-5 sm:pt-6">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={destacado}
                  onChange={(e) => setDestacado(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Marcar como "Más Solicitado"
                </span>
              </label>
            </div>
          </div>

          {/* Descripción general */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Descripción del Menú (Aparecerá en cotizaciones y fichas)
            </label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Cena servida en 4 tiempos con productos nobles de la estación, parrilla a la vista y mesa de postres gourmet."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden text-slate-800"
            />
          </div>

          {/* Costeo inicial & Margen Food Cost 33% */}
          <div className="p-3.5 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 border border-amber-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                Costeo Base por Comensal (Insumos)
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Se recalcula al vincular recetas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-1">
                  Costo de Insumos Estimado ($/pax)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={costoPersona}
                    onChange={(e) => setCostoPersona(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 tabular-nums focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Margen Food Cost:</span>
                  <span className="font-bold text-amber-800">{margenSugerido}% (Estándar)</span>
                </div>
                <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">Precio Sugerido:</span>
                  <span className="font-black text-amber-950 text-sm tabular-nums">
                    {formatMoneda(precioSugerido)}/pax
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desglose de los 5 tiempos del menú */}
          <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Minuta de los 5 Tiempos del Menú
              </span>
              <button
                type="button"
                onClick={() => setMostrarTiemposDetallados(!mostrarTiemposDetallados)}
                className="text-amber-700 hover:text-amber-800 font-bold text-[11px]"
              >
                {mostrarTiemposDetallados ? 'Ocultar campos de tiempos' : 'Personalizar tiempos ahora +'}
              </button>
            </div>

            {mostrarTiemposDetallados && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    1. Cóctel de Bienvenida
                  </label>
                  <input
                    type="text"
                    value={coctel}
                    onChange={(e) => setCoctel(e.target.value)}
                    placeholder="Ej: Bocados fríos y calientes, canapés tibios y ceviche"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    2. Entrada
                  </label>
                  <input
                    type="text"
                    value={entrada}
                    onChange={(e) => setEntrada(e.target.value)}
                    placeholder="Ej: Carpaccio de salmón del sur o pastelera de choclo en greda"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    3. Plato de Fondo
                  </label>
                  <input
                    type="text"
                    value={fondo}
                    onChange={(e) => setFondo(e.target.value)}
                    placeholder="Ej: Lomo vetado Angus con papas rústicas al romero"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    4. Postre
                  </label>
                  <input
                    type="text"
                    value={postre}
                    onChange={(e) => setPostre(e.target.value)}
                    placeholder="Ej: Trilogía dulce artesanal o buffet de postres chilenos"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    5. Trasnoche / Bajón
                  </label>
                  <input
                    type="text"
                    value={trasnoche}
                    onChange={(e) => setTrasnoche(e.target.value)}
                    placeholder="Ej: Mini hamburguesas brioche caseras y consomé caliente"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar y Crear Menú</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
