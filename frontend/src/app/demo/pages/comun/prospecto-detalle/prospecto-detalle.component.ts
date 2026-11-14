import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ComercialService } from '../service/comercial.service';
import { AsesorService } from '../../asesor/service/asesor.service';
import { AuthService } from 'src/app/services/auth.service';
import { ActividadProspecto, ESTADOS_PROSPECTO, EstadoProspecto } from 'src/app/models/prospecto';
import { Propuesta } from 'src/app/models/comercial';
import { confirmar, mensajeError, mensajeExito } from 'src/app/theme/shared/helpers/mensajes';

type Pestana = 'actividad' | 'ingresos' | 'seguimientos' | 'propuestas';

const ICONO_EVENTO: Record<string, string> = {
  VISITA_WEB: 'icon-globe',
  DESCARGA: 'icon-download',
  FORMULARIO: 'icon-edit',
  EMAIL: 'icon-mail'
};

/**
 * Ficha del prospecto (RF-010): datos del cliente, puntaje, ingresos, paginas
 * visitadas, seguimientos y propuestas. El asesor asignado ademas puede registrar
 * seguimientos (RF-012), cambiar el estado (RF-013) y ofrecer el plan de pago.
 */
@Component({
  selector: 'app-prospecto-detalle',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './prospecto-detalle.component.html'
})
export class ProspectoDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly comercialService = inject(ComercialService);
  private readonly asesorService = inject(AsesorService);
  readonly esAsesor = inject(AuthService).rol() === 'ASESOR';

  readonly estados = ESTADOS_PROSPECTO;
  idCliente = 0;
  detalle: ActividadProspecto | null = null;
  propuestas: Propuesta[] = [];
  pestana: Pestana = 'actividad';
  cargando = true;
  nuevoEstado: EstadoProspecto | null = null;

  mostrarSeguimiento = false;
  mostrarPropuesta = false;
  guardando = false;

  readonly formSeguimiento = this.formBuilder.nonNullable.group({
    medio: ['LLAMADA' as 'LLAMADA' | 'CORREO', Validators.required],
    observaciones: ['', [Validators.required, Validators.maxLength(2000)]]
  });

  readonly formPropuesta = this.formBuilder.nonNullable.group({
    montoEstimado: [0, [Validators.required, Validators.min(1)]]
  });

  get fs(): Record<string, AbstractControl> {
    return this.formSeguimiento.controls;
  }

  get puedeGestionar(): boolean {
    const estado = this.detalle?.prospecto.estadoProspecto;
    return this.esAsesor && estado !== 'CERRADO' && estado !== 'DESCARTADO';
  }

  get totalPaginasVisitadas(): number {
    return this.detalle?.actividades.filter((a) => a.tipoEvento === 'VISITA_WEB').length ?? 0;
  }

  get tiempoTotalMinutos(): number {
    const segundos = this.detalle?.actividades.reduce((total, a) => total + (a.tiempoPermanenciaSeg ?? 0), 0) ?? 0;
    return Math.round(segundos / 60);
  }

  ngOnInit(): void {
    this.idCliente = Number(this.route.snapshot.paramMap.get('id'));
    if (this.route.snapshot.queryParamMap.get('accion') === 'propuesta') {
      this.mostrarPropuesta = true;
    }
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    forkJoin({
      detalle: this.comercialService.actividadProspecto(this.idCliente),
      propuestas: this.comercialService.listarPropuestas(this.idCliente)
    }).subscribe({
      next: ({ detalle, propuestas }) => {
        this.detalle = detalle;
        this.propuestas = propuestas;
        this.nuevoEstado = detalle.prospecto.estadoProspecto;
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar la ficha del prospecto.');
        this.router.navigate(['/inicio']);
      }
    });
  }

  volver(): void {
    this.location.back();
  }

  icono(tipo: string): string {
    return ICONO_EVENTO[tipo] ?? 'icon-activity';
  }

  registrarSeguimiento(): void {
    if (this.formSeguimiento.invalid || this.guardando) {
      this.formSeguimiento.markAllAsTouched();
      return;
    }
    const valores = this.formSeguimiento.getRawValue();
    this.guardando = true;
    this.asesorService
      .registrarSeguimiento({ idCliente: this.idCliente, medio: valores.medio, observaciones: valores.observaciones.trim() })
      .subscribe({
        next: (rs) => {
          this.guardando = false;
          this.mostrarSeguimiento = false;
          this.formSeguimiento.reset({ medio: 'LLAMADA', observaciones: '' });
          mensajeExito(rs.mensaje);
          this.pestana = 'seguimientos';
          this.cargar();
        },
        error: (error) => {
          this.guardando = false;
          mensajeError(error);
        }
      });
  }

  async cambiarEstado(): Promise<void> {
    if (!this.detalle || !this.nuevoEstado || this.nuevoEstado === this.detalle.prospecto.estadoProspecto) {
      return;
    }
    const estaCerrado = this.detalle.prospecto.estadoProspecto === 'CERRADO';
    // RF-013 A1: un prospecto cerrado pide confirmacion.
    if (estaCerrado && !(await confirmar('Prospecto cerrado', 'Este prospecto ya está CERRADO. ¿Seguro que quieres cambiar su estado?'))) {
      this.nuevoEstado = this.detalle.prospecto.estadoProspecto;
      return;
    }
    this.asesorService.cambiarEstadoProspecto({ idCliente: this.idCliente, estado: this.nuevoEstado, confirmar: estaCerrado }).subscribe({
      next: (rs) => {
        mensajeExito(rs.mensaje);
        this.cargar();
      },
      error: (error) => {
        mensajeError(error);
        this.nuevoEstado = this.detalle?.prospecto.estadoProspecto ?? null;
      }
    });
  }

  crearPropuesta(): void {
    if (this.formPropuesta.invalid || this.guardando) {
      this.formPropuesta.markAllAsTouched();
      return;
    }
    this.guardando = true;
    this.asesorService.crearPropuesta({ idCliente: this.idCliente, montoEstimado: Number(this.formPropuesta.getRawValue().montoEstimado) }).subscribe({
      next: (rs) => {
        this.guardando = false;
        this.mostrarPropuesta = false;
        mensajeExito(rs.mensaje + ' Puedes cerrar la venta desde Propuestas.');
        this.pestana = 'propuestas';
        this.cargar();
      },
      error: (error) => {
        this.guardando = false;
        mensajeError(error);
      }
    });
  }
}
