/** Registro de un cliente (publico o creado por el administrador). */
export interface RegistroClienteRq {
  nombre: string;
  email: string;
  contrasena: string;
  empresa: string;
}

/** Cliente visto por el administrador. */
export interface ClienteAdmin {
  idCliente: number;
  idUsuario: number;
  nombre: string;
  email: string;
  empresa: string;
  estado: 'ACTIVO' | 'INACTIVO';
  puntaje: number;
  esProspecto: boolean;
  estadoProspecto: string | null;
  idAsesor: number | null;
  nombreAsesor: string | null;
  fechaRegistro: string;
  ultimoIngreso: string | null;
  ingresosPeriodo: number;
  tieneLicencia: boolean;
  diasSinIngresar: number;
  inactivable: boolean;
}

/** Cliente listo para ofrecerle el plan de pago. */
export interface ClienteCalificado {
  idCliente: number;
  idUsuario: number;
  nombre: string;
  email: string;
  empresa: string;
  puntaje: number;
  esProspecto: boolean;
  estadoProspecto: string | null;
  idAsesor: number | null;
  nombreAsesor: string | null;
  ingresosPeriodo: number;
  ultimoIngreso: string;
  pruebaVigente: boolean;
  fechaVencimientoPrueba: string | null;
  tieneLicencia: boolean;
}

/** Prueba gratuita de Zimbra. */
export interface Prueba {
  idPrueba: number;
  fechaInicio: string;
  diasPrueba: number;
  fechaVencimiento: string;
  vigente: boolean;
  diasRestantes: number;
}

/** Perfil del cliente (sin puntaje, RNF-004). */
export interface PerfilCliente {
  idCliente: number;
  nombre: string;
  email: string;
  empresa: string;
  fechaRegistro: string;
  pruebaVigente: Prueba | null;
}

/** Evento de navegacion del cliente (RF-005). */
export interface ActividadRq {
  tipoEvento: 'VISITA_WEB' | 'EMAIL' | 'FORMULARIO';
  urlVisitada?: string;
  tiempoPermanenciaSeg: number;
}
