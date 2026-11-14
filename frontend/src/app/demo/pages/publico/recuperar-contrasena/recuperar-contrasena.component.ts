import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AuthService } from 'src/app/services/auth.service';
import { textoError } from 'src/app/theme/shared/helpers/mensajes';
import { AccesoMarcaComponent } from '../acceso-marca/acceso-marca.component';

/**
 * Solicitud del codigo para recuperar la contrasena (RF-003).
 * En desarrollo el backend devuelve el codigo y se muestra aqui (no hay correo).
 */
@Component({
  selector: 'app-recuperar-contrasena',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AccesoMarcaComponent],
  template: `
    <div class="zb-acceso">
      <app-acceso-marca titulo="Recupera tu acceso" texto="Te daremos un código para que definas una nueva contraseña." />
      <div class="zb-acceso__formulario">
        <div class="zb-acceso__tarjeta">
          <a routerLink="/login" class="zb-acceso__volver"><i class="feather icon-arrow-left"></i> Volver a iniciar sesión</a>
          <h3>¿Olvidaste tu contraseña?</h3>
          <p class="text-muted mb-4">Escribe el correo de tu cuenta.</p>

          @if (codigo) {
            <div class="alert alert-success" role="status">
              <div class="mb-2">Tu código de recuperación es:</div>
              <div class="fs-3 fw-bold text-center mb-2" style="letter-spacing: 4px">{{ codigo }}</div>
              <div class="small">Vence en {{ minutos }} minutos y solo se puede usar una vez.</div>
            </div>
            <a class="btn btn-zimbra w-100 mb-3" routerLink="/restablecer-contrasena"
               [queryParams]="{ email: emailEnviado, codigo: codigo }">Restablecer contraseña</a>
          } @else if (mensaje) {
            <div class="alert alert-success py-2" role="status">{{ mensaje }}</div>
            <a class="d-block text-center mb-3" routerLink="/restablecer-contrasena" [queryParams]="{ email: emailEnviado }">
              Ya tengo un código
            </a>
          }
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
            <button type="submit" class="btn w-100" [class.btn-zimbra]="!codigo" [class.btn-outline-secondary]="codigo"
              [disabled]="cargando">
              {{ cargando ? 'Generando...' : codigo ? 'Generar otro código' : 'Obtener código' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class RecuperarContrasenaComponent {
  private readonly auth = inject(AuthService);
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  cargando = false;
  mensaje = '';
  mensajeError = '';
  codigo = '';
  minutos = 15;
  emailEnviado = '';

  enviar(): void {
    if (this.form.invalid || this.cargando) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.mensaje = '';
    this.mensajeError = '';
    this.codigo = '';
    const email = this.form.getRawValue().email.trim();
    this.auth.recuperarContrasena(email).subscribe({
      next: (rs) => {
        this.cargando = false;
        this.emailEnviado = email;
        // RF-003 A1: sin codigo, el mensaje no revela si el correo existe.
        this.mensaje = rs.mensaje;
        this.codigo = rs.codigo ?? '';
        this.minutos = rs.minutosVigencia ?? this.minutos;
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = textoError(error);
      }
    });
  }
}
