import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AsesorService } from '../service/asesor.service';
import { ESTADOS_PROSPECTO, Prospecto } from 'src/app/models/prospecto';
import { ListaPaginada } from 'src/app/theme/shared/helpers/lista-paginada';
import { mensajeError } from 'src/app/theme/shared/helpers/mensajes';
import { PaginacionComponent } from 'src/app/theme/shared/components/paginacion/paginacion.component';

/** Prospectos asignados al asesor con puntaje y estado (RF-009). */
@Component({
  selector: 'app-mis-prospectos',
  imports: [CommonModule, FormsModule, RouterModule, PaginacionComponent],
  template: `
    <div class="zb-encabezado">
      <div>
        <h4>Mis prospectos</h4>
        <p>Clientes asignados a ti, ordenados por puntaje de interés.</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex flex-wrap gap-2 align-items-center">
        <div class="btn-group flex-wrap" role="group" aria-label="Filtrar por estado">
          <button type="button" class="btn btn-sm" [ngClass]="!estado ? 'btn-zimbra' : 'btn-outline-secondary'" (click)="filtrar(null)">Todos</button>
          @for (opcion of estados; track opcion) {
            <button type="button" class="btn btn-sm" [ngClass]="estado === opcion ? 'btn-zimbra' : 'btn-outline-secondary'" (click)="filtrar(opcion)">
              {{ opcion }}
            </button>
          }
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
                <tr><th>Prospecto</th><th>Empresa</th><th class="text-center">Puntaje</th><th>Estado</th><th>Última actividad</th><th></th></tr>
              </thead>
              <tbody>
                @for (p of lista.paginados; track p.idCliente) {
                  <tr>
                    <td>{{ p.nombre }}<div class="small text-muted">{{ p.email }}</div></td>
                    <td>{{ p.empresa }}</td>
                    <td class="text-center"><strong>{{ p.puntaje }}</strong></td>
                    <td><span class="zb-estado zb-estado--{{ p.estadoProspecto }}">{{ p.estadoProspecto }}</span></td>
                    <td>{{ p.ultimaActividad ? (p.ultimaActividad | date: 'dd/MM/yyyy HH:mm') : '—' }}</td>
                    <td class="text-end"><a [routerLink]="['/inicio/prospecto', p.idCliente]" class="btn btn-sm btn-zimbra">Ver ficha</a></td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="zb-vacio"><i class="feather icon-user-check"></i>No tienes prospectos asignados{{ estado ? ' en ' + estado : '' }}.</td></tr>
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
export class MisProspectosComponent implements OnInit {
  private readonly asesorService = inject(AsesorService);

  readonly estados = ESTADOS_PROSPECTO;
  readonly lista = new ListaPaginada<Prospecto>((p) => [p.nombre, p.email, p.empresa]);
  estado: string | null = null;
  cargando = true;

  ngOnInit(): void {
    this.listar();
  }

  filtrar(estado: string | null): void {
    this.estado = estado;
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.asesorService.misProspectos(this.estado).subscribe({
      next: (prospectos) => {
        this.lista.cargar(prospectos);
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar tus prospectos.');
      }
    });
  }
}
