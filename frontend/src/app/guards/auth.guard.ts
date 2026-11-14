import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { Rol } from '../models/sesion';

/** Solo deja entrar a las paginas internas con una sesion valida (RF-001). */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.estaAutenticado()) {
    return true;
  }
  const habiaSesion = !!auth.sesion();
  auth.limpiarSesion();
  return router.createUrlTree(['/login'], habiaSesion ? { queryParams: { sesion: 'expirada' } } : {});
};

/**
 * Solo deja entrar a los roles indicados en data.roles de la ruta (RNF-002).
 * Si el rol no corresponde, lo lleva a su propia pagina de inicio.
 */
export const rolGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data['roles'] as Rol[] | undefined) ?? [];
  const rol = auth.rol();
  if (rol && (roles.length === 0 || roles.includes(rol))) {
    return true;
  }
  return router.createUrlTree([auth.rutaInicio()]);
};

/** Login y registro: si ya hay sesion, va directo al inicio del rol. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estaAutenticado() ? router.createUrlTree([auth.rutaInicio()]) : true;
};

/** /inicio sin pagina: redirige al panel del rol. */
export const inicioRolGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return router.createUrlTree([auth.rutaInicio()]);
};
