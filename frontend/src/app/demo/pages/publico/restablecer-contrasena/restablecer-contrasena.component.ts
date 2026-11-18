import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthService } from 'src/app/services/auth.service';
import { mensajeExito, textoError } from 'src/app/theme/shared/helpers/mensajes';
import { AccesoMarcaComponent } from '../acceso-marca/acceso-marca.component';
import { PATRON_CONTRASENA, contrasenasIguales } from '../registro/registro.component';

/**
 * Define la nueva contrasena con el correo y el codigo de recuperacion (RF-003).
 * Puede llegar con ?email=... para dejar el correo lleno.
 */
@Component({
  selector: 'app-restablecer-contrasena',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AccesoMarcaComponent],
  template: `
    <div class="zb-acceso">
      <app-acceso-marca titulo="Define tu nueva contraseña" texto="El código dura 15 minutos y solo se puede usar una vez." />
      <div class="zb-acceso__formulario">
        <div class="zb-acceso__tarjeta">
          <a routerLink="/login" class="zb-acceso__volver"><i class="feather icon-arrow-left"></i> Volver a iniciar sesión</a>
          <h3>Nueva contraseña</h3>
          @if (mensajeEnvio) {
            <div class="alert alert-info py-2" role="status">
              <i class="feather icon-mail me-1"></i>{{ mensajeEnvio }} El código vence en {{ minutos }} minutos.
            </div>
          }
          <p class="text-muted mb-4">
            Escribe el código de verificación que recibiste. ¿No te llegó?
            <a routerLink="/recuperar-contrasena">Solicita uno nuevo</a>.
          </p>
          @if (mensajeError) {
            <div class="alert alert-danger py-2" role="alert">{{ mensajeError }}</div>
          }
          <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
            <div class="mb-3">
              <label class="form-label" for="email">Correo electrónico</label>
              <input id="email" type="email" class="form-control" formControlName="email" autocomplete="email"
                [class.is-invalid]="form.controls.email.touched && form.controls.email.invalid" />
              <div class="invalid-feedback">Ingresa un correo válido.</div>
            </div>
            <div class="mb-3">
              <label class="form-label" for="codigo">Código de recuperación</label>
              <input id="codigo" type="text" class="form-control text-uppercase" formControlName="codigo"
                autocomplete="one-time-code" placeholder="XXXX-XXXX" maxlength="9" style="letter-spacing: 2px"
                [class.is-invalid]="form.controls.codigo.touched && form.controls.codigo.invalid" />
              <div class="invalid-feedback">El código tiene 8 caracteres.</div>
            </div>
            <div class="mb-3">
              <label class="form-label" for="contrasena">Nueva contraseña</label>
              <input id="contrasena" type="password" class="form-control" formControlName="contrasena" autocomplete="new-password"
                [class.is-invalid]="form.controls.contrasena.touched && form.controls.contrasena.invalid" />
              <div class="invalid-feedback">Mínimo 8 caracteres, con letras y números.</div>
            </div>
            <div class="mb-4">
              <label class="form-label" for="confirmacion">Confirmar contraseña</label>
              <input id="confirmacion" type="password" class="form-control" formControlName="confirmacion" autocomplete="new-password"
                [class.is-invalid]="form.controls.confirmacion.touched && (form.controls.confirmacion.invalid || form.hasError('noCoinciden'))" />
              <div class="invalid-feedback">Las contraseñas no coinciden.</div>
            </div>
            <button type="submit" class="btn btn-zimbra w-100" [disabled]="cargando">
              {{ cargando ? 'Guardando...' : 'Guardar contraseña' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class RestablecerContrasenaComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly form = inject(FormBuilder).nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      codigo: ['', [Validators.required, Validators.pattern(/^\s*[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}\s*$/)]],
      contrasena: ['', [Validators.required, Validators.pattern(PATRON_CONTRASENA)]],
      confirmacion: ['', Validators.required]
    },
    { validators: contrasenasIguales }
  );

  cargando = false;
  mensajeError = '';
  /** Aviso que llega desde "olvidé mi contraseña" (no viaja en la URL). */
  mensajeEnvio = '';
  minutos = 15;

  ngOnInit(): void {
    // Solo el correo llega en la URL; el codigo lo escribe el usuario.
    this.form.patchValue({ email: this.route.snapshot.queryParamMap.get('email') ?? '' });
    const estado = this.router.getCurrentNavigation()?.extras.state ?? history.state;
    if (estado?.mensaje) {
      this.mensajeEnvio = estado.mensaje;
      this.minutos = estado.minutos ?? this.minutos;
    }
  }

  guardar(): void {
    if (this.form.invalid || this.cargando) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.mensajeError = '';
    const { email, codigo, contrasena } = this.form.getRawValue();
    this.auth.restablecerContrasena(email.trim(), codigo.trim(), contrasena).subscribe({
      next: async (rs) => {
        this.cargando = false;
        await mensajeExito(rs.mensaje, 'Contraseña actualizada');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = textoError(error);
      }
    });
  }
}
