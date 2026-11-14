import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AdministradorService } from '../service/administrador.service';
import { AuthService } from 'src/app/services/auth.service';
import { mensajeError } from 'src/app/theme/shared/helpers/mensajes';

interface FilaAsesor {
  asesor: string;
  estado: string;
  meta_mensual: number;
  prospectos_asignados: number;
  seguimientos: number;
  propuestas: number;
  ventas: number;
  monto_vendido: number;
}

interface PasoEmbudo {
  etiqueta: string;
  valor: number;
}

/** Panel general del administrador: indicadores, embudo del mes y desempeno de asesores. */
@Component({
  selector: 'app-panel-admin',
  imports: [CommonModule, RouterModule],
  templateUrl: './panel-admin.component.html'
})
export class PanelAdminComponent implements OnInit {
  private readonly adminService = inject(AdministradorService);
  readonly sesion = inject(AuthService).sesion;

  cargando = true;
  resumen: Record<string, number> = {};
  embudo: PasoEmbudo[] = [];
  tasaConversion: number | null = null;
  asesores: FilaAsesor[] = [];

  ngOnInit(): void {
    const hoy = new Date();
    const desde = this.fecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    const hasta = this.fecha(hoy);
    forkJoin({
      resumen: this.adminService.resumen(),
      conversion: this.adminService.generarReporte('conversion', desde, hasta),
      desempeno: this.adminService.generarReporte('desempeno-asesor', desde, hasta)
    }).subscribe({
      next: ({ resumen, conversion, desempeno }) => {
        this.resumen = resumen;
        const fila = (conversion.filas[0] ?? {}) as Record<string, number>;
        this.embudo = [
          { etiqueta: 'Clientes registrados', valor: Number(fila['clientes_registrados'] ?? 0) },
          { etiqueta: 'Pruebas descargadas', valor: Number(fila['pruebas_descargadas'] ?? 0) },
          { etiqueta: 'Prospectos clasificados', valor: Number(fila['prospectos_clasificados'] ?? 0) },
          { etiqueta: 'Propuestas emitidas', valor: Number(fila['propuestas_emitidas'] ?? 0) },
          { etiqueta: 'Ventas cerradas', valor: Number(fila['ventas_cerradas'] ?? 0) }
        ];
        this.tasaConversion = fila['tasa_conversion_pct'] != null ? Number(fila['tasa_conversion_pct']) : null;
        this.asesores = desempeno.filas as unknown as FilaAsesor[];
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar el panel.');
      }
    });
  }

  get maximoEmbudo(): number {
    return Math.max(1, ...this.embudo.map((paso) => paso.valor));
  }

  porcentajeMeta(asesor: FilaAsesor): number {
    const meta = Number(asesor.meta_mensual);
    return meta > 0 ? Math.min(100, Math.round((Number(asesor.monto_vendido) / meta) * 100)) : 0;
  }

  private fecha(valor: Date): string {
    const mes = String(valor.getMonth() + 1).padStart(2, '0');
    const dia = String(valor.getDate()).padStart(2, '0');
    return `${valor.getFullYear()}-${mes}-${dia}`;
  }
}
