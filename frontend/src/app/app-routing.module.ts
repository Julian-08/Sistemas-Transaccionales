import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminComponent } from './theme/layout/admin/admin.component';
import { authGuard, inicioRolGuard, invitadoGuard, rolGuard } from './guards/auth.guard';

// Publico
import { LandingComponent } from './demo/pages/publico/landing/landing.component';
import { LoginComponent } from './demo/pages/publico/login/login.component';
import { RegistroComponent } from './demo/pages/publico/registro/registro.component';
import { RecuperarContrasenaComponent } from './demo/pages/publico/recuperar-contrasena/recuperar-contrasena.component';
import { RestablecerContrasenaComponent } from './demo/pages/publico/restablecer-contrasena/restablecer-contrasena.component';

// Administrador
import { PanelAdminComponent } from './demo/pages/administrador/panel/panel-admin.component';
import { UsuariosComponent } from './demo/pages/administrador/usuarios/usuarios.component';
import { AsesoresComponent } from './demo/pages/administrador/asesores/asesores.component';
import { ClientesAdminComponent } from './demo/pages/administrador/clientes/clientes-admin.component';
import { ProspectosAdminComponent } from './demo/pages/administrador/prospectos/prospectos-admin.component';
import { SeguimientosAdminComponent } from './demo/pages/administrador/seguimientos/seguimientos-admin.component';
import { ReportesComponent } from './demo/pages/administrador/reportes/reportes.component';
import { ConfiguracionComponent } from './demo/pages/administrador/configuracion/configuracion.component';

// Asesor
import { PanelAsesorComponent } from './demo/pages/asesor/panel/panel-asesor.component';
import { MisProspectosComponent } from './demo/pages/asesor/prospectos/mis-prospectos.component';
import { PropuestasComponent } from './demo/pages/asesor/propuestas/propuestas.component';

// Comunes (asesor y administrador)
import { CalificadosComponent } from './demo/pages/comun/calificados/calificados.component';
import { ProspectoDetalleComponent } from './demo/pages/comun/prospecto-detalle/prospecto-detalle.component';
import { AlertasComponent } from './demo/pages/comun/alertas/alertas.component';
import { VentasComponent } from './demo/pages/comun/ventas/ventas.component';

// Cliente
import { MiCuentaComponent } from './demo/pages/cliente/mi-cuenta/mi-cuenta.component';
import { MiEmpresaComponent } from './demo/pages/cliente/mi-empresa/mi-empresa.component';
import { PlanesComponent } from './demo/pages/cliente/planes/planes.component';

const ADMIN = { roles: ['ADMINISTRADOR'] };
const ASESOR = { roles: ['ASESOR'] };
const CLIENTE = { roles: ['CLIENTE'] };
const COMERCIAL = { roles: ['ASESOR', 'ADMINISTRADOR'] };

export const routes: Routes = [
  // ---------------------------------------------------------------- publico
  { path: '', component: LandingComponent, pathMatch: 'full', title: 'Zimbra · Colaboración para tu empresa' },
  { path: 'login', component: LoginComponent, canActivate: [invitadoGuard], title: 'Iniciar sesión | Zimbra' },
  { path: 'registro', component: RegistroComponent, canActivate: [invitadoGuard], title: 'Crear cuenta | Zimbra' },
  { path: 'recuperar-contrasena', component: RecuperarContrasenaComponent, title: 'Recuperar contraseña | Zimbra' },
  { path: 'restablecer-contrasena', component: RestablecerContrasenaComponent, title: 'Nueva contraseña | Zimbra' },

  // ------------------------------------------------- privado (requiere sesion)
  {
    path: 'inicio',
    component: AdminComponent,
    canActivate: [authGuard],
    canActivateChild: [rolGuard],
    children: [
      { path: '', pathMatch: 'full', canActivate: [inicioRolGuard], children: [] },

      // Administrador: acceso a todo
      { path: 'admin/panel', component: PanelAdminComponent, data: ADMIN },
      { path: 'admin/usuarios', component: UsuariosComponent, data: ADMIN },
      { path: 'admin/asesores', component: AsesoresComponent, data: ADMIN },
      { path: 'admin/clientes', component: ClientesAdminComponent, data: ADMIN },
      { path: 'admin/calificados', component: CalificadosComponent, data: ADMIN },
      { path: 'admin/prospectos', component: ProspectosAdminComponent, data: ADMIN },
      { path: 'admin/seguimientos', component: SeguimientosAdminComponent, data: ADMIN },
      { path: 'admin/ventas', component: VentasComponent, data: ADMIN },
      { path: 'admin/reportes', component: ReportesComponent, data: ADMIN },
      { path: 'admin/configuracion', component: ConfiguracionComponent, data: ADMIN },

      // Asesor: sus estadisticas y sus clientes
      { path: 'asesor/panel', component: PanelAsesorComponent, data: ASESOR },
      { path: 'asesor/calificados', component: CalificadosComponent, data: ASESOR },
      { path: 'asesor/prospectos', component: MisProspectosComponent, data: ASESOR },
      { path: 'asesor/propuestas', component: PropuestasComponent, data: ASESOR },
      { path: 'asesor/ventas', component: VentasComponent, data: ASESOR },

      // Asesor y administrador
      { path: 'prospecto/:id', component: ProspectoDetalleComponent, data: COMERCIAL },
      { path: 'alertas', component: AlertasComponent, data: COMERCIAL },

      // Cliente
      { path: 'cliente/mi-cuenta', component: MiCuentaComponent, data: CLIENTE },
      { path: 'cliente/mi-empresa', component: MiEmpresaComponent, data: CLIENTE },
      { path: 'cliente/planes', component: PlanesComponent, data: CLIENTE },

      { path: '**', canActivate: [inicioRolGuard], children: [] }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
