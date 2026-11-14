export type EstadoProspecto = 'NUEVO' | 'CONTACTADO' | 'INTERESADO' | 'CERRADO' | 'DESCARTADO';

export const ESTADOS_PROSPECTO: EstadoProspecto[] = ['NUEVO', 'CONTACTADO', 'INTERESADO', 'CERRADO', 'DESCARTADO'];

export interface Prospecto {
  idCliente: number;
  idUsuario: number;
  nombre: string;
  email: string;
  empresa: string;
  puntaje: number;
  estadoProspecto: EstadoProspecto;
  fechaClasificacion: string;
  idAsesor: number | null;
  nombreAsesor: string | null;
  ultimaActividad: string | null;
}

export interface Ingreso {
  idIngreso: number;
  idUsuario: number;
  fechaHora: string;
}

export interface Actividad {
  idActividad: number;
  idCliente: number;
  tipoEvento: string;
  fechaHora: string;
  urlVisitada: string | null;
  tiempoPermanenciaSeg: number;
  scoringInteres: number;
}

export interface Seguimiento {
  idSeguimiento: number;
  idCliente: number;
  nombreCliente: string;
  empresa: string;
  idAsesor: number;
  nombreAsesor: string;
  fechaSeguimiento: string;
  medio: 'LLAMADA' | 'CORREO';
  observaciones: string;
}

/** Detalle de actividad de un prospecto (RF-010). */
export interface ActividadProspecto {
  prospecto: Prospecto;
  totalIngresos: number;
  ingresos: Ingreso[];
  actividades: Actividad[];
  seguimientos: Seguimiento[];
  mensaje?: string;
}

export interface SeguimientoRq {
  idCliente: number;
  medio: 'LLAMADA' | 'CORREO';
  observaciones: string;
}

export interface CambiarEstadoProspectoRq {
  idCliente: number;
  estado: EstadoProspecto;
  confirmar?: boolean;
}

export interface AsignarProspectoRq {
  idCliente: number;
  idAsesor: number;
}
