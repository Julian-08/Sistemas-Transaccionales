import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AdministradorService } from '../service/administrador.service';
import { ClienteAdmin } from 'src/app/models/cliente';
import { ListaPaginada } from 'src/app/theme/shared/helpers/lista-paginada';
import { confirmar, mensajeError, mensajeExito } from 'src/app/theme/shared/helpers/mensajes';
import { PaginacionComponent } from 'src/app/theme/shared/components/paginacion/paginacion.component';
import { PATRON_CONTRASENA } from '../../publico/registro/registro.component';

type FiltroCliente = 'TODOS' | 'ACTIVOS' | 'INACTIVOS' | 'INACTIVABLES' | 'LICENCIA';

/**
 * Clientes vistos por el administrador. Los clientes nunca se borran:
 * solo se inactivan cuando llevan DIAS_INACTIVIDAD dias sin ingresar y no tienen licencia.
 */
@Component({
  selector: 'app-clientes-admin',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, PaginacionComponent],
  templateUrl: './clientes-admin.component.html'
})
export class ClientesAdminComponent implements OnInit {
  private readonly adminService = inject(AdministradorService);
  private readonly formBuilder = inject(FormBuilder);

  readonly lista = new ListaPaginada<ClienteAdmin>((c) => [c.nombre, c.email, c.empresa, c.nombreAsesor, c.estadoProspecto]);
  readonly filtros: { valor: FiltroCliente; etiqueta: string }[] = [
    { valor: 'TODOS', etiqueta: 'Todos' },
    { valor: 'ACTIVOS', etiqueta: 'Activos' },
    { valor: 'INACTIVABLES', etiqueta: 'Sin actividad' },
    { valor: 'LICENCIA', etiqueta: 'Con licencia' },
    { valor: 'INACTIVOS', etiqueta: 'Inactivos' }
  ];
  filtro: FiltroCliente = 'TODOS';
  todos: ClienteAdmin[] = [];
  diasInactividad = 60;
  cargando = true;

  mostrarFormulario = false;
  guardando = false;
  readonly form = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    empresa: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    contrasena: ['', [Validators.required, Validators.pattern(PATRON_CONTRASENA)]]
  });

  get f(): Record<string, AbstractControl> {
    return this.form.controls;
  }

  get totalInactivables(): number {
    return this.todos.filter((c) => c.inactivable).length;
  }

  ngOnInit(): void {
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    forkJoin({ clientes: this.adminService.listarClientes(), configuracion: this.adminService.listarConfiguracion() }).subscribe({
      next: ({ clientes, configuracion }) => {
        this.todos = clientes;
        this.diasInactividad = Number(configuracion.find((c) => c.clave === 'DIAS_INACTIVIDAD')?.valor ?? 60);
        this.aplicarFiltro(this.filtro);
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar los clientes.');
      }
    });
  }

  aplicarFiltro(filtro: FiltroCliente): void {
    this.filtro = filtro;
    const reglas: Record<FiltroCliente, (c: ClienteAdmin) => boolean> = {
      TODOS: () => true,
      ACTIVOS: (c) => c.estado === 'ACTIVO',
      INACTIVOS: (c) => c.estado === 'INACTIVO',
      INACTIVABLES: (c) => c.inactivable,
      LICENCIA: (c) => c.tieneLicencia
    };
    this.lista.cargar(this.todos.filter(reglas[filtro]));
  }

  nuevo(): void {
    this.form.reset();
    this.mostrarFormulario = true;
  }

  crear(): void {
    if (this.form.invalid || this.guardando) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    this.guardando = true;
    this.adminService
      .crearCliente({ nombre: valores.nombre.trim(), empresa: valores.empresa.trim(), email: valores.email.trim(), contrasena: valores.contrasena })
      .subscribe({
        next: (rs) => {
          this.guardando = false;
          this.mostrarFormulario = false;
          mensajeExito(rs.mensaje);
          this.listar();
        },
        error: (error) => {
          this.guardando = false;
          mensajeError(error);
        }
      });
  }

  async inactivar(cliente: ClienteAdmin): Promise<void> {
    const ok = await confirmar(
      'Inactivar cliente',
      `${cliente.nombre} lleva ${cliente.diasSinIngresar} días sin ingresar y no tiene licencia. ` +
        'No podrá iniciar sesión, pero su historial se conserva.',
      'Sí, inactivar'
    );
    if (!ok) {
      return;
    }
    this.adminService.inactivarCliente(cliente.idCliente).subscribe({
      next: (rs) => {
        mensajeExito(rs.mensaje);
        this.listar();
      },
      error: (error) => mensajeError(error)
    });
  }

  async activar(cliente: ClienteAdmin): Promise<void> {
    if (!(await confirmar('Activar cliente', `${cliente.nombre} podrá volver a iniciar sesión.`, 'Sí, activar'))) {
      return;
    }
    this.adminService.activarCliente(cliente.idCliente).subscribe({
      next: (rs) => {
        mensajeExito(rs.mensaje);
        this.listar();
      },
      error: (error) => mensajeError(error)
    });
  }

  async inactivarTodos(): Promise<void> {
    const ok = await confirmar(
      'Inactivar clientes sin actividad',
      `Se inactivarán ${this.totalInactivables} clientes que llevan ${this.diasInactividad} días o más sin ingresar y no tienen licencia.`,
      'Sí, inactivar'
    );
    if (!ok) {
      return;
    }
    this.adminService.inactivarInactivos().subscribe({
      next: (rs) => {
        mensajeExito(rs.mensaje);
        this.listar();
      },
      error: (error) => mensajeError(error)
    });
  }

  motivoNoInactivable(cliente: ClienteAdmin): string {
    if (cliente.tieneLicencia) {
      return 'Tiene licencia comprada';
    }
    return `Ingresó hace ${cliente.diasSinIngresar} días (se puede inactivar desde ${this.diasInactividad})`;
  }
}
