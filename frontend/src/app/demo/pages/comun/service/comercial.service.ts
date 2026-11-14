import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { RespuestaRs } from 'src/app/models/sesion';
import { ClienteCalificado } from 'src/app/models/cliente';
import { ActividadProspecto, Seguimiento } from 'src/app/models/prospecto';
import { Alerta, Propuesta, Venta } from 'src/app/models/comercial';

/**
 * Peticiones que usan el asesor y el administrador. El backend filtra por rol:
 * el asesor solo recibe sus propios datos (RNF-004).
 */
@Injectable({ providedIn: 'root' })
export class ComercialService {
  private readonly backend = inject(BackendService);
  private readonly url = environment.apiUrlAuth;

  /** Clientes listos para ofrecerles el plan de pago. */
  listarCalificados(sinAsignar = false): Observable<ClienteCalificado[]> {
    return this.backend.get<ClienteCalificado[]>(this.url, 'prospecto', 'calificados', new HttpParams().set('sinAsignar', sinAsignar));
  }

  /** RF-010: visitas, paginas, puntaje y seguimientos de un prospecto. */
  actividadProspecto(idCliente: number): Observable<ActividadProspecto> {
    return this.backend.get<ActividadProspecto>(this.url, 'prospecto', `${idCliente}/actividad`);
  }

  historialSeguimientos(idCliente: number): Observable<Seguimiento[]> {
    return this.backend.get<Seguimiento[]>(this.url, 'seguimiento', `prospecto/${idCliente}`);
  }

  // ------------------------------------------------------------- alertas (RF-011)

  listarAlertas(soloNoLeidas = false): Observable<Alerta[]> {
    return this.backend.get<Alerta[]>(this.url, 'alerta', 'mis-alertas', new HttpParams().set('soloNoLeidas', soloNoLeidas));
  }

  contarAlertasNoLeidas(): Observable<{ noLeidas: number }> {
    return this.backend.get<{ noLeidas: number }>(this.url, 'alerta', 'no-leidas/conteo');
  }

  marcarAlertaLeida(idAlerta: number): Observable<RespuestaRs> {
    return this.backend.put<RespuestaRs>(this.url, 'alerta', `${idAlerta}/marcar-leida`, {});
  }

  // ------------------------------------------------------------- propuestas y ventas

  listarPropuestas(idCliente?: number | null, estado?: string | null): Observable<Propuesta[]> {
    let params = new HttpParams();
    if (idCliente) {
      params = params.set('idCliente', idCliente);
    }
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.backend.get<Propuesta[]>(this.url, 'propuesta', 'listar', params);
  }

  listarVentas(desde?: string | null, hasta?: string | null): Observable<Venta[]> {
    let params = new HttpParams();
    if (desde) {
      params = params.set('desde', desde);
    }
    if (hasta) {
      params = params.set('hasta', hasta);
    }
    return this.backend.get<Venta[]>(this.url, 'venta', 'listar', params);
  }
}
