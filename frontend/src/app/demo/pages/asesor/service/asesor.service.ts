import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { RespuestaRs } from 'src/app/models/sesion';
import { EstadisticasAsesor } from 'src/app/models/usuario';
import { CambiarEstadoProspectoRq, Prospecto, SeguimientoRq } from 'src/app/models/prospecto';
import { PropuestaRq, VentaRq } from 'src/app/models/comercial';

/** Peticiones del asesor comercial al backend (rutas con rol ASESOR). */
@Injectable({ providedIn: 'root' })
export class AsesorService {
  private readonly backend = inject(BackendService);
  private readonly url = environment.apiUrlAuth;

  misEstadisticas(): Observable<EstadisticasAsesor> {
    return this.backend.get<EstadisticasAsesor>(this.url, 'asesor', 'mis-estadisticas');
  }

  /** RF-009: prospectos asignados al asesor. */
  misProspectos(estado?: string | null): Observable<Prospecto[]> {
    const params = estado ? new HttpParams().set('estado', estado) : undefined;
    return this.backend.get<Prospecto[]>(this.url, 'prospecto', 'mis-prospectos', params);
  }

  /** RF-013 */
  cambiarEstadoProspecto(cambio: CambiarEstadoProspectoRq): Observable<RespuestaRs> {
    return this.backend.put<RespuestaRs>(this.url, 'prospecto', 'cambiar-estado', cambio);
  }

  /** RF-012 */
  registrarSeguimiento(seguimiento: SeguimientoRq): Observable<RespuestaRs> {
    return this.backend.post<RespuestaRs>(this.url, 'seguimiento', 'registrar', seguimiento);
  }

  crearPropuesta(propuesta: PropuestaRq): Observable<RespuestaRs> {
    return this.backend.post<RespuestaRs>(this.url, 'propuesta', 'crear', propuesta);
  }

  cambiarEstadoPropuesta(idPropuesta: number, estado: 'EN_REVISION' | 'RECHAZADA'): Observable<RespuestaRs> {
    return this.backend.put<RespuestaRs>(this.url, 'propuesta', 'cambiar-estado', { idPropuesta, estado });
  }

  registrarVenta(venta: VentaRq): Observable<RespuestaRs> {
    return this.backend.post<RespuestaRs>(this.url, 'venta', 'registrar', venta);
  }
}
