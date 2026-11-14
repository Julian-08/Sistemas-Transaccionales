import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AsesorService } from '../service/asesor.service';
import { ComercialService } from '../../comun/service/comercial.service';
import { AuthService } from 'src/app/services/auth.service';
import { EstadisticasAsesor } from 'src/app/models/usuario';
import { ClienteCalificado } from 'src/app/models/cliente';
import { Alerta } from 'src/app/models/comercial';
import { ESTADOS_PROSPECTO } from 'src/app/models/prospecto';
import { mensajeError } from 'src/app/theme/shared/helpers/mensajes';

/** Panel del asesor: sus estadisticas del mes, clientes listos para plan y alertas recientes. */
@Component({
  selector: 'app-panel-asesor',
  imports: [CommonModule, RouterModule],
  templateUrl: './panel-asesor.component.html'
})
export class PanelAsesorComponent implements OnInit {
  private readonly asesorService = inject(AsesorService);
  private readonly comercialService = inject(ComercialService);
  readonly sesion = inject(AuthService).sesion;

  readonly estados = ESTADOS_PROSPECTO;
  estadisticas: EstadisticasAsesor | null = null;
  calificados: ClienteCalificado[] = [];
  alertas: Alerta[] = [];
  cargando = true;

  ngOnInit(): void {
    forkJoin({
      estadisticas: this.asesorService.misEstadisticas(),
      calificados: this.comercialService.listarCalificados(),
      alertas: this.comercialService.listarAlertas(true)
    }).subscribe({
      next: ({ estadisticas, calificados, alertas }) => {
        this.estadisticas = estadisticas;
        this.calificados = calificados.filter((c) => !c.tieneLicencia).slice(0, 5);
        this.alertas = alertas.slice(0, 5);
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar tus estadísticas.');
      }
    });
  }

  get maximoEstado(): number {
    return Math.max(1, ...Object.values(this.estadisticas?.prospectosPorEstado ?? {}));
  }

  get cumplimiento(): number {
    return Math.min(100, Number(this.estadisticas?.cumplimientoMetaPct ?? 0));
  }
}
