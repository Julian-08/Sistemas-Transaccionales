/** Usuario visto por el administrador (nunca incluye la contrasena). */
export interface Usuario {
  idUsuario: number;
  nombre: string;
  email: string;
  idRol: number;
  rol: string;
  estado: 'ACTIVO' | 'INACTIVO';
  fechaCreacion: string;
}

/** Crear administrador (idRol 1) o asesor (idRol 2). */
export interface UsuarioRq {
  nombre: string;
  email: string;
  contrasena: string;
  idRol: number;
  metaMensual?: number;
}

/** Editar usuario; la contrasena es opcional. */
export interface UsuarioActualizarRq {
  idUsuario: number;
  nombre: string;
  email: string;
  contrasena?: string;
}

export interface Rol {
  idRol: number;
  nombre: string;
}

/** Asesor comercial con su meta y prospectos asignados. */
export interface Asesor {
  idAsesor: number;
  idUsuario: number;
  nombre: string;
  email: string;
  estado: string;
  metaMensual: number;
  prospectosAsignados: number;
}

/** Panel de estadisticas del asesor (mes actual). */
export interface EstadisticasAsesor {
  prospectosAsignados: number;
  prospectosPorEstado: Record<string, number>;
  clientesCalificados: number;
  alertasNoLeidas: number;
  seguimientosMes: number;
  propuestasAbiertas: number;
  ventasMes: number;
  montoVendidoMes: number;
  metaMensual: number;
  cumplimientoMetaPct: number;
}
