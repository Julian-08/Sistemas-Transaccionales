import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ComercialService } from '../service/comercial.service';
import { AuthService } from 'src/app/services/auth.service';
import { Venta } from 'src/app/models/comercial';
import { ListaPaginada } from 'src/app/theme/shared/helpers/lista-paginada';
import { mensajeError } from 'src/app/theme/shared/helpers/mensajes';
import { PaginacionComponent } from 'src/app/theme/shared/components/paginacion/paginacion.component';

/** Ventas de licencias: el asesor ve las suyas, el administrador todas. */
@Component({
  selector: 'app-ventas',
  imports: [CommonModule, FormsModule, RouterModule, PaginacionComponent],
  template: `
    <div class="zb-encabezado">
      <div>
        <h4>{{ esAdministrador ? 'Ventas de licencias' : 'Mis ventas' }}</h4>
        <p>Licencias vendidas en el periodo seleccionado.</p>
      </div>
    </div>

    <div class="zb-indicadores">
      <div class="zb-indicador zb-indicador--verde">
        <i class="feather icon-credit-card"></i>
        <div><strong>{{ total | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</strong><span>Total vendido</span></div>
      </div>
      <div class="zb-indicador">
        <i class="feather icon-shopping-cart"></i>
        <div><strong>{{ lista.filtrados.length }}</strong><span>Ventas</span></div>
      </div>
      <div class="zb-indicador zb-indicador--naranja">
        <i class="feather icon-layers"></i>
        <div><strong>{{ ilimitadas }}</strong><span>Licencias ilimitadas</span></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <form class="row g-2 align-items-end" (ngSubmit)="listar()">
          <div class="col-sm-4 col-lg-2">
            <label class="form-label small" for="v-desde">Desde</label>
            <input id="v-desde" type="date" class="form-control form-control-sm" [(ngModel)]="desde" name="desde" />
          </div>
          <div class="col-sm-4 col-lg-2">
            <label class="form-label small" for="v-hasta">Hasta</label>
            <input id="v-hasta" type="date" class="form-control form-control-sm" [(ngModel)]="hasta" name="hasta" />
          </div>
          <div class="col-auto"><button type="submit" class="btn btn-sm btn-zimbra">Filtrar</button></div>
          <div class="col-lg ms-auto">
            <input type="search" class="form-control form-control-sm" placeholder="Buscar" name="busqueda"
              [ngModel]="lista.terminoBusqueda" (ngModelChange)="lista.buscar($event)" aria-label="Buscar ventas" />
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
                <tr>
                  <th>Fecha</th><th>Cliente</th>
                  @if (esAdministrador) { <th>Asesor</th> }
                  <th>Licencia</th><th>Periodo</th><th class="text-end">Monto</th>
                </tr>
              </thead>
              <tbody>
                @for (venta of lista.paginados; track venta.idVenta) {
                  <tr>
                    <td>{{ venta.fechaCierre | date: 'dd/MM/yyyy' }}</td>
                    <td>
                      <a [routerLink]="['/inicio/prospecto', venta.idCliente]">{{ venta.nombreCliente }}</a>
                      <div class="small text-muted">{{ venta.empresa }}</div>
                    </td>
                    @if (esAdministrador) { <td>{{ venta.nombreAsesor }}</td> }
                    <td>{{ venta.tipoLicencia === 'ILIMITADA' ? 'Ilimitada' : 'Pago por uso' }}</td>
                    <td>{{ venta.periodo }}</td>
                    <td class="text-end fw-semibold">{{ venta.montoFinal | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</td>
                  </tr>
                } @empty {
                  <tr><td [attr.colspan]="esAdministrador ? 6 : 5" class="zb-vacio"><i class="feather icon-credit-card"></i>No hay ventas en este periodo.</td></tr>
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
export class VentasComponent implements OnInit {
  private readonly comercialService = inject(ComercialService);
  readonly esAdministrador = inject(AuthService).rol() === 'ADMINISTRADOR';

  readonly lista = new ListaPaginada<Venta>((v) => [v.nombreCliente, v.empresa, v.nombreAsesor, v.tipoLicencia, v.periodo]);
  desde: string | null = null;
  hasta: string | null = null;
  cargando = true;

  get total(): number {
    return this.lista.filtrados.reduce((suma, v) => suma + Number(v.montoFinal), 0);
  }

  get ilimitadas(): number {
    return this.lista.filtrados.filter((v) => v.tipoLicencia === 'ILIMITADA').length;
  }

  ngOnInit(): void {
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.comercialService.listarVentas(this.desde, this.hasta).subscribe({
      next: (ventas) => {
        this.lista.cargar(ventas);
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar las ventas.');
      }
    });
  }
}
