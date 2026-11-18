import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from 'src/app/services/auth.service';
import { textoError } from 'src/app/theme/shared/helpers/mensajes';
import { AccesoMarcaComponent } from '../acceso-marca/acceso-marca.component';

/**
 * Solicitud del codigo para recuperar la contrasena (RF-003).
 * El codigo nunca se muestra aqui: llega por correo. Al pedirlo se pasa
 * a la pantalla donde se escribe el codigo y la nueva contrasena.
 */
@Component({
  selector: 'app-recuperar-contrasena',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AccesoMarcaComponent],
  template: `
    <div class="zb-acceso">
      <app-acceso-marca titulo="Recupera tu acceso" texto="Te enviaremos un código de verificación para que definas una nueva contraseña." />
      <div class="zb-acceso__formulario">
        <div class="zb-acceso__tarjeta">
          <a routerLink="/login" class="zb-acceso__volver"><i class="feather icon-arrow-left"></i> Volver a iniciar sesión</a>
          <h3>¿Olvidaste tu contraseña?</h3>
          <p class="text-muted mb-4">Escribe el correo de tu cuenta y te enviaremos un código de verificación.</p>

          @if (mensajeError) {
            <div class="alert alert-danger py-2" role="alert">{{ mensajeError }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
            <div class="mb-4">
              <label class="form-label" for="email">Correo electrónico</label>
              <input id="email" type="email" class="form-control" formControlName="email" autocomplete="email"
                [class.is-invalid]="form.controls.email.touched && form.controls.email.invalid" />
              <div class="invalid-feedback">Ingresa un correo válido.</div>
            </div>
            <button type="submit" class="btn btn-zimbra w-100" [disabled]="cargando">
              {{ cargando ? 'Enviando...' : 'Enviar código' }}
            </button>
          </form>
          <a class="d-block text-center mt-3" routerLink="/restablecer-contrasena">Ya tengo un código</a>
        </div>
      </div>
    </div>
  `
})
export class RecuperarContrasenaComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  cargando = false;
  mensajeError = '';

  enviar(): void {
    if (this.form.invalid || this.cargando) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.mensajeError = '';
    const email = this.form.getRawValue().email.trim();
    this.auth.recuperarContrasena(email).subscribe({
      next: (rs) => {
        this.cargando = false;
        // RF-003 A1: la misma respuesta exista o no la cuenta.
        this.router.navigate(['/restablecer-contrasena'], {
          queryParams: { email },
          state: { mensaje: rs.mensaje, minutos: rs.minutosVigencia }
        });
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = textoError(error);
      }
    });
  }
}
