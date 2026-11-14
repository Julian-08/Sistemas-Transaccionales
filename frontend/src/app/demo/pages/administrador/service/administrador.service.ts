import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { RespuestaRs } from 'src/app/models/sesion';
import { Asesor, Rol, Usuario, UsuarioActualizarRq, UsuarioRq } from 'src/app/models/usuario';
import { ClienteAdmin, RegistroClienteRq } from 'src/app/models/cliente';
import { AsignarProspectoRq, Prospecto, Seguimiento } from 'src/app/models/prospecto';
import { Configuracion, Reporte } from 'src/app/models/comercial';

/** Peticiones del administrador al backend (rutas protegidas con rol ADMINISTRADOR). */
@Injectable({ providedIn: 'root' })
export class AdministradorService {
  private readonly backend = inject(BackendService);
  private readonly url = environment.apiUrlAuth;

  // ------------------------------------------------------------- usuarios (RF-014, RF-015)

  listarUsuarios(idRol?: number): Observable<Usuario[]> {
    const params = idRol ? new HttpParams().set('idRol', idRol) : undefined;
    return this.backend.get<Usuario[]>(this.url, 'usuario', 'listar', params);
  }

  listarRoles(): Observable<Rol[]> {
    return this.backend.get<Rol[]>(this.url, 'usuario', 'roles');
  }

  crearUsuario(usuario: UsuarioRq): Observable<RespuestaRs> {
    return this.backend.post<RespuestaRs>(this.url, 'usuario', 'guardar', usuario);
  }

  actualizarUsuario(usuario: UsuarioActualizarRq): Observable<RespuestaRs> {
    return this.backend.put<RespuestaRs>(this.url, 'usuario', 'actualizar', usuario);
  }

  cambiarEstadoUsuario(idUsuario: number, estado: 'ACTIVO' | 'INACTIVO'): Observable<RespuestaRs> {
    return this.backend.put<RespuestaRs>(this.url, 'usuario', 'cambiar-estado', { idUsuario, estado });
  }

  asignarRol(idUsuario: number, idRol: number): Observable<RespuestaRs> {
    return this.backend.put<RespuestaRs>(this.url, 'usuario', 'asignar-rol', { idUsuario, idRol });
  }

  // ------------------------------------------------------------- asesores

  listarAsesores(soloActivos = false): Observable<Asesor[]> {
    return this.backend.get<Asesor[]>(this.url, 'asesor', 'listar', new HttpParams().set('soloActivos', soloActivos));
  }

  actualizarMeta(idAsesor: number, metaMensual: number): Observable<RespuestaRs> {
    return this.backend.put<RespuestaRs>(this.url, 'asesor', 'meta', { idAsesor, metaMensual });
  }

  // ------------------------------------------------------------- clientes

  listarClientes(): Observable<ClienteAdmin[]> {
    return this.backend.get<ClienteAdmin[]>(this.url, 'cliente-admin', 'listar');
  }

  crearCliente(cliente: RegistroClienteRq): Observable<RespuestaRs> {
    return this.backend.post<RespuestaRs>(this.url, 'cliente-admin', 'crear', cliente);
  }

  inactivarCliente(idCliente: number): Observable<RespuestaRs> {
    return this.backend.put<RespuestaRs>(this.url, 'cliente-admin', `${idCliente}/inactivar`, {});
  }

  activarCliente(idCliente: number): Observable<RespuestaRs> {
    return this.backend.put<RespuestaRs>(this.url, 'cliente-admin', `${idCliente}/activar`, {});
  }

  inactivarInactivos(): Observable<RespuestaRs> {
    return this.backend.post<RespuestaRs>(this.url, 'cliente-admin', 'inactivar-inactivos', {});
  }

  // ------------------------------------------------------------- prospectos (RF-016)

  listarProspectos(filtros: { idAsesor?: number | null; sinAsignar?: boolean; estado?: string | null }): Observable<Prospecto[]> {
    let params = new HttpParams().set('sinAsignar', !!filtros.sinAsignar);
    if (filtros.idAsesor) {
      params = params.set('idAsesor', filtros.idAsesor);
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    return this.backend.get<Prospecto[]>(this.url, 'prospecto', 'listar', params);
  }

  asignarProspecto(asignacion: AsignarProspectoRq): Observable<RespuestaRs> {
    return this.backend.put<RespuestaRs>(this.url, 'prospecto', 'asignar', asignacion);
  }

  // ------------------------------------------------------------- seguimientos (RF-018)

  listarSeguimientos(idAsesor?: number | null, desde?: string | null, hasta?: string | null): Observable<Seguimiento[]> {
    let params = new HttpParams();
    if (idAsesor) {
      params = params.set('idAsesor', idAsesor);
    }
    if (desde) {
      params = params.set('desde', desde);
    }
    if (hasta) {
      params = params.set('hasta', hasta);
    }
    return this.backend.get<Seguimiento[]>(this.url, 'seguimiento', 'listar', params);
  }

  // ------------------------------------------------------------- reportes (RF-019)

  resumen(): Observable<Record<string, number>> {
    return this.backend.get<Record<string, number>>(this.url, 'reporte', 'resumen');
  }

  generarReporte(tipo: string, desde: string, hasta: string): Observable<Reporte> {
    return this.backend.get<Reporte>(this.url, 'reporte', tipo, new HttpParams().set('desde', desde).set('hasta', hasta));
  }

  exportarReporte(tipo: string, desde: string, hasta: string): Observable<Blob> {
    return this.backend.getArchivo(this.url, 'reporte', `${tipo}/exportar`, new HttpParams().set('desde', desde).set('hasta', hasta));
  }

  // ------------------------------------------------------------- configuracion (RF-017)

  listarConfiguracion(): Observable<Configuracion[]> {
    return this.backend.get<Configuracion[]>(this.url, 'configuracion', 'listar');
  }

  actualizarConfiguracion(clave: string, valor: number): Observable<RespuestaRs> {
    return this.backend.put<RespuestaRs>(this.url, 'configuracion', 'actualizar', { clave, valor: String(valor) });
  }
}
