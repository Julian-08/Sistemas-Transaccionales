import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ComercialService } from '../service/comercial.service';
import { AdministradorService } from '../../administrador/service/administrador.service';
import { AuthService } from 'src/app/services/auth.service';
import { ClienteCalificado } from 'src/app/models/cliente';
import { Asesor } from 'src/app/models/usuario';
import { Configuracion } from 'src/app/models/comercial';
import { ListaPaginada } from 'src/app/theme/shared/helpers/lista-paginada';
import { mensajeError, mensajeExito, mensajeInfo } from 'src/app/theme/shared/helpers/mensajes';
import { PaginacionComponent } from 'src/app/theme/shared/components/paginacion/paginacion.component';

/**
 * Clientes listos para ofrecerles el plan de pago: tienen el minimo de ingresos
 * configurado en la ventana de dias (por defecto 50 ingresos en 60 dias).
 * - Asesor: ve solo sus clientes y puede abrir la ficha para ofrecer el plan.
 * - Administrador: ve todos y asigna los que no tienen asesor.
 */
@Component({
  selector: 'app-calificados',
  imports: [CommonModule, FormsModule, RouterModule, PaginacionComponent],
  templateUrl: './calificados.component.html'
})
export class CalificadosComponent implements OnInit {
  private readonly comercialService = inject(ComercialService);
  private readonly adminService = inject(AdministradorService);
  private readonly router = inject(Router);
  readonly esAdministrador = inject(AuthService).rol() === 'ADMINISTRADOR';

  readonly lista = new ListaPaginada<ClienteCalificado>((c) => [c.nombre, c.email, c.empresa, c.nombreAsesor], 12);
  asesores: Asesor[] = [];
  seleccion: Record<number, number | null> = {};
  sinAsignar = false;
  ingresosMinimos = 50;
  dias = 60;
  cargando = true;

  ngOnInit(): void {
    if (this.esAdministrador) {
      forkJoin({ asesores: this.adminService.listarAsesores(true), configuracion: this.adminService.listarConfiguracion() }).subscribe({
        next: ({ asesores, configuracion }) => {
          this.asesores = asesores;
          this.leerRegla(configuracion);
        }
      });
    }
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.comercialService.listarCalificados(this.sinAsignar).subscribe({
      next: (clientes) => {
        this.lista.cargar(clientes);
        this.seleccion = Object.fromEntries(clientes.map((c) => [c.idCliente, c.idAsesor]));
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar los clientes calificados.');
      }
    });
  }

  verFicha(cliente: ClienteCalificado): void {
    if (!cliente.esProspecto) {
      mensajeInfo('Este cliente todavía no es prospecto; su ficha comercial aparece cuando supera el puntaje mínimo.');
      return;
    }
    this.router.navigate(['/inicio/prospecto', cliente.idCliente]);
  }

  ofrecerPlan(cliente: ClienteCalificado): void {
    this.router.navigate(['/inicio/prospecto', cliente.idCliente], { queryParams: { accion: 'propuesta' } });
  }

  asignar(cliente: ClienteCalificado): void {
    const idAsesor = this.seleccion[cliente.idCliente];
    if (!idAsesor) {
      return;
    }
    this.adminService.asignarProspecto({ idCliente: cliente.idCliente, idAsesor }).subscribe({
      next: (rs) => {
        mensajeExito(rs.mensaje);
        this.listar();
      },
      error: (error) => mensajeError(error)
    });
  }

  /** Dias que faltan para que venza la prueba (negativo si ya vencio). */
  diasPrueba(cliente: ClienteCalificado): number | null {
    if (!cliente.fechaVencimientoPrueba) {
      return null;
    }
    return Math.ceil((new Date(cliente.fechaVencimientoPrueba).getTime() - Date.now()) / 86400000);
  }

  private leerRegla(configuracion: Configuracion[]): void {
    this.ingresosMinimos = Number(configuracion.find((c) => c.clave === 'INGRESOS_CALIFICADO')?.valor ?? 50);
    this.dias = Number(configuracion.find((c) => c.clave === 'DIAS_CALIFICADO')?.valor ?? 60);
  }
}
