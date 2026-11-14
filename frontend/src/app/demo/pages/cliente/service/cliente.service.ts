import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { RespuestaRs } from 'src/app/models/sesion';
import { ActividadRq, PerfilCliente, Prueba } from 'src/app/models/cliente';

/** Peticiones del cliente (rutas con rol CLIENTE). Nunca recibe puntaje (RNF-004). */
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly backend = inject(BackendService);
  private readonly url = environment.apiUrlAuth;
  private readonly api = 'cliente';

  obtenerPerfil(): Observable<PerfilCliente> {
    return this.backend.get<PerfilCliente>(this.url, this.api, 'perfil');
  }

  descargarPrueba(): Observable<RespuestaRs> {
    return this.backend.post<RespuestaRs>(this.url, this.api, 'descargar-prueba', {});
  }

  listarPruebas(): Observable<Prueba[]> {
    return this.backend.get<Prueba[]>(this.url, this.api, 'pruebas');
  }

  registrarActividad(actividad: ActividadRq): Observable<void> {
    return this.backend.post<void>(this.url, this.api, 'actividad', actividad);
  }

  /**
   * RF-005: registra una pagina visitada y su tiempo de permanencia.
   * Se envia en segundo plano; si falla no interrumpe la navegacion (RNF-006).
   */
  registrarVisita(url: string, segundos: number): void {
    this.registrarActividad({ tipoEvento: 'VISITA_WEB', urlVisitada: url.slice(0, 255), tiempoPermanenciaSeg: Math.max(0, segundos) })
      .subscribe({ error: () => undefined });
  }
}
