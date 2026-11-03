export interface MenuItemRatio {
  id: string;
  nombre: string;
  cantidadPorPersona: number; // Ej: 2 para "2 pp", 1.5, etc.
  unidad: string; // 'unidad' | 'porción' | 'vaso' | 'botella' | 'lata' | 'taza' | 'copa' | 'L' | 'g' | 'kg'
  tiempo?: string; // 'coctel' | 'entrada' | 'fondo' | 'postre' | 'trasnoche' | 'bebidas' | libre
  insumoId?: string; // Vinculación opcional a un insumo para compras exactas
  costoUnitario?: number; // Costo por unidad si no está vinculado
  recetaId?: string; // Vinculación a una receta costeada (el costo unitario viene de la ficha técnica)
  recetaNombre?: string; // Nombre de la receta vinculada (para mostrarlo en la tabla de ítems)
}

export interface MenuOption {
  id: string;
  nombre: string;
  categoria: string; // Permite 'formal' | 'campestre' | 'cocktail' | 'premium' o cualquier categoría libre
  costoPersona: number;
  precioSugeridoPersona: number;
  descripcion: string;
  tiempos: {
    coctel: string;
    entrada: string;
    fondo: string;
    postre: string;
    trasnoche: string;
  };
  destacado?: boolean;
  recetasIds?: string[]; // IDs de las recetas vinculadas que componen este menú
  costoCalculadoDesdeRecetas?: boolean;
  // Cantidad de ítems por persona (p.p.) para calcular consumos exactos y compras
  itemsPorPersona?: MenuItemRatio[];
}

export interface InsumoMaestro {
  id: string;
  nombre: string;
  categoria: string; // Permite categorías predefinidas o creadas libremente por el usuario
  unidadMedida: 'kg' | 'g' | 'L' | 'ml' | 'unidad' | 'paquete';
  precioCompra: number; // Costo de compra por unidad base (ej: $14.500 por 1 kg)
  mermaPorcentaje: number; // Factor de merma estimado (ej. 10 para 10%)
  proveedor?: string;
  ultimoCambio?: string;
}

export interface IngredienteReceta {
  id: string; // ID único de la fila en la receta
  insumoId: string;
  cantidad: number; // Cantidad bruta requerida para la porción/receta
  unidad: 'kg' | 'g' | 'L' | 'ml' | 'unidad';
  mermaEspecifica?: number; // Permite sobrescribir la merma del insumo si aplica
}

export interface RecetaFichaTecnica {
  id: string;
  nombre: string;
  tiempoMenu: string; // 'coctel' | 'entrada' | 'fondo' | 'postre' | 'trasnoche' | 'coffee-break' o tiempos personalizados libres
  categoria: string;
  rendimientoPorciones: number; // Para cuántas porciones está costeada esta ficha (normalmente 1 comensal o 10 comensales)
  ingredientes: IngredienteReceta[];
  margenSugerido: number; // Margen gastronómico (sugerido 33% estándar de la industria)
  costoAdicionalElaboracion?: number; // Costo indirecto / gas / condimentos menores
  descripcionProcedimiento?: string;
  menuAsociadoId?: string; // Menú al cual tributa este plato (opcional para banquetes)
  servicioAsociadoId?: string; // Servicio destino en Tarifas Generales (ej: 'coffee-break-cocteleria')
}

export interface StaffTarifas {
  garzonJornada: number;
  cocineroJornada: number;
  aseoJornada: number;
  maitreJornada: number;
  // Ratios sugeridos: 1 garzón cada X invitados, etc.
  ratioGarzon: number;
  ratioCocinero: number;
  ratioAseo: number;
}

export interface ProveedorServicio {
  id: string;
  nombre: string;
  categoria: 'tecnica' | 'ambientacion' | 'vajilla' | 'bar' | 'cobertura' | 'cocteleria';
  tipoCobro: 'fijo' | 'por_persona';
  costo: number; // Costo real del proveedor (por persona o fijo)
  precioVentaSugerido: number;
  descripcion: string;
  iconName: string;
  obligatorio?: boolean;
  // Vinculación a Ficha Técnica de Costeo
  recetaVinculadaId?: string;
  recetaVinculadaNombre?: string;
  costoCalculadoDesdeReceta?: boolean;
  // Datos de contacto directo para pedidos y coordinación
  contactoNombre?: string;
  telefonoPedidos?: string;
  emailPedidos?: string;
  rut?: string;
  plazoAnticipacion?: string;
}

export interface ProveedorContactoInsumo {
  id: string;
  nombre: string; // Ej: Frigorífico Central, La Vega Central
  categoriaPrincipal: string; // Carnes, Verduras, Pescados, Abarrotes, etc.
  contactoNombre: string; // Nombre del ejecutivo de ventas
  telefonoPedidos: string; // WhatsApp y teléfono de despacho
  emailPedidos: string; // Email de compras
  direccion: string; // Dirección física o galpón
  rut?: string;
  horarioCortePedido: string; // Ej: "Hasta las 14:00 hrs para entrega al día siguiente"
  condicionesPago?: string; // Ej: "Transferencia bancaria / 15 días"
}

export interface EstiloDecoracion {
  id: string;
  nombre: string;
  subtitulo: string;
  costoFijo: number;
  precioVentaSugerido: number;
  descripcion: string;
  paleta: string[];
  elementos: string[];
  destacado?: boolean;
  estiloVisual: {
    bgGradient: string;
    borderAccent: string;
    textColor: string;
    tagBg: string;
  };
}

export interface Mesa {
  id: string;
  numero: number;
  nombre: string;
  capacidad: number;
  tipo: 'redonda' | 'imperial' | 'presidencial' | 'infantil';
  zona?: string;
}

export interface CotizacionState {
  id?: string;
  nombreEvento: string;
  cliente: string;
  emailCliente: string;
  telefonoCliente: string;
  tipoEvento: 'Boda' | 'Corporativo' | 'Graduación' | 'Cumpleaños / Aniversario' | 'Fiesta Fin de Año';
  fechaEvento: string;
  invitados: number;
  menuId: string;
  personal: {
    garzones: number;
    cocineros: number;
    aseo: number;
    maitre: number;
  };
  proveedoresSeleccionados: Record<string, boolean>;
  mesas: Mesa[];
  decoracionId: string;
  margenGanancia: number; // ej. 35 para 35%
  aplicaIva: boolean;
  observaciones: string;
  porcentajeAnticipo?: number; // ej. 40 para 40%
  esquemaPago?: 'dos_pagos' | 'tres_pagos' | 'corporativo';
  diasSaldo?: number; // días previos al evento para cancelar el saldo (ej: 7)
  validezDias?: number; // validez de la cotización en días (ej: 15)
  // Gastos fijos operacionales detallados para emprendedores
  gastoLuzMensual?: number; // Cuenta de luz mensual
  gastoGasMensual?: number; // Cuenta de gas mensual (balones, granel, cocina)
  otrosGastosFijos?: ItemGastoFijo[]; // Gastos fijos adicionales agregados a mano
  gastosFijosMensuales?: number; // Total mensual sumado (luz + gas + otros)
  eventosAlMes?: number; // Estimación o promedio de eventos al mes para el prorrateo
  mesActivoCostosFijos?: string; // Mes y año activo seleccionado (ej: "Noviembre 2024")
  historialCostosFijosMensuales?: Record<string, RegistroCostoFijoMensual>; // Registro histórico de facturas por mes
  // Criterio libre del emprendedor (sugerido vs libre elección)
  usarPrecioManual?: boolean; // True si el emprendedor decide ingresar su propio precio final
  precioVentaManual?: number; // Valor final fijado a criterio libre del cliente
}

export interface ItemGastoFijo {
  id: string;
  nombre: string;
  monto: number;
}

export interface RegistroCostoFijoMensual {
  id: string; // Clave única ej: '2025-01' o '2024-11'
  mesNombre: string; // ej: 'Noviembre 2024'
  mesIndex: number; // 0..11
  año: number; // ej: 2024
  gastoLuz: number;
  gastoGas: number;
  otrosGastos: ItemGastoFijo[];
  eventosAlMes: number;
  fechaGuardado: string;
}

export interface ResumenFinanciero {
  costoMenu: number;
  costoPersonal: number;
  costoProveedores: number;
  costoDecoracion: number;
  costosFijosEvento: number; // Costo fijo prorrateado para este evento
  costoFijoPorPersona: number; // Costo fijo asignado por comensal (p.p.)
  gastosFijosMensuales: number;
  gastoLuzMensual: number;
  gastoGasMensual: number;
  otrosGastosFijos: ItemGastoFijo[];
  eventosAlMes: number;
  mesActivoCostosFijos?: string;
  historialCostosFijosMensuales?: Record<string, RegistroCostoFijoMensual>;
  costoVariablesTotal: number; // Suma de Menú + Personal + Proveedores + Decoración
  costoTotalReal: number; // Costos Variables + Costo Fijo Prorrateado
  costoPorInvitado: number;
  margenPorcentaje: number; // Margen referencial sugerido por la plataforma
  utilidadProyectada: number; // Utilidad proyectada con margen sugerido
  precioVentaNeto: number; // Precio sugerido neto
  ivaMonto: number;
  precioVentaTotal: number; // Precio sugerido con/sin IVA
  precioVentaPorInvitado: number; // Precio sugerido por invitado
  // Criterio libre del emprendedor
  usarPrecioManual: boolean;
  precioVentaManual: number;
  precioCobradoFinal: number; // Precio final activo (sugerido o personalizado)
  margenRealObtenido: number; // % margen real obtenido según el precio cobrado
  utilidadRealObtenida: number; // Ganancia líquida real en CLP según el precio cobrado
}

export type PerfilClienteId = 'modelo-base' | 'dominga-eventos' | 'damaris-eventos';

export interface EmpresaCliente {
  id: string;
  nombre: string;
  subtitulo: string;
  recintoPrincipal: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  sitioWeb?: string;
  letraLogo: string;
  colorTema: 'amber' | 'emerald' | 'blue' | 'rose' | 'slate';
  fechaRegistro: string;
  tituloCabecera?: string;
  infraestructura?: string;
  tarifaBaseArriendo?: number;
}

export interface ReservaCalendario {
  id: string;
  empresaId?: string;
  titulo: string;
  cliente: string;
  tipoEvento: string;
  fecha: string; // Formato YYYY-MM-DD
  invitados: number;
  estado: 'confirmado' | 'cotizado' | 'bloqueado' | 'completado';
  montoTotal: number;
  cotizacionSnapshot: CotizacionState;
}
