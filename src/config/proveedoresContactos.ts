import { ProveedorContactoInsumo } from '../types';

/**
 * Directorio de Proveedores Oficiales de Insumos & Materia Prima con Datos de Contacto de Pedidos
 * Diseñado para coordinación rápida por WhatsApp, llamada o correo electrónico institucional.
 */
export const PROVEEDORES_INSUMOS_INICIALES: ProveedorContactoInsumo[] = [
  {
    id: 'prov-frigorifico-central',
    nombre: 'Frigorífico Central',
    categoriaPrincipal: 'Carnes de Vacuno & Cortes Angus',
    contactoNombre: 'Rodrigo Morales (Ejecutivo Carnes & Mayorista)',
    telefonoPedidos: '+56 9 7845 1209',
    emailPedidos: 'pedidos@frigorificocentral.cl',
    direccion: 'Mercado Lo Valledor, Pabellón Carnes C-14, Pedro Aguirre Cerda, Santiago',
    rut: '76.842.110-3',
    horarioCortePedido: 'Pedidos hasta las 15:00 hrs para entrega al día siguiente (Lun a Sáb)',
    condicionesPago: 'Transferencia al despacho o 15 días con factura'
  },
  {
    id: 'prov-carnes-sur',
    nombre: 'Carnes del Sur',
    categoriaPrincipal: 'Cerdo, Costillares & Cecinas Artesanales',
    contactoNombre: 'Marcela Fuentes (Ventas Distribución)',
    telefonoPedidos: '+56 9 6523 9081',
    emailPedidos: 'despachos@carnesdelsur.cl',
    direccion: 'Av. El Salto 3420, Recoleta, Santiago',
    rut: '77.104.992-K',
    horarioCortePedido: 'Pedidos con 24 horas de anticipación',
    condicionesPago: 'Transferencia bancaria contra entrega'
  },
  {
    id: 'prov-avicola-santa-rosa',
    nombre: 'Avícola Santa Rosa',
    categoriaPrincipal: 'Aves, Pechugas Fileteadas & Pavo',
    contactoNombre: 'Esteban Valenzuela (Despacho Horeca)',
    telefonoPedidos: '+56 9 8214 5532',
    emailPedidos: 'horeca@avicolasantarosa.cl',
    direccion: 'Camino Santa Rosa Parcela 18, Paine, Región Metropolitana',
    rut: '76.329.814-5',
    horarioCortePedido: 'Pedidos hasta las 17:00 hrs',
    condicionesPago: 'Crédito quincenal / Transferencia electrónica'
  },
  {
    id: 'prov-magallanes-gourmet',
    nombre: 'Magallanes Gourmet',
    categoriaPrincipal: 'Cordero Magallánico, Jabalí & Carnes de Caza',
    contactoNombre: 'Ignacio Sotomayor (Director Comercial)',
    telefonoPedidos: '+56 9 9128 4470',
    emailPedidos: 'ventas@magallanesgourmet.cl',
    direccion: 'Av. Las Condes 10450, Of. 302, Santiago',
    rut: '76.994.201-1',
    horarioCortePedido: 'Pedidos con 48 horas de anticipación (refrigerado especial)',
    condicionesPago: '50% reserva de corte, 50% al despacho'
  },
  {
    id: 'prov-la-caleta',
    nombre: 'La Caleta Pescados',
    categoriaPrincipal: 'Salmón Premium, Atún Rojo & Pescados de Roca',
    contactoNombre: 'Patricio Henríquez (Maestro Pescador & Ventas)',
    telefonoPedidos: '+56 9 7311 8845',
    emailPedidos: 'pedidos@lacaletapescados.cl',
    direccion: 'Terminal Pesquero Metropolitano, Local 22, Lo Espejo, Santiago',
    rut: '78.502.610-8',
    horarioCortePedido: 'Corte a las 05:00 AM para entrega fresca antes del mediodía',
    condicionesPago: 'Transferencia inmediata contra recepción de guía'
  },
  {
    id: 'prov-mariscos-australes',
    nombre: 'Mariscos & Ostras Australes',
    categoriaPrincipal: 'Ostiones Vivos, Ostras & Camarones Ecuatorianos',
    contactoNombre: 'Loreto Bravo (Atención Banqueterías)',
    telefonoPedidos: '+56 9 8450 6721',
    emailPedidos: 'eventos@mariscosaustrales.cl',
    direccion: 'Av. Américo Vespucio Sur 1450, Cerrillos, Santiago',
    rut: '77.419.003-9',
    horarioCortePedido: 'Pedidos antes de las 13:00 hrs',
    condicionesPago: 'Transferencia bancaria'
  },
  {
    id: 'prov-la-vega-central',
    nombre: 'La Vega Central',
    categoriaPrincipal: 'Verduras Frescas, Hortalizas & Tubérculos',
    contactoNombre: 'Don Manuel Araya (Puesto 142 Sector Chacareros)',
    telefonoPedidos: '+56 9 9345 8122',
    emailPedidos: 'pedidos.araya@vegacentral.cl',
    direccion: 'La Vega Central, Galpón 4 Chacareros, Recoleta, Santiago',
    rut: '12.482.915-4',
    horarioCortePedido: 'Despacho matutino 06:00 a 09:00 AM',
    condicionesPago: 'Efectivo o transferencia contra entrega'
  },
  {
    id: 'prov-frutos-valle',
    nombre: 'Frutos del Valle',
    categoriaPrincipal: 'Frutas Gourmet, Berries, Aguacates & Cítricos',
    contactoNombre: 'Camila Reyes (Distribución Banquetería)',
    telefonoPedidos: '+56 9 7190 2341',
    emailPedidos: 'ventas@frutosdelvalle.cl',
    direccion: 'Camino Melipilla Km 12, Maipú, Santiago',
    rut: '76.810.450-7',
    horarioCortePedido: 'Pedidos antes de las 18:00 hrs para despacho siguiente día',
    condicionesPago: 'Transferencia bancaria'
  },
  {
    id: 'prov-lacteos-sur',
    nombre: 'Lácteos del Sur',
    categoriaPrincipal: 'Quesos Madurados, Crema Fresca & Mantequilla',
    contactoNombre: 'Andrés Villalobos (Ejecutivo Canal Gastronomía)',
    telefonoPedidos: '+56 9 8654 3190',
    emailPedidos: 'pedidos@lacteosdelsur.cl',
    direccion: 'Panamericana Norte 6500, Quilicura, Santiago',
    rut: '76.120.300-4',
    horarioCortePedido: 'Lunes, miércoles y viernes',
    condicionesPago: 'Factura 30 días con orden de compra'
  },
  {
    id: 'prov-huevos-colina',
    nombre: 'Huevos de Campo Colina',
    categoriaPrincipal: 'Huevos de Gallina Libre (Cajas de 180 unidades)',
    contactoNombre: 'Gonzalo Silva (Despachos Directos)',
    telefonoPedidos: '+56 9 9882 1430',
    emailPedidos: 'huevoscolina@gmail.com',
    direccion: 'Camino Chicureo Parcela 8, Colina, Región Metropolitana',
    rut: '14.920.118-2',
    horarioCortePedido: 'Entrega martes y jueves en recinto',
    condicionesPago: 'Transferencia contra entrega'
  },
  {
    id: 'prov-mayorista-gourmet',
    nombre: 'Distribuidora Mayorista Gourmet',
    categoriaPrincipal: 'Aceites de Oliva, Arroces, Especias & Abarrotes',
    contactoNombre: 'Felipe Santelices (Ventas Banquetería)',
    telefonoPedidos: '+56 9 7433 9901',
    emailPedidos: 'compras@mayoristagourmet.cl',
    direccion: 'Av. Marathon 2890, Macul, Santiago',
    rut: '77.890.312-5',
    horarioCortePedido: 'Lunes a Viernes 08:30 a 17:00 hrs',
    condicionesPago: 'Línea de crédito 30 días o transferencia'
  },
  {
    id: 'prov-vina-maipo',
    nombre: 'Viña Maipo & Licores Premium',
    categoriaPrincipal: 'Vinos de Autor, Espumantes & Destilados Importados',
    contactoNombre: 'Sebastián Undurraga (Sommelier & Cuentas VIP)',
    telefonoPedidos: '+56 9 8112 7709',
    emailPedidos: 'eventos@licoresmaipo.cl',
    direccion: 'Valle del Maipo, Camino Isla de Maipo 310, Talagante',
    rut: '76.430.880-9',
    horarioCortePedido: 'Pedidos con 72 hrs de anticipación para maridaje y consignación',
    condicionesPago: 'Opción de consignación por botellas cerradas no abiertas'
  },
  {
    id: 'prov-panaderia-finca',
    nombre: 'Panadería Tradicional Finca',
    categoriaPrincipal: 'Masa Madre, Baguettes, Mini Panes & Tapaditos',
    contactoNombre: 'Marta Poblete (Maestra Panadera)',
    telefonoPedidos: '+56 9 6780 4321',
    emailPedidos: 'panaderiafinca@gmail.com',
    direccion: 'Calle Prat 450, Buin, Región Metropolitana',
    rut: '11.834.720-9',
    horarioCortePedido: 'Pedidos antes de las 12:00 del día anterior (horneado a las 05:00 AM)',
    condicionesPago: 'Transferencia electrónica'
  },
  {
    id: 'prov-pasteleria-dominga',
    nombre: 'Pastelería Artesanal Dominga',
    categoriaPrincipal: 'Postres Gourmet, Tortas de Novios & Macarons',
    contactoNombre: 'Paula Eyzaguirre (Pastry Chef)',
    telefonoPedidos: '+56 9 8721 3490',
    emailPedidos: 'pasteleria@domingaeventos.cl',
    direccion: 'Taller Gastronómico Finca La Toscana, Talagante',
    rut: '77.892.410-K',
    horarioCortePedido: 'Pedidos de repostería fina con 4 días de anticipación',
    condicionesPago: 'Producción interna / Transferencia'
  }
];

/**
 * Busca los datos de contacto de un proveedor o crea una ficha por defecto inteligente.
 */
export function obtenerContactoProveedor(nombreProveedor: string): ProveedorContactoInsumo {
  const normalizado = nombreProveedor.trim().toLowerCase();
  const encontrado = PROVEEDORES_INSUMOS_INICIALES.find(
    p => p.nombre.toLowerCase().includes(normalizado) || normalizado.includes(p.nombre.toLowerCase())
  );

  if (encontrado) {
    return encontrado;
  }

  // Fallback con datos formateados
  return {
    id: `prov-${normalizado.replace(/[^a-z0-9]/g, '-')}`,
    nombre: nombreProveedor,
    categoriaPrincipal: 'Insumos Gastronómicos',
    contactoNombre: 'Ejecutivo de Atención a Banqueterías',
    telefonoPedidos: '+56 9 3118 1304',
    emailPedidos: `pedidos@${normalizado.replace(/[^a-z0-9]/g, '') || 'proveedor'}.cl`,
    direccion: 'Santiago, Región Metropolitana, Chile',
    horarioCortePedido: 'Pedidos con 24 horas de anticipación',
    condicionesPago: 'Transferencia bancaria contra entrega'
  };
}
