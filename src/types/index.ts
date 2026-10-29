export interface MenuOption {
  id: string;
  nombre: string;
  categoria: 'formal' | 'campestre' | 'cocktail' | 'premium';
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
}

export interface InsumoMaestro {
  id: string;
  nombre: string;
  categoria: 'carnes' | 'pescados' | 'verduras_frutas' | 'lacteos_huevos' | 'abarrotes' | 'licores_bebidas' | 'panaderia_pasteleria';
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
  tiempoMenu: 'coctel' | 'entrada' | 'fondo' | 'postre' | 'trasnoche' | 'coffee-break';
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
}

export interface ResumenFinanciero {
  costoMenu: number;
  costoPersonal: number;
  costoProveedores: number;
  costoDecoracion: number;
  costoTotalReal: number;
  costoPorInvitado: number;
  margenPorcentaje: number;
  utilidadProyectada: number;
  precioVentaNeto: number;
  ivaMonto: number;
  precioVentaTotal: number;
  precioVentaPorInvitado: number;
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
