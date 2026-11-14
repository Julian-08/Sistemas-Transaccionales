import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from 'src/environments/environment';
import { BackendService, CLAVE_TOKEN } from './backend.service';
import { LoginRs, RecuperacionRs, RespuestaRs, Rol, UsuarioSesion } from '../models/sesion';
import { RegistroClienteRq } from '../models/cliente';

const CLAVE_SESION = 'sesion';

/** Ruta inicial de cada rol despues de iniciar sesion (RF-002). */
export const RUTA_INICIO: Record<Rol, string> = {
  ADMINISTRADOR: '/inicio/admin/panel',
  ASESOR: '/inicio/asesor/panel',
  CLIENTE: '/inicio/cliente/mi-cuenta'
};

/**
 * Maneja la sesion del usuario: inicio y cierre, token JWT y datos del rol.
 * El token se guarda en localStorage con la clave "token" (igual que el proyecto de referencia).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly backend = inject(BackendService);
  private readonly router = inject(Router);
  private readonly api = 'auth';

  private readonly sesionActual = signal<UsuarioSesion | null>(this.leerSesion());

  /** Usuario que inicio sesion (null si no hay sesion). */
  readonly sesion = this.sesionActual.asReadonly();
  readonly rol = computed(() => this.sesionActual()?.rol ?? null);

  // ------------------------------------------------------------- peticiones

  login(email: string, contrasena: string): Observable<LoginRs> {
    return this.backend
      .post<LoginRs>(environment.apiUrlAuth, this.api, 'login', { email, contrasena })
      .pipe(tap((rs) => this.guardarSesion(rs)));
  }

  registrar(registro: RegistroClienteRq): Observable<RespuestaRs> {
    return this.backend.post<RespuestaRs>(environment.apiUrlAuth, this.api, 'registro', registro);
  }

  recuperarContrasena(email: string): Observable<RecuperacionRs> {
    return this.backend.post<RecuperacionRs>(environment.apiUrlAuth, this.api, 'recuperar-contrasena', { email });
  }

  restablecerContrasena(email: string, codigo: string, nuevaContrasena: string): Observable<RespuestaRs> {
    return this.backend.post<RespuestaRs>(environment.apiUrlAuth, this.api, 'restablecer-contrasena', {
      email,
      codigo,
      nuevaContrasena
    });
  }

  /** Cierra la sesion en el backend (el token deja de servir) y vuelve al login. */
  cerrarSesion(motivo?: 'expirada' | 'inactividad'): void {
    const terminar = () => {
      this.limpiarSesion();
      this.router.navigate(['/login'], motivo ? { queryParams: { sesion: motivo } } : {});
    };
    if (!this.token) {
      terminar();
      return;
    }
    this.backend.post<RespuestaRs>(environment.apiUrlAuth, this.api, 'cerrar-sesion', {}).subscribe({
      next: terminar,
      error: terminar
    });
  }

  // ------------------------------------------------------------- estado

  get token(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  /** true si hay token y todavia no vence. */
  estaAutenticado(): boolean {
    const token = this.token;
    if (!token || !this.sesionActual()) {
      return false;
    }
    const vence = this.leerVencimiento(token);
    return vence === null || vence > Date.now();
  }

  /** Reemplaza el token por el renovado que envia el backend en cada respuesta (RNF-003). */
  actualizarToken(token: string): void {
    if (this.sesionActual()) {
      localStorage.setItem(CLAVE_TOKEN, token);
    }
  }

  limpiarSesion(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_SESION);
    this.sesionActual.set(null);
  }

  rutaInicio(rol: Rol | null = this.rol()): string {
    return rol ? RUTA_INICIO[rol] : '/login';
  }

  // ------------------------------------------------------------- privados

  private guardarSesion(rs: LoginRs): void {
    const sesion: UsuarioSesion = {
      idUsuario: rs.idUsuario,
      nombre: rs.nombre,
      email: rs.email,
      rol: rs.rol,
      minutosInactividad: rs.minutosInactividad
    };
    localStorage.setItem(CLAVE_TOKEN, rs.token);
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    this.sesionActual.set(sesion);
  }

  private leerSesion(): UsuarioSesion | null {
    try {
      const texto = localStorage.getItem(CLAVE_SESION);
      return texto ? (JSON.parse(texto) as UsuarioSesion) : null;
    } catch {
      return null;
    }
  }

  /** Lee el vencimiento (exp) del JWT en milisegundos. */
  private leerVencimiento(token: string): number | null {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const datos = JSON.parse(atob(payload));
      return typeof datos.exp === 'number' ? datos.exp * 1000 : null;
    } catch {
      return 0;
    }
  }
}
