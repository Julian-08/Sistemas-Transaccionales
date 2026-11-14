import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AdministradorService } from '../service/administrador.service';
import { AuthService } from 'src/app/services/auth.service';
import { Usuario } from 'src/app/models/usuario';
import { ListaPaginada } from 'src/app/theme/shared/helpers/lista-paginada';
import { confirmar, mensajeError, mensajeExito } from 'src/app/theme/shared/helpers/mensajes';
import { PaginacionComponent } from 'src/app/theme/shared/components/paginacion/paginacion.component';
import { PATRON_CONTRASENA } from '../../publico/registro/registro.component';

type FiltroRol = 0 | 1 | 2 | 3;

/**
 * Gestion de usuarios (RF-014, RF-015): el administrador crea y ajusta
 * administradores y asesores; los clientes se gestionan en su propia pagina.
 */
@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, PaginacionComponent],
  templateUrl: './usuarios.component.html'
})
export class UsuariosComponent implements OnInit {
  private readonly adminService = inject(AdministradorService);
  private readonly formBuilder = inject(FormBuilder);
  readonly idSesion = inject(AuthService).sesion()?.idUsuario;

  readonly lista = new ListaPaginada<Usuario>((u) => [u.nombre, u.email, u.rol, u.estado]);
  readonly filtros: { valor: FiltroRol; etiqueta: string }[] = [
    { valor: 0, etiqueta: 'Todos' },
    { valor: 1, etiqueta: 'Administradores' },
    { valor: 2, etiqueta: 'Asesores' },
    { valor: 3, etiqueta: 'Clientes' }
  ];
  filtroRol: FiltroRol = 2;
  cargando = false;

  /** Formulario de crear/editar. null = cerrado. */
  modo: 'crear' | 'editar' | null = null;
  usuarioEditado: Usuario | null = null;
  guardando = false;

  readonly form = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    contrasena: [''],
    idRol: [2, Validators.required],
    metaMensual: [0, [Validators.min(0)]]
  });

  get f(): Record<string, AbstractControl> {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.adminService.listarUsuarios(this.filtroRol || undefined).subscribe({
      next: (usuarios) => {
        this.lista.cargar(usuarios);
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar los usuarios.');
      }
    });
  }

  cambiarFiltro(valor: FiltroRol): void {
    this.filtroRol = valor;
    this.listar();
  }

  nuevo(idRol: 1 | 2): void {
    this.modo = 'crear';
    this.usuarioEditado = null;
    this.form.reset({ nombre: '', email: '', contrasena: '', idRol, metaMensual: 0 });
    this.f['contrasena'].setValidators([Validators.required, Validators.pattern(PATRON_CONTRASENA)]);
    this.f['contrasena'].updateValueAndValidity();
  }

  editar(usuario: Usuario): void {
    this.modo = 'editar';
    this.usuarioEditado = usuario;
    this.form.reset({ nombre: usuario.nombre, email: usuario.email, contrasena: '', idRol: usuario.idRol, metaMensual: 0 });
    // Al editar, la contrasena es opcional.
    this.f['contrasena'].setValidators([Validators.pattern(PATRON_CONTRASENA)]);
    this.f['contrasena'].updateValueAndValidity();
  }

  cancelar(): void {
    this.modo = null;
    this.usuarioEditado = null;
  }

  guardar(): void {
    if (this.form.invalid || this.guardando) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    this.guardando = true;
    const peticion =
      this.modo === 'crear'
        ? this.adminService.crearUsuario({
            nombre: valores.nombre.trim(),
            email: valores.email.trim(),
            contrasena: valores.contrasena,
            idRol: Number(valores.idRol),
            metaMensual: Number(valores.idRol) === 2 ? Number(valores.metaMensual) : undefined
          })
        : this.adminService.actualizarUsuario({
            idUsuario: this.usuarioEditado!.idUsuario,
            nombre: valores.nombre.trim(),
            email: valores.email.trim(),
            contrasena: valores.contrasena || undefined
          });
    peticion.subscribe({
      next: (rs) => {
        this.guardando = false;
        mensajeExito(rs.mensaje);
        this.cancelar();
        this.listar();
      },
      error: (error) => {
        this.guardando = false;
        mensajeError(error);
      }
    });
  }

  async cambiarEstado(usuario: Usuario): Promise<void> {
    const activar = usuario.estado === 'INACTIVO';
    const ok = await confirmar(
      activar ? 'Activar usuario' : 'Desactivar usuario',
      activar
        ? `${usuario.nombre} podrá volver a iniciar sesión.`
        : `${usuario.nombre} no podrá iniciar sesión y su sesión actual se cerrará.`,
      activar ? 'Sí, activar' : 'Sí, desactivar'
    );
    if (!ok) {
      return;
    }
    this.adminService.cambiarEstadoUsuario(usuario.idUsuario, activar ? 'ACTIVO' : 'INACTIVO').subscribe({
      next: (rs) => {
        mensajeExito(rs.mensaje);
        this.listar();
      },
      error: (error) => mensajeError(error)
    });
  }

  async cambiarRol(usuario: Usuario, idRol: number): Promise<void> {
    const nombre = idRol === 1 ? 'administrador' : 'asesor';
    if (!(await confirmar('Cambiar rol', `¿Convertir a ${usuario.nombre} en ${nombre}? El cambio aplica en su próximo inicio de sesión.`))) {
      return;
    }
    this.adminService.asignarRol(usuario.idUsuario, idRol).subscribe({
      next: (rs) => {
        mensajeExito(rs.mensaje);
        this.listar();
      },
      error: (error) => mensajeError(error)
    });
  }
}
