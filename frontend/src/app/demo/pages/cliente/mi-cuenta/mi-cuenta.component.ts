import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ClienteService } from '../service/cliente.service';
import { PerfilCliente, Prueba } from 'src/app/models/cliente';
import { confirmar, mensajeError, mensajeExito } from 'src/app/theme/shared/helpers/mensajes';

/** Cuenta del cliente: sus datos y la prueba gratuita de Zimbra. No muestra puntaje (RNF-004). */
@Component({
  selector: 'app-mi-cuenta',
  imports: [CommonModule, RouterModule],
  templateUrl: './mi-cuenta.component.html'
})
export class MiCuentaComponent implements OnInit {
  private readonly clienteService = inject(ClienteService);

  perfil: PerfilCliente | null = null;
  pruebas: Prueba[] = [];
  cargando = true;
  descargando = false;

  get prueba(): Prueba | null {
    return this.perfil?.pruebaVigente ?? null;
  }

  get pruebaVencida(): boolean {
    return !this.prueba && this.pruebas.length > 0;
  }

  get porcentajeUsado(): number {
    if (!this.prueba) {
      return 0;
    }
    return Math.round(((this.prueba.diasPrueba - this.prueba.diasRestantes) / this.prueba.diasPrueba) * 100);
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    forkJoin({ perfil: this.clienteService.obtenerPerfil(), pruebas: this.clienteService.listarPruebas() }).subscribe({
      next: ({ perfil, pruebas }) => {
        this.perfil = perfil;
        this.pruebas = pruebas;
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar tu cuenta.');
      }
    });
  }

  async descargarPrueba(): Promise<void> {
    if (!(await confirmar('Activar prueba gratuita', 'Tendrás acceso completo a Zimbra durante el periodo de prueba, sin costo.', 'Activar prueba'))) {
      return;
    }
    this.descargando = true;
    this.clienteService.descargarPrueba().subscribe({
      next: (rs) => {
        this.descargando = false;
        mensajeExito(rs.mensaje, '¡Prueba activada!');
        this.cargar();
      },
      error: (error) => {
        this.descargando = false;
        mensajeError(error);
      }
    });
  }
}
