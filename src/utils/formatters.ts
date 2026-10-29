export function formatMoneda(monto: number): string {
  if (isNaN(monto)) return '$ 0';
  return '$ ' + Math.round(monto).toLocaleString('es-CL');
}

export function formatNumero(num: number): string {
  if (isNaN(num)) return '0';
  return Math.round(num).toLocaleString('es-CL');
}

export function formatPorcentaje(valor: number): string {
  return `${Math.round(valor)}%`;
}

export function formatPrecioUnitario(monto: number): string {
  if (isNaN(monto)) return '$ 0';
  if (Number.isInteger(monto)) {
    return '$ ' + monto.toLocaleString('es-CL');
  }
  return '$ ' + monto.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

export function formatFechaEsp(fechaIso: string): string {
  if (!fechaIso) return 'Fecha por definir';
  try {
    const [year, month, day] = fechaIso.split('-').map(Number);
    if (!year || !month || !day) return fechaIso;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return fechaIso;
  }
}
