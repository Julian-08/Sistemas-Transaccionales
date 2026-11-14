/** Alerta del asesor o del administrador (RF-008, RF-011). */
export interface Alerta {
  idAlerta: number;
  idCliente: number;
  nombreCliente: string;
  empresa: string;
  mensaje: string;
  fechaHora: string;
  leida: boolean;
}

export type EstadoPropuesta = 'ENVIADA' | 'EN_REVISION' | 'ACEPTADA' | 'RECHAZADA';

export interface Propuesta {
  idPropuesta: number;
  idCliente: number;
  nombreCliente: string;
  empresa: string;
  idAsesor: number;
  nombreAsesor: string;
  montoEstimado: number;
  fechaEmision: string;
  estado: EstadoPropuesta;
}

export interface PropuestaRq {
  idCliente: number;
  montoEstimado: number;
}

export type TipoLicencia = 'ILIMITADA' | 'PAGO_POR_USO';
export type Periodo = 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export interface VentaRq {
  idPropuesta: number;
  montoFinal: number;
  tipoLicencia: TipoLicencia;
  periodo: Periodo;
}

export interface Venta {
  idVenta: number;
  idPropuesta: number;
  idCliente: number;
  nombreCliente: string;
  empresa: string;
  idAsesor: number;
  nombreAsesor: string;
  montoFinal: number;
  fechaCierre: string;
  tipoLicencia: TipoLicencia;
  periodo: Periodo;
}

/** Resultado de un reporte (RF-019). */
export interface Reporte {
  tipo: string;
  desde: string;
  hasta: string;
  columnas: string[];
  filas: Record<string, unknown>[];
  mensaje?: string;
}

/** Parametro de configuracion del sistema. */
export interface Configuracion {
  clave: string;
  valor: string;
  descripcion: string;
  fechaActualizacion: string;
}
