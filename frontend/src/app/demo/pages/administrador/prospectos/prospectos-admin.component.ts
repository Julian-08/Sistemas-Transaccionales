import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AdministradorService } from '../service/administrador.service';
import { Asesor } from 'src/app/models/usuario';
import { ESTADOS_PROSPECTO, Prospecto } from 'src/app/models/prospecto';
import { ListaPaginada } from 'src/app/theme/shared/helpers/lista-paginada';
import { mensajeError, mensajeExito } from 'src/app/theme/shared/helpers/mensajes';
import { PaginacionComponent } from 'src/app/theme/shared/components/paginacion/paginacion.component';

/** Todos los prospectos y su asignacion a asesores activos (RF-016). */
@Component({
  selector: 'app-prospectos-admin',
  imports: [CommonModule, FormsModule, RouterModule, PaginacionComponent],
  template: `
    <div class="zb-encabezado">
      <div>
        <h4>Prospectos y asignación</h4>
        <p>Asigna cada prospecto a un asesor activo. El asesor recibe una alerta y lo ve en su lista.</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex flex-wrap gap-2 align-items-center">
        <select class="form-select form-select-sm" style="max-width: 200px" [(ngModel)]="filtroAsesor" (change)="listar()" aria-label="Filtrar por asesor">
          <option [ngValue]="null">Todos los asesores</option>
          @for (asesor of asesores; track asesor.idAsesor) {
            <option [ngValue]="asesor.idAsesor">{{ asesor.nombre }}</option>
          }
        </select>
        <select class="form-select form-select-sm" style="max-width: 180px" [(ngModel)]="filtroEstado" (change)="listar()" aria-label="Filtrar por estado">
          <option [ngValue]="null">Todos los estados</option>
          @for (estado of estados; track estado) {
            <option [ngValue]="estado">{{ estado }}</option>
          }
        </select>
        <div class="form-check form-switch ms-1">
          <input id="sinAsignar" class="form-check-input" type="checkbox" [(ngModel)]="sinAsignar" (change)="listar()" />
          <label class="form-check-label small" for="sinAsignar">Solo sin asesor</label>
        </div>
        <input type="search" class="form-control form-control-sm ms-auto" style="max-width: 240px" placeholder="Buscar"
          [ngModel]="lista.terminoBusqueda" (ngModelChange)="lista.buscar($event)" aria-label="Buscar prospectos" />
      </div>
      <div class="card-body">
        @if (cargando) {
          <div class="zb-vacio"><span class="spinner-border text-primary"></span></div>
        } @else {
          <div class="table-responsive">
            <table class="table table-hover zb-tabla mb-0">
              <thead>
                <tr>
                  <th>Prospecto</th>
                  <th>Empresa</th>
                  <th class="text-center">Puntaje</th>
                  <th>Estado</th>
                  <th>Última actividad</th>
                  <th style="min-width: 260px">Asesor</th>
                </tr>
              </thead>
              <tbody>
                @for (prospecto of lista.paginados; track prospecto.idCliente) {
                  <tr>
                    <td>
                      <a [routerLink]="['/inicio/prospecto', prospecto.idCliente]">{{ prospecto.nombre }}</a>
                      <div class="small text-muted">{{ prospecto.email }}</div>
                    </td>
                    <td>{{ prospecto.empresa }}</td>
                    <td class="text-center"><strong>{{ prospecto.puntaje }}</strong></td>
                    <td><span class="zb-estado zb-estado--{{ prospecto.estadoProspecto }}">{{ prospecto.estadoProspecto }}</span></td>
                    <td>{{ prospecto.ultimaActividad ? (prospecto.ultimaActividad | date: 'dd/MM/yyyy HH:mm') : '—' }}</td>
                    <td>
                      <div class="input-group input-group-sm">
                        <select class="form-select" [(ngModel)]="seleccion[prospecto.idCliente]" [attr.aria-label]="'Asesor para ' + prospecto.nombre">
                          <option [ngValue]="null" disabled>Sin asesor</option>
                          @for (asesor of asesoresActivos; track asesor.idAsesor) {
                            <option [ngValue]="asesor.idAsesor">{{ asesor.nombre }}</option>
                          }
                        </select>
                        <button type="button" class="btn btn-zimbra"
                          [disabled]="!seleccion[prospecto.idCliente] || seleccion[prospecto.idCliente] === prospecto.idAsesor"
                          (click)="asignar(prospecto)">
                          {{ prospecto.idAsesor ? 'Reasignar' : 'Asignar' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="zb-vacio"><i class="feather icon-user-check"></i>No hay prospectos para estos filtros.</td></tr>
                }
              </tbody>
            </table>
          </div>
          <app-paginacion [pagina]="lista.paginaActual" [totalPaginas]="lista.totalPaginas" [totalRegistros]="lista.filtrados.length"
            (cambiar)="lista.cambiarPagina($event)" />
        }
      </div>
    </div>
  `
})
export class ProspectosAdminComponent implements OnInit {
  private readonly adminService = inject(AdministradorService);

  readonly estados = ESTADOS_PROSPECTO;
  readonly lista = new ListaPaginada<Prospecto>((p) => [p.nombre, p.email, p.empresa, p.nombreAsesor]);
  asesores: Asesor[] = [];
  seleccion: Record<number, number | null> = {};
  filtroAsesor: number | null = null;
  filtroEstado: string | null = null;
  sinAsignar = false;
  cargando = true;

  get asesoresActivos(): Asesor[] {
    return this.asesores.filter((a) => a.estado === 'ACTIVO');
  }

  ngOnInit(): void {
    this.adminService.listarAsesores().subscribe({ next: (asesores) => (this.asesores = asesores) });
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.adminService.listarProspectos({ idAsesor: this.filtroAsesor, sinAsignar: this.sinAsignar, estado: this.filtroEstado }).subscribe({
      next: (prospectos) => {
        this.lista.cargar(prospectos);
        this.seleccion = Object.fromEntries(prospectos.map((p) => [p.idCliente, p.idAsesor]));
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar los prospectos.');
      }
    });
  }

  asignar(prospecto: Prospecto): void {
    const idAsesor = this.seleccion[prospecto.idCliente];
    if (!idAsesor) {
      return;
    }
    this.adminService.asignarProspecto({ idCliente: prospecto.idCliente, idAsesor }).subscribe({
      next: (rs) => {
        mensajeExito(rs.mensaje);
        this.listar();
      },
      error: (error) => mensajeError(error)
    });
  }
}
