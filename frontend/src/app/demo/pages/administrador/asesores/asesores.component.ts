import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdministradorService } from '../service/administrador.service';
import { Asesor } from 'src/app/models/usuario';
import { mensajeError, mensajeExito } from 'src/app/theme/shared/helpers/mensajes';

/** Metas mensuales de los asesores comerciales. */
@Component({
  selector: 'app-asesores',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="zb-encabezado">
      <div>
        <h4>Metas de asesores</h4>
        <p>Define cuánto debe vender cada asesor al mes. Se usa en su panel de estadísticas.</p>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        @if (cargando) {
          <div class="zb-vacio"><span class="spinner-border text-primary"></span></div>
        } @else {
          <div class="table-responsive">
            <table class="table table-hover zb-tabla mb-0">
              <thead>
                <tr>
                  <th>Asesor</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th class="text-center">Prospectos asignados</th>
                  <th style="min-width: 220px">Meta mensual (COP)</th>
                </tr>
              </thead>
              <tbody>
                @for (asesor of asesores; track asesor.idAsesor) {
                  <tr>
                    <td>{{ asesor.nombre }}</td>
                    <td>{{ asesor.email }}</td>
                    <td><span class="zb-estado zb-estado--{{ asesor.estado }}">{{ asesor.estado }}</span></td>
                    <td class="text-center">{{ asesor.prospectosAsignados }}</td>
                    <td>
                      <div class="input-group input-group-sm">
                        <input type="number" min="0" step="100000" class="form-control" [(ngModel)]="metas[asesor.idAsesor]"
                          [attr.aria-label]="'Meta de ' + asesor.nombre" />
                        <button type="button" class="btn btn-zimbra" [disabled]="metas[asesor.idAsesor] === asesor.metaMensual"
                          (click)="guardar(asesor)">Guardar</button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="zb-vacio">No hay asesores. Créalos en "Usuarios y asesores".</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class AsesoresComponent implements OnInit {
  private readonly adminService = inject(AdministradorService);

  asesores: Asesor[] = [];
  metas: Record<number, number> = {};
  cargando = true;

  ngOnInit(): void {
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.adminService.listarAsesores().subscribe({
      next: (asesores) => {
        this.asesores = asesores;
        this.metas = Object.fromEntries(asesores.map((a) => [a.idAsesor, a.metaMensual]));
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar los asesores.');
      }
    });
  }

  guardar(asesor: Asesor): void {
    const meta = Number(this.metas[asesor.idAsesor]);
    if (!(meta >= 0)) {
      mensajeError(null, 'La meta debe ser un número mayor o igual a cero.');
      return;
    }
    this.adminService.actualizarMeta(asesor.idAsesor, meta).subscribe({
      next: (rs) => {
        mensajeExito(rs.mensaje);
        this.listar();
      },
      error: (error) => mensajeError(error)
    });
  }
}
