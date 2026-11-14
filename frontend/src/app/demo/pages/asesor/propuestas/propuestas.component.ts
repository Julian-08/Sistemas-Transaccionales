import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AsesorService } from '../service/asesor.service';
import { ComercialService } from '../../comun/service/comercial.service';
import { Periodo, Propuesta, TipoLicencia } from 'src/app/models/comercial';
import { ListaPaginada } from 'src/app/theme/shared/helpers/lista-paginada';
import { confirmar, mensajeError, mensajeExito } from 'src/app/theme/shared/helpers/mensajes';
import { PaginacionComponent } from 'src/app/theme/shared/components/paginacion/paginacion.component';

/** Propuestas del asesor: pasarlas a revision, rechazarlas o cerrar la venta de la licencia. */
@Component({
  selector: 'app-propuestas',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, PaginacionComponent],
  templateUrl: './propuestas.component.html'
})
export class PropuestasComponent implements OnInit {
  private readonly asesorService = inject(AsesorService);
  private readonly comercialService = inject(ComercialService);
  private readonly formBuilder = inject(FormBuilder);

  readonly lista = new ListaPaginada<Propuesta>((p) => [p.nombreCliente, p.empresa, p.estado]);
  readonly estadosFiltro = ['ENVIADA', 'EN_REVISION', 'ACEPTADA', 'RECHAZADA'];
  estado: string | null = null;
  cargando = true;

  /** Propuesta sobre la que se esta cerrando la venta. */
  propuestaVenta: Propuesta | null = null;
  guardando = false;
  readonly formVenta = this.formBuilder.nonNullable.group({
    montoFinal: [0, [Validators.required, Validators.min(1)]],
    tipoLicencia: ['ILIMITADA' as TipoLicencia, Validators.required],
    periodo: ['ANUAL' as Periodo, Validators.required]
  });

  ngOnInit(): void {
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.comercialService.listarPropuestas(null, this.estado).subscribe({
      next: (propuestas) => {
        this.lista.cargar(propuestas);
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar las propuestas.');
      }
    });
  }

  filtrar(estado: string | null): void {
    this.estado = estado;
    this.listar();
  }

  esAbierta(propuesta: Propuesta): boolean {
    return propuesta.estado === 'ENVIADA' || propuesta.estado === 'EN_REVISION';
  }

  async cambiarEstado(propuesta: Propuesta, estado: 'EN_REVISION' | 'RECHAZADA'): Promise<void> {
    if (estado === 'RECHAZADA' && !(await confirmar('Rechazar propuesta', `La propuesta de ${propuesta.nombreCliente} quedará rechazada.`, 'Sí, rechazar'))) {
      return;
    }
    this.asesorService.cambiarEstadoPropuesta(propuesta.idPropuesta, estado).subscribe({
      next: (rs) => {
        mensajeExito(rs.mensaje);
        this.listar();
      },
      error: (error) => mensajeError(error)
    });
  }

  abrirVenta(propuesta: Propuesta): void {
    this.propuestaVenta = propuesta;
    this.formVenta.reset({ montoFinal: propuesta.montoEstimado, tipoLicencia: 'ILIMITADA', periodo: 'ANUAL' });
  }

  registrarVenta(): void {
    if (!this.propuestaVenta || this.formVenta.invalid || this.guardando) {
      this.formVenta.markAllAsTouched();
      return;
    }
    const valores = this.formVenta.getRawValue();
    this.guardando = true;
    this.asesorService
      .registrarVenta({
        idPropuesta: this.propuestaVenta.idPropuesta,
        montoFinal: Number(valores.montoFinal),
        tipoLicencia: valores.tipoLicencia,
        periodo: valores.periodo
      })
      .subscribe({
        next: (rs) => {
          this.guardando = false;
          this.propuestaVenta = null;
          mensajeExito(rs.mensaje, '¡Venta cerrada!');
          this.listar();
        },
        error: (error) => {
          this.guardando = false;
          mensajeError(error);
        }
      });
  }
}
