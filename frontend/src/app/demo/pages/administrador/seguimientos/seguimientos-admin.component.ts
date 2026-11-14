import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AdministradorService } from '../service/administrador.service';
import { Asesor } from 'src/app/models/usuario';
import { Seguimiento } from 'src/app/models/prospecto';
import { ListaPaginada } from 'src/app/theme/shared/helpers/lista-paginada';
import { mensajeError } from 'src/app/theme/shared/helpers/mensajes';
import { PaginacionComponent } from 'src/app/theme/shared/components/paginacion/paginacion.component';

/** Consulta de todos los seguimientos con filtros por asesor y fecha (RF-018). */
@Component({
  selector: 'app-seguimientos-admin',
  imports: [CommonModule, FormsModule, RouterModule, PaginacionComponent],
  template: `
    <div class="zb-encabezado">
      <div>
        <h4>Seguimientos</h4>
        <p>Supervisa los contactos que hacen los asesores con sus prospectos.</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <form class="row g-2 align-items-end" (ngSubmit)="listar()">
          <div class="col-sm-4 col-lg-3">
            <label class="form-label small" for="s-asesor">Asesor</label>
            <select id="s-asesor" class="form-select form-select-sm" [(ngModel)]="idAsesor" name="idAsesor">
              <option [ngValue]="null">Todos</option>
              @for (asesor of asesores; track asesor.idAsesor) {
                <option [ngValue]="asesor.idAsesor">{{ asesor.nombre }}</option>
              }
            </select>
          </div>
          <div class="col-sm-4 col-lg-2">
            <label class="form-label small" for="s-desde">Desde</label>
            <input id="s-desde" type="date" class="form-control form-control-sm" [(ngModel)]="desde" name="desde" />
          </div>
          <div class="col-sm-4 col-lg-2">
            <label class="form-label small" for="s-hasta">Hasta</label>
            <input id="s-hasta" type="date" class="form-control form-control-sm" [(ngModel)]="hasta" name="hasta" />
          </div>
          <div class="col-auto">
            <button type="submit" class="btn btn-sm btn-zimbra">Filtrar</button>
          </div>
          <div class="col-lg ms-auto">
            <input type="search" class="form-control form-control-sm" placeholder="Buscar en resultados"
              [ngModel]="lista.terminoBusqueda" (ngModelChange)="lista.buscar($event)" name="busqueda" aria-label="Buscar" />
          </div>
        </form>
      </div>
      <div class="card-body">
        @if (cargando) {
          <div class="zb-vacio"><span class="spinner-border text-primary"></span></div>
        } @else {
          <div class="table-responsive">
            <table class="table table-hover zb-tabla mb-0">
              <thead>
                <tr><th>Fecha</th><th>Asesor</th><th>Cliente</th><th>Medio</th><th>Observaciones</th></tr>
              </thead>
              <tbody>
                @for (s of lista.paginados; track s.idSeguimiento) {
                  <tr>
                    <td class="text-nowrap">{{ s.fechaSeguimiento | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ s.nombreAsesor }}</td>
                    <td>
                      <a [routerLink]="['/inicio/prospecto', s.idCliente]">{{ s.nombreCliente }}</a>
                      <div class="small text-muted">{{ s.empresa }}</div>
                    </td>
                    <td>
                      <i class="feather" [ngClass]="s.medio === 'LLAMADA' ? 'icon-phone' : 'icon-mail'"></i>
                      {{ s.medio === 'LLAMADA' ? 'Llamada' : 'Correo' }}
                    </td>
                    <td>{{ s.observaciones }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="zb-vacio"><i class="feather icon-phone-call"></i>No hay seguimientos para estos filtros.</td></tr>
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
export class SeguimientosAdminComponent implements OnInit {
  private readonly adminService = inject(AdministradorService);

  readonly lista = new ListaPaginada<Seguimiento>((s) => [s.nombreAsesor, s.nombreCliente, s.empresa, s.observaciones]);
  asesores: Asesor[] = [];
  idAsesor: number | null = null;
  desde: string | null = null;
  hasta: string | null = null;
  cargando = true;

  ngOnInit(): void {
    this.adminService.listarAsesores().subscribe({ next: (asesores) => (this.asesores = asesores) });
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.adminService.listarSeguimientos(this.idAsesor, this.desde, this.hasta).subscribe({
      next: (seguimientos) => {
        this.lista.cargar(seguimientos);
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar los seguimientos.');
      }
    });
  }
}
