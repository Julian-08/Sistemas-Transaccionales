import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from 'src/app/services/auth.service';
import { mensajeExito, textoError } from 'src/app/theme/shared/helpers/mensajes';
import { AccesoMarcaComponent } from '../acceso-marca/acceso-marca.component';

/** Contrasena de minimo 8 caracteres con letras y numeros (igual que el backend, RNF-001). */
export const PATRON_CONTRASENA = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

/** Valida que las dos contrasenas coincidan. */
export function contrasenasIguales(grupo: AbstractControl): ValidationErrors | null {
  const contrasena = grupo.get('contrasena')?.value;
  const confirmacion = grupo.get('confirmacion')?.value;
  return contrasena && confirmacion && contrasena !== confirmacion ? { noCoinciden: true } : null;
}

/** Registro de un cliente desde el sitio web para descargar la prueba de Zimbra. */
@Component({
  selector: 'app-registro',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AccesoMarcaComponent],
  templateUrl: './registro.component.html'
})
export class RegistroComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      empresa: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      contrasena: ['', [Validators.required, Validators.pattern(PATRON_CONTRASENA)]],
      confirmacion: ['', Validators.required],
      aceptaDatos: [false, Validators.requiredTrue]
    },
    { validators: contrasenasIguales }
  );

  cargando = false;
  mensajeError = '';

  get f(): Record<string, AbstractControl> {
    return this.form.controls;
  }

  registrar(): void {
    if (this.form.invalid || this.cargando) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.mensajeError = '';
    const { nombre, empresa, email, contrasena } = this.form.getRawValue();
    this.auth.registrar({ nombre: nombre.trim(), empresa: empresa.trim(), email: email.trim(), contrasena }).subscribe({
      next: async (rs) => {
        this.cargando = false;
        await mensajeExito(rs.mensaje, 'Cuenta creada');
        this.router.navigate(['/login'], { queryParams: { email: email.trim() } });
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = textoError(error, 'No fue posible crear la cuenta.');
      }
    });
  }
}
