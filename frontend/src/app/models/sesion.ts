/** Roles del sistema (iguales a la tabla roles del backend). */
export type Rol = 'ADMINISTRADOR' | 'ASESOR' | 'CLIENTE';

/** Opcion del menu devuelta por el backend (RF-002). */
export interface MenuOpcion {
  codigo: string;
  nombre: string;
  ruta: string;
}

/** Respuesta de POST /auth/login. */
export interface LoginRs {
  token: string;
  tipoToken: string;
  minutosInactividad: number;
  idUsuario: number;
  nombre: string;
  email: string;
  rol: Rol;
  menu: MenuOpcion[];
}

/** Datos del usuario que inicio sesion; se guardan en localStorage. */
export interface UsuarioSesion {
  idUsuario: number;
  nombre: string;
  email: string;
  rol: Rol;
  minutosInactividad: number;
}

/** Respuesta generica del backend para guardar, actualizar o cambiar estado. */
export interface RespuestaRs {
  exito: boolean;
  mensaje: string;
  id?: number;
}

/** Respuesta de "olvidé mi contraseña". El código solo viene en desarrollo. */
export interface RecuperacionRs {
  exito: boolean;
  mensaje: string;
  codigo?: string;
  minutosVigencia?: number;
}

/** Error devuelto por el GlobalExceptionHandler del backend. */
export interface ErrorRs {
  status: number;
  error: string;
  message: string;
}
