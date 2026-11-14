import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdministradorService } from '../service/administrador.service';
import { Reporte } from 'src/app/models/comercial';
import { mensajeError } from 'src/app/theme/shared/helpers/mensajes';

/** Reportes del administrador con exportacion a CSV (RF-019). */
@Component({
  selector: 'app-reportes',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="zb-encabezado">
      <div>
        <h4>Reportes</h4>
        <p>Genera en segundos los informes de visitas, prospectos, conversión y desempeño.</p>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="d-flex flex-wrap gap-2 mb-3">
          @for (opcion of tipos; track opcion.valor) {
            <button type="button" class="btn" [ngClass]="tipo === opcion.valor ? 'btn-zimbra' : 'btn-outline-secondary'" (click)="tipo = opcion.valor; generar()">
              <i class="feather me-1" [ngClass]="opcion.icono"></i>{{ opcion.etiqueta }}
            </button>
          }
        </div>
        <form class="row g-2 align-items-end" (ngSubmit)="generar()">
          <div class="col-sm-4 col-lg-3">
            <label class="form-label small" for="r-desde">Desde</label>
            <input id="r-desde" type="date" class="form-control" [(ngModel)]="desde" name="desde" required />
          </div>
          <div class="col-sm-4 col-lg-3">
            <label class="form-label small" for="r-hasta">Hasta</label>
            <input id="r-hasta" type="date" class="form-control" [(ngModel)]="hasta" name="hasta" required />
          </div>
          <div class="col-auto d-flex gap-2">
            <button type="submit" class="btn btn-zimbra" [disabled]="cargando">Generar</button>
            <button type="button" class="btn btn-outline-success" [disabled]="!reporte || !reporte.filas.length" (click)="exportar()">
              <i class="feather icon-download me-1"></i> Exportar CSV
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h5>{{ tituloActual }}</h5></div>
      <div class="card-body">
        @if (cargando) {
          <div class="zb-vacio"><span class="spinner-border text-primary"></span></div>
        } @else if (reporte) {
          @if (reporte.mensaje) {
            <div class="alert alert-info">{{ reporte.mensaje }}</div>
          }
          @if (reporte.filas.length) {
            <div class="table-responsive">
              <table class="table table-hover zb-tabla mb-0">
                <thead>
                  <tr>
                    @for (columna of reporte.columnas; track columna) {
                      <th>{{ etiqueta(columna) }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (fila of reporte.filas; track $index) {
                    <tr>
                      @for (columna of reporte.columnas; track columna) {
                        <td>{{ valor(columna, fila[columna]) }}</td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class ReportesComponent implements OnInit {
  private readonly adminService = inject(AdministradorService);

  readonly tipos = [
    { valor: 'visitas', etiqueta: 'Visitas', icono: 'icon-globe' },
    { valor: 'prospectos', etiqueta: 'Prospectos', icono: 'icon-user-check' },
    { valor: 'conversion', etiqueta: 'Conversión', icono: 'icon-trending-up' },
    { valor: 'desempeno-asesor', etiqueta: 'Desempeño por asesor', icono: 'icon-award' }
  ];
  tipo = 'conversion';
  desde = '';
  hasta = '';
  reporte: Reporte | null = null;
  cargando = false;

  get tituloActual(): string {
    return this.tipos.find((t) => t.valor === this.tipo)?.etiqueta ?? 'Reporte';
  }

  ngOnInit(): void {
    const hoy = new Date();
    this.hasta = this.fecha(hoy);
    this.desde = this.fecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.generar();
  }

  generar(): void {
    if (!this.desde || !this.hasta) {
      return;
    }
    this.cargando = true;
    this.adminService.generarReporte(this.tipo, this.desde, this.hasta).subscribe({
      next: (reporte) => {
        this.reporte = reporte;
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible generar el reporte.');
      }
    });
  }

  exportar(): void {
    this.adminService.exportarReporte(this.tipo, this.desde, this.hasta).subscribe({
      next: (archivo) => {
        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `reporte-${this.tipo}-${this.desde}_${this.hasta}.csv`;
        enlace.click();
        URL.revokeObjectURL(url);
      },
      error: (error) => mensajeError(error, 'No fue posible exportar el reporte.')
    });
  }

  /** "monto_vendido" -> "Monto vendido" */
  etiqueta(columna: string): string {
    const texto = columna.replace(/_/g, ' ').replace(' pct', ' %');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  valor(columna: string, valor: unknown): string {
    if (valor === null || valor === undefined) {
      return '—';
    }
    if (typeof valor === 'number' && (columna.includes('monto') || columna.includes('meta'))) {
      return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    }
    return String(valor);
  }

  private fecha(valor: Date): string {
    return `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, '0')}-${String(valor.getDate()).padStart(2, '0')}`;
  }
}
