import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/** Header con el token renovado que devuelve el backend en cada respuesta valida. */
const HEADER_TOKEN_RENOVADO = 'X-Token-Renovado';

/**
 * Interceptor de todas las peticiones al backend:
 * - guarda el token renovado para que la sesion solo venza por inactividad (RNF-003);
 * - si el backend responde 401 (token vencido, sesion cerrada o usuario inactivo),
 *   cierra la sesion local y lleva al login con el aviso de sesion expirada.
 */
@Injectable()
export class HeadersInterceptor implements HttpInterceptor {
  private readonly auth = inject(AuthService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      tap((evento) => {
        if (evento instanceof HttpResponse) {
          const tokenRenovado = evento.headers.get(HEADER_TOKEN_RENOVADO);
          if (tokenRenovado) {
            this.auth.actualizarToken(tokenRenovado);
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const esLogin = req.url.includes('/auth/login') || req.url.includes('/auth/cerrar-sesion');
        if (error.status === 401 && !esLogin && this.auth.sesion()) {
          this.auth.cerrarSesion('expirada');
        }
        return throwError(() => error);
      })
    );
  }
}
