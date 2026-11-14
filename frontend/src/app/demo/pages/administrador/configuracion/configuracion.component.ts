import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdministradorService } from '../service/administrador.service';
import { Configuracion } from 'src/app/models/comercial';
import { mensajeError, mensajeExito } from 'src/app/theme/shared/helpers/mensajes';

interface Parametro {
  clave: string;
  titulo: string;
  ayuda: string;
  unidad: string;
}

/** Parametros del sistema (RF-017 y reglas de clientes calificados e inactivos). */
@Component({
  selector: 'app-configuracion',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="zb-encabezado">
      <div>
        <h4>Configuración</h4>
        <p>Los cambios se aplican de inmediato, sin reiniciar el sistema.</p>
      </div>
    </div>

    @if (cargando) {
      <div class="zb-vacio"><span class="spinner-border text-primary"></span></div>
    } @else {
      <div class="row">
        @for (parametro of parametros; track parametro.clave) {
          <div class="col-md-6 col-xl-4 mb-4">
            <div class="card h-100">
              <div class="card-body d-flex flex-column">
                <h6 class="fw-semibold">{{ parametro.titulo }}</h6>
                <p class="text-muted small flex-grow-1">{{ parametro.ayuda }}</p>
                <div class="input-group">
                  <input type="number" min="1" class="form-control" [(ngModel)]="valores[parametro.clave]" [attr.aria-label]="parametro.titulo" />
                  <span class="input-group-text">{{ parametro.unidad }}</span>
                  <button type="button" class="btn btn-zimbra" [disabled]="valores[parametro.clave] === originales[parametro.clave]"
                    (click)="guardar(parametro)">Guardar</button>
                </div>
                @if (actualizado[parametro.clave]) {
                  <small class="text-muted mt-2">Actualizado: {{ actualizado[parametro.clave] | date: 'dd/MM/yyyy HH:mm' }}</small>
                }
              </div>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class ConfiguracionComponent implements OnInit {
  private readonly adminService = inject(AdministradorService);

  readonly parametros: Parametro[] = [
    {
      clave: 'INGRESOS_CALIFICADO',
      titulo: 'Ingresos para plan de pago',
      ayuda: 'Cuántas veces debe ingresar un cliente para aparecerle al asesor como listo para el plan de pago.',
      unidad: 'ingresos'
    },
    {
      clave: 'DIAS_CALIFICADO',
      titulo: 'Ventana de ingresos',
      ayuda: 'En cuántos días se cuentan los ingresos del cliente calificado.',
      unidad: 'días'
    },
    {
      clave: 'PUNTAJE_MINIMO',
      titulo: 'Puntaje mínimo de prospecto (RF-017)',
      ayuda: 'Puntaje desde el cual un cliente pasa a ser prospecto. Descarga suma 40, formulario 30, correo 15 y visita 10.',
      unidad: 'puntos'
    },
    {
      clave: 'DIAS_INACTIVIDAD',
      titulo: 'Días para inactivar clientes',
      ayuda: 'Días sin ingresar (y sin licencia) desde los cuales el administrador puede inactivar a un cliente.',
      unidad: 'días'
    },
    {
      clave: 'DIAS_PRUEBA',
      titulo: 'Días de la prueba gratuita',
      ayuda: 'Duración de la prueba de Zimbra que descarga el cliente.',
      unidad: 'días'
    }
  ];
  valores: Record<string, number> = {};
  originales: Record<string, number> = {};
  actualizado: Record<string, string> = {};
  cargando = true;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.adminService.listarConfiguracion().subscribe({
      next: (configuracion: Configuracion[]) => {
        configuracion.forEach((c) => {
          this.valores[c.clave] = Number(c.valor);
          this.originales[c.clave] = Number(c.valor);
          this.actualizado[c.clave] = c.fechaActualizacion;
        });
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar la configuración.');
      }
    });
  }

  guardar(parametro: Parametro): void {
    const valor = Number(this.valores[parametro.clave]);
    if (!Number.isInteger(valor) || valor <= 0) {
      mensajeError(null, 'El valor debe ser un número entero positivo.');
      return;
    }
    this.adminService.actualizarConfiguracion(parametro.clave, valor).subscribe({
      next: (rs) => {
        mensajeExito(rs.mensaje);
        this.cargar();
      },
      error: (error) => mensajeError(error)
    });
  }
}
