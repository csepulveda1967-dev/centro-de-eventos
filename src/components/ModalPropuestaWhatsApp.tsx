import React, { useState } from 'react';
import { CotizacionState, MenuOption, ProveedorServicio, EstiloDecoracion, EmpresaCliente, RecetaFichaTecnica, InsumoMaestro } from '../types';
import { formatMoneda, formatFechaEsp } from '../utils/formatters';
import { minutaATexto, construirMinutaConFichas } from '../utils/minutaHelper';
import { calcularCostoReceta } from '../config/insumosYRecetas';
import { MessageCircle, Copy, Check, ExternalLink, X, Settings2, Sparkles, Send, PhoneCall } from 'lucide-react';

interface ModalPropuestaWhatsAppProps {
  cotizacion: CotizacionState;
  menu: MenuOption;
  proveedores: ProveedorServicio[];
  estiloDecoracion?: EstiloDecoracion;
  precioVentaNeto: number;
  ivaMonto: number;
  precioVentaTotal: number;
  empresaActiva: EmpresaCliente;
  onClose: () => void;
  recetas?: RecetaFichaTecnica[];
  insumos?: InsumoMaestro[];
}

export const ModalPropuestaWhatsApp: React.FC<ModalPropuestaWhatsAppProps> = ({
  cotizacion,
  menu,
  proveedores,
  estiloDecoracion,
  precioVentaNeto,
  ivaMonto,
  precioVentaTotal,
  empresaActiva,
  onClose,
  recetas = [],
  insumos = []
}) => {
  // Opciones de personalización del mensaje
  const [incluirTiemposMenu, setIncluirTiemposMenu] = useState(true);
  const [incluirProveedores, setIncluirProveedores] = useState(true);
  const [incluirStaff, setIncluirStaff] = useState(true);
  const [incluirCondiciones, setIncluirCondiciones] = useState(
    cotizacion.mostrarCondicionesPago ?? ((cotizacion.condicionesPagoPersonalizadas || '').trim().length > 0)
  );
  const [incluirDatosBanco, setIncluirDatosBanco] = useState(true);
  
  // Destinatario: cliente (+56 9 ...), Empresa activa (ej: Damaris +56 9 6841 1419 o Dominga) o personalizado
  const [tipoDestino, setTipoDestino] = useState<'cliente' | 'empresa' | 'manual'>('cliente');
  const [telefonoManual, setTelefonoManual] = useState(cotizacion.telefonoCliente || '');
  const [copiado, setCopiado] = useState(false);

  const esDamaris = empresaActiva.id === 'emp-damaris' || empresaActiva.nombre.toLowerCase().includes('damaris');
  const esDominga = empresaActiva.id === 'emp-dominga' || empresaActiva.nombre.toLowerCase().includes('dominga');

  const telefonoEmpresaFormateado = esDamaris
    ? '+56 9 6841 1419'
    : (empresaActiva.telefono || (esDominga ? '+56 9 6236 0766' : '+56 9 3118 1304'));

  const telefonoEmpresaLimpio = esDamaris
    ? '56968411419'
    : (telefonoEmpresaFormateado.replace(/\D/g, '') || '56931181304');

  const proveedoresActivos = proveedores.filter(p => cotizacion.proveedoresSeleccionados[p.id]);

  const porcentajeAnticipo = cotizacion.porcentajeAnticipo ?? 40;
  const esquemaPago = cotizacion.esquemaPago ?? 'dos_pagos';
  const hito2Porcentaje = cotizacion.hito2Porcentaje ?? 30;
  const diasSaldo = cotizacion.diasSaldo ?? 7;
  const diasConfirmacionComensales = cotizacion.diasConfirmacionComensales ?? 10;
  const validezDias = cotizacion.validezDias ?? 15;
  const metodoPago = cotizacion.metodoPago ?? 'transferencia';
  const detalleMetodoPago = (cotizacion.detalleMetodoPago || '').trim();
  const condicionesPagoTexto = (cotizacion.condicionesPagoPersonalizadas || '').trim();
  const mostrarCondicionesPago = cotizacion.mostrarCondicionesPago ?? (condicionesPagoTexto.length > 0);
  const modoCondicionesPago = cotizacion.modoCondicionesPago ?? 'manual';
  const puedeIncluirCondiciones = modoCondicionesPago === 'auto' || condicionesPagoTexto.length > 0;
  const metodoPagoLabel: Record<string, string> = {
    transferencia: 'Transferencia bancaria',
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta de débito / crédito',
    cheque: 'Cheque',
    otro: 'Otro / Mixto'
  };
  const esUnPago = esquemaPago === 'un_pago';
  const esTresPagos = esquemaPago === 'tres_pagos';
  const esCuatroPagos = esquemaPago === 'cuatro_pagos';
  const esCorporativo = esquemaPago === 'corporativo';
  const esPersonalizado = esquemaPago === 'personalizado';

  const totalAPagar = cotizacion.aplicaIva ? precioVentaTotal : precioVentaNeto;
  const valorPorPersona = Math.round(totalAPagar / Math.max(1, cotizacion.invitados));
  const montoPie = esUnPago ? totalAPagar : Math.round(totalAPagar * (porcentajeAnticipo / 100));
  const montoHito2 = esTresPagos ? Math.round(totalAPagar * (hito2Porcentaje / 100)) : 0;
  const saldoRestante = esUnPago ? 0 : Math.max(0, totalAPagar - montoPie - montoHito2);
  const cuotaCuatroPagos = Math.round(Math.max(0, totalAPagar - montoPie) / 3);

  // Limpiar número de teléfono para wa.me (remover +, espacios, guiones)
  const limpiarNumero = (num: string) => {
    const digitos = num.replace(/\D/g, '');
    if (digitos.startsWith('56') && digitos.length >= 11) return digitos;
    if (digitos.length === 9) return `56${digitos}`;
    return digitos;
  };

  const getNumeroDestino = () => {
    if (tipoDestino === 'empresa') return telefonoEmpresaLimpio;
    if (tipoDestino === 'cliente') {
      return limpiarNumero(cotizacion.telefonoCliente) || telefonoEmpresaLimpio;
    }
    return limpiarNumero(telefonoManual);
  };

  // Generador dinámico del texto de WhatsApp
  const generarTextoMensaje = () => {
    let msg = `🍷 *PROPUESTA DE EVENTO & BANQUETERÍA EXCLUSIVA* 🍷\n`;
    msg += `*${empresaActiva.nombre.toUpperCase()}* · _${empresaActiva.subtitulo}_\n\n`;

    msg += `Estimad@(s) *${cotizacion.cliente || 'Estimado Cliente'}*,\n`;
    msg += `Es un placer presentarle la propuesta formal para su celebración:\n\n`;

    msg += `📌 *DETALLES GENERALES:*\n`;
    msg += `• *Tipo de Evento:* ${cotizacion.tipoEvento}\n`;
    msg += `• *Fecha:* ${formatFechaEsp(cotizacion.fechaEvento)}\n`;
    msg += `• *Recinto:* ${empresaActiva.recintoPrincipal} (${empresaActiva.ciudad})\n`;
    msg += `• *Comensales:* ${cotizacion.invitados} invitados confirmados\n\n`;

    msg += `🍽️ *MENÚ GASTRONÓMICO: ${menu.nombre.toUpperCase()}*\n`;
    if (menu.itemsPorPersona && menu.itemsPorPersona.length > 0) {
      msg += `• *Consumos Exactos por Comensal (${cotizacion.invitados} Pax):*\n`;
      menu.itemsPorPersona.forEach(it => {
        const total = it.cantidadPorPersona * cotizacion.invitados;
        msg += `  - ${it.nombre}: ${it.cantidadPorPersona} ${it.unidad} p.p. (Total: ${total} ${it.unidad}s)\n`;
      });
      msg += `\n`;
    } else if (incluirTiemposMenu) {
      // Minuta con tiempos + fichas vinculadas (sin doble digitación)
      // Respeta tiempos ocultos manualmente por el usuario
      const minuta = construirMinutaConFichas(menu, recetas, insumos);
      const visibles = minuta.filter(t => !t.ocultoManual && t.tieneContenido);
      if (visibles.length > 0) {
        const etiquetaTiempo: Record<string, string> = {
          coctel: 'Cóctel de Entrada',
          entrada: 'Entrada Gourmet',
          fondo: 'Plato Principal',
          postre: 'Mesa de Postres',
          trasnoche: 'Trasnoche'
        };
        visibles.forEach(t => {
          const etiqueta = etiquetaTiempo[t.tiempoId] || t.tiempoLabel;
          const partes: string[] = [];

          // Evitar duplicación: si el texto manual coincide con el nombre de la ficha, mostrar UNA sola vez
          const textoNorm = t.textoManual.trim().toLowerCase();
          const fichasDiferentes = t.fichas.filter(f => f.nombre.trim().toLowerCase() !== textoNorm);
          const fichasIguales = t.fichas.filter(f => f.nombre.trim().toLowerCase() === textoNorm);

          if (fichasIguales.length > 0 && t.textoManual && fichasDiferentes.length === 0) {
            // Solo mostrar una vez con su costo
            const fichasTxt = fichasIguales.map(f => {
              const calc = calcularCostoReceta(f, insumos);
              return `${f.nombre} (${formatMoneda(calc.costoPorPorcion)}/porción)`;
            }).join(', ');
            msg += `• *${etiqueta}:* ${fichasTxt}\n`;
            return;
          }

          if (t.textoManual) partes.push(t.textoManual);
          if (fichasDiferentes.length > 0) {
            const fichasTxt = fichasDiferentes.map(f => f.nombre).join(', ');
            partes.push(`Fichas: ${fichasTxt}`);
          } else if (fichasIguales.length > 0 && !t.textoManual) {
            const fichasTxt = t.fichas.map(f => f.nombre).join(', ');
            partes.push(`Fichas: ${fichasTxt}`);
          }
          if (partes.length > 0) {
            msg += `• *${etiqueta}:* ${partes.join(' · ')}\n`;
          }
        });
        msg += `\n`;
      } else {
        msg += `_${menu.descripcion}_\n\n`;
      }
    } else {
      msg += `_${menu.descripcion}_\n\n`;
    }

    if (incluirStaff) {
      const hayPersonal = (cotizacion.personal.garzones + cotizacion.personal.cocineros + cotizacion.personal.aseo + cotizacion.personal.maitre) > 0;
      if (hayPersonal) {
        msg += `👨‍🍳 *BRIGADA DE SERVICIO INCLUIDA:*\n`;
        if (cotizacion.personal.garzones > 0) msg += `• ${cotizacion.personal.garzones} Garzones de salón\n`;
        if (cotizacion.personal.cocineros > 0) msg += `• ${cotizacion.personal.cocineros} Chefs / Cocineros\n`;
        if (cotizacion.personal.aseo > 0) msg += `• ${cotizacion.personal.aseo} Auxiliares de aseo\n`;
        if (cotizacion.personal.maitre > 0) msg += `• ${cotizacion.personal.maitre} Maître de sala y supervisión\n`;
        msg += `\n`;
      }
    }

    if (incluirProveedores && (proveedoresActivos.length > 0 || (estiloDecoracion && estiloDecoracion.id !== 'sin-decoracion' && estiloDecoracion.costoFijo > 0))) {
      msg += `✨ *SERVICIOS & EQUIPAMIENTO COMPLEMENTARIO:*\n`;
      proveedoresActivos.forEach(p => {
        msg += `• ${p.nombre}\n`;
      });
      if (estiloDecoracion && estiloDecoracion.id !== 'sin-decoracion' && estiloDecoracion.costoFijo > 0) {
        msg += `• Ambientación: ${estiloDecoracion.nombre}\n`;
      }
      msg += `\n`;
    }

    msg += `💰 *VALORES & PRESUPUESTO:* (Valores en Pesos Chilenos CLP)\n`;
    msg += `• *Subtotal Neto:* ${formatMoneda(precioVentaNeto)}\n`;
    if (cotizacion.aplicaIva) {
      msg += `• *IVA (19%):* ${formatMoneda(ivaMonto)}\n`;
      msg += `• *TOTAL GENERAL (con IVA):* ${formatMoneda(precioVentaTotal)}\n`;
    } else {
      msg += `• *TOTAL GENERAL (Neto):* ${formatMoneda(precioVentaNeto)}\n`;
    }
    msg += `• *Valor por Invitado:* ${formatMoneda(valorPorPersona)} / comensal\n\n`;

    if (incluirCondiciones && puedeIncluirCondiciones) {
      if (modoCondicionesPago === 'manual') {
        msg += `📋 *CONDICIONES DE PAGO:*\n`;
        condicionesPagoTexto
          .split(/\r?\n/)
          .map((linea) => linea.trim())
          .filter(Boolean)
          .forEach((linea) => { msg += `${linea}\n`; });
        msg += `\n`;
      } else {
        msg += `📋 *POLÍTICA DE RESERVA Y PAGOS:*\n`;
        if (esUnPago) {
          msg += `1️⃣ *Pago Único (100%):* ${formatMoneda(totalAPagar)} (Al reservar o confirmar la fecha)\n`;
        } else {
          msg += `1️⃣ *Anticipo ${porcentajeAnticipo}%:* ${formatMoneda(montoPie)} (Bloquea exclusividad de la fecha)\n`;
          if (esTresPagos) {
            msg += `2️⃣ *Segundo Pago (${hito2Porcentaje}%):* ${formatMoneda(montoHito2)} (Tras degustación y aprobación de montaje)\n`;
            msg += `3️⃣ *Saldo Final (${Math.max(0, 100 - porcentajeAnticipo - hito2Porcentaje)}%):* ${formatMoneda(saldoRestante)} (Hasta ${diasSaldo} días antes del evento)\n`;
          } else if (esCuatroPagos) {
            msg += `2️⃣ *Saldo en 3 cuotas (${100 - porcentajeAnticipo}%):* 3 pagos de ${formatMoneda(cuotaCuatroPagos)} (Última cuota hasta ${diasSaldo} días antes del evento)\n`;
          } else if (esCorporativo) {
            msg += `2️⃣ *Saldo Restante (${100 - porcentajeAnticipo}%):* ${formatMoneda(saldoRestante)} (Contra factura a 30 días con Orden de Compra aprobada)\n`;
          } else if (esPersonalizado) {
            msg += `2️⃣ *Saldo Restante (${100 - porcentajeAnticipo}%):* ${formatMoneda(saldoRestante)} (Según las condiciones acordadas)\n`;
          } else {
            msg += `2️⃣ *Saldo ${100 - porcentajeAnticipo}%:* ${formatMoneda(saldoRestante)} (Hasta ${diasSaldo} días antes del evento)\n`;
          }
        }
        msg += `• *Forma de pago:* ${metodoPagoLabel[metodoPago] || 'A convenir'}${detalleMetodoPago ? ` — ${detalleMetodoPago}` : ''}\n`;
        if (condicionesPagoTexto) msg += `• ${condicionesPagoTexto}\n`;
        msg += `• Confirmación de comensales con un mínimo de ${diasConfirmacionComensales} días de anticipación.\n`;
        msg += `• Cotización con validez de ${validezDias} días continuos.\n\n`;
      }
    }

    if (incluirDatosBanco && metodoPago === 'transferencia') {
      const db = empresaActiva.datosBancarios;
      if (db && (db.razonSocial || db.numeroCuenta)) {
        msg += `🏦 *DATOS DE TRANSFERENCIA BANCARIA:*\n`;
        if (db.razonSocial) msg += `• Razón Social: ${db.razonSocial}\n`;
        if (db.rut) msg += `• RUT: ${db.rut}\n`;
        if (db.banco) msg += `• Banco: ${db.banco}\n`;
        if (db.tipoCuenta) msg += `• Tipo de Cuenta: ${db.tipoCuenta}\n`;
        if (db.numeroCuenta) msg += `• N° Cuenta: ${db.numeroCuenta}\n`;
        if (db.titular) msg += `• Titular: ${db.titular}\n`;
        msg += `• Correo Comprobantes: ${db.emailTransferencia || empresaActiva.email}\n\n`;
      } else {
        msg += `🏦 *DATOS DE TRANSFERENCIA:* A confirmar por la empresa.\n\n`;
      }
    }

    msg += `¿Coordinamos una llamada o visita técnica al recinto para degustación?\n`;
    msg += `Quedamos a su entera disposición,\n`;
    msg += `*${empresaActiva.nombre}*\n`;
    msg += `📲 WhatsApp Directo: ${telefonoEmpresaFormateado}\n`;
    msg += `✉️ ${empresaActiva.email}`;

    return msg;
  };

  const textoMensaje = generarTextoMensaje();
  const numeroDestino = getNumeroDestino();
  const urlWhatsApp = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(textoMensaje)}`;

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(textoMensaje);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback si clipboard falla
      const textarea = document.createElement('textarea');
      textarea.value = textoMensaje;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        
        {/* Cabecera modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-2 ring-white/20">
              <MessageCircle className="w-5 h-5 fill-white text-emerald-800" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight flex items-center gap-2">
                <span>Enviar Propuesta Formal por WhatsApp</span>
                <span className="text-[10px] uppercase font-bold bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  1 Clic
                </span>
              </h2>
              <p className="text-xs text-emerald-200/90">
                Texto estructurado con valores CLP, tiempos del menú y condiciones comerciales
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido en dos columnas: Opciones y Vista previa */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50">
          
          {/* Columna Izquierda: Configuración de Destinatario y Módulos */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Destinatario */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                Destinatario de Envío
              </span>

              <div className="space-y-2">
                <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="destino"
                    checked={tipoDestino === 'cliente'}
                    onChange={() => setTipoDestino('cliente')}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <span className="font-semibold block">Cliente del Evento</span>
                    <span className="text-[11px] text-slate-500">
                      {cotizacion.telefonoCliente ? `${cotizacion.cliente} (${cotizacion.telefonoCliente})` : 'Sin teléfono asignado'}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="destino"
                    checked={tipoDestino === 'empresa'}
                    onChange={() => setTipoDestino('empresa')}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <span className="font-semibold block">{empresaActiva.nombre} (Comercial)</span>
                    <span className="text-[11px] text-emerald-700 font-bold">{telefonoEmpresaFormateado}</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="destino"
                    checked={tipoDestino === 'manual'}
                    onChange={() => setTipoDestino('manual')}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div className="flex-1">
                    <span className="font-semibold block">Ingresar otro número</span>
                    {tipoDestino === 'manual' && (
                      <input
                        type="tel"
                        value={telefonoManual}
                        onChange={(e) => setTelefonoManual(e.target.value)}
                        placeholder="Ej: +56 9 9876 5432"
                        className="mt-1 w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Módulos a Incluir */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                Personalizar Contenido
              </span>

              <div className="space-y-2 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirTiemposMenu}
                    onChange={(e) => setIncluirTiemposMenu(e.target.checked)}
                    className="rounded-md accent-emerald-600"
                  />
                  <span>Desglose de tiempos (Cóctel, Entrada, Fondo, Postre)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirStaff}
                    onChange={(e) => setIncluirStaff(e.target.checked)}
                    className="rounded-md accent-emerald-600"
                  />
                  <span>Detalle de Brigada (Garzones, Cocineros, Maître)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirProveedores}
                    onChange={(e) => setIncluirProveedores(e.target.checked)}
                    className="rounded-md accent-emerald-600"
                  />
                  <span>Servicios y técnica seleccionada ({proveedoresActivos.length} ítems)</span>
                </label>

                <label className={`flex items-center gap-2 ${puedeIncluirCondiciones ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    checked={incluirCondiciones}
                    onChange={(e) => setIncluirCondiciones(e.target.checked)}
                    disabled={!puedeIncluirCondiciones}
                    className="rounded-md accent-emerald-600"
                  />
                  <span>
                    {modoCondicionesPago === 'manual'
                      ? puedeIncluirCondiciones
                        ? 'Condiciones de pago (texto escrito en Adm. Costos)'
                        : 'Condiciones de pago (sin texto en Adm. Costos)'
                      : `Condiciones de pago (${esUnPago ? 'Pago único 100%' : `Anticipo ${porcentajeAnticipo}% y saldo ${100 - porcentajeAnticipo}%`})`}
                  </span>
                </label>

                {!mostrarCondicionesPago && puedeIncluirCondiciones && (
                  <p className="text-[10px] text-slate-400 italic">
                    Las condiciones están desactivadas en Adm. Costos. Marca la casilla si quieres incluirlas solo en este envío.
                  </p>
                )}

                {!puedeIncluirCondiciones && (
                  <p className="text-[10px] text-amber-600 italic">
                    Escribe el texto en Adm. Costos → Condiciones de Pago para poder incluirlas.
                  </p>
                )}

                {metodoPago === 'transferencia' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incluirDatosBanco}
                      onChange={(e) => setIncluirDatosBanco(e.target.checked)}
                      className="rounded-md accent-emerald-600"
                    />
                    <span>Datos cuenta bancaria para transferencia</span>
                  </label>
                )}
              </div>
            </div>

            {/* Resumen rápido de importes */}
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div className="flex justify-between font-bold">
                <span>Total a enviar:</span>
                <span className="text-emerald-800 text-sm">{formatMoneda(totalAPagar)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-700">
                <span>{esUnPago ? 'Pago único (100%):' : `Reserva (${porcentajeAnticipo}%):`}</span>
                <span>{formatMoneda(montoPie)}</span>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Vista Previa exacta de WhatsApp */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Vista Previa del Mensaje
              </span>
              <span className="text-[11px] text-slate-400">
                Listo para enviar
              </span>
            </div>

            {/* Simulación de chat de WhatsApp */}
            <div className="flex-1 bg-[#ECE5DD] p-4 rounded-2xl border border-[#DAD3CC] shadow-inner overflow-y-auto max-h-[380px] sm:max-h-[440px]">
              <div className="bg-white rounded-2xl p-3.5 shadow-sm text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed max-w-md ml-auto border-l-4 border-emerald-500">
                {textoMensaje}
              </div>
            </div>
          </div>

        </div>

        {/* Barra inferior con botones principales */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopiar}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
          >
            {copiado ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">¡Texto Copiado al Portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Texto Completo</span>
              </>
            )}
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-medium"
            >
              Cerrar
            </button>

            <a
              href={urlWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all"
            >
              <Send className="w-4 h-4 fill-white" />
              <span>Abrir & Enviar por WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
