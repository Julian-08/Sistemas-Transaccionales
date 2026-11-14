import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthService } from 'src/app/services/auth.service';
import { textoError } from 'src/app/theme/shared/helpers/mensajes';
import { AccesoMarcaComponent } from '../acceso-marca/acceso-marca.component';

/** Inicio de sesion con correo y contrasena (RF-001). */
@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AccesoMarcaComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    contrasena: ['', Validators.required]
  });

  cargando = false;
  verContrasena = false;
  mensajeError = '';
  aviso = '';

  get f(): Record<string, AbstractControl> {
    return this.form.controls;
  }

  ngOnInit(): void {
    const motivo = this.route.snapshot.queryParamMap.get('sesion');
    if (motivo === 'inactividad') {
      this.aviso = 'Tu sesión se cerró por inactividad. Ingresa de nuevo para continuar.';
    } else if (motivo === 'expirada') {
      this.aviso = 'Tu sesión expiró. Ingresa de nuevo para continuar.';
    }
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.form.patchValue({ email });
    }
  }

  ingresar(): void {
    if (this.form.invalid || this.cargando) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.mensajeError = '';
    const { email, contrasena } = this.form.getRawValue();
    this.auth.login(email.trim(), contrasena).subscribe({
      next: (rs) => {
        this.cargando = false;
        this.router.navigateByUrl(this.auth.rutaInicio(rs.rol));
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = textoError(error, 'No fue posible iniciar sesión.');
      }
    });
  }
}
