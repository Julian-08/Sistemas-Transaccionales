// angular import
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription, interval, startWith, switchMap } from 'rxjs';

// bootstrap import
import { NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { AuthService } from 'src/app/services/auth.service';
import { ComercialService } from 'src/app/demo/pages/comun/service/comercial.service';
import { confirmar } from 'src/app/theme/shared/helpers/mensajes';

const NOMBRE_ROL: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  ASESOR: 'Asesor comercial',
  CLIENTE: 'Cliente'
};

/** Revisa las alertas nuevas cada 60 segundos (RF-008: avisos "en vivo"). */
const INTERVALO_ALERTAS_MS = 60000;

@Component({
  selector: 'app-nav-right',
  imports: [SharedModule, RouterModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss'],
  providers: [NgbDropdownConfig]
})
export class NavRightComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly comercialService = inject(ComercialService);
  private suscripcion?: Subscription;

  readonly sesion = this.auth.sesion;
  alertasNoLeidas = 0;

  constructor() {
    const config = inject(NgbDropdownConfig);
    config.placement = 'bottom-right';
  }

  get verAlertas(): boolean {
    const rol = this.auth.rol();
    return rol === 'ASESOR' || rol === 'ADMINISTRADOR';
  }

  get nombreRol(): string {
    return NOMBRE_ROL[this.auth.rol() ?? ''] ?? '';
  }

  get iniciales(): string {
    const partes = (this.sesion()?.nombre ?? '').trim().split(/\s+/);
    return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || 'Z';
  }

  get rutaInicio(): string {
    return this.auth.rutaInicio();
  }

  ngOnInit(): void {
    if (!this.verAlertas) {
      return;
    }
    this.suscripcion = interval(INTERVALO_ALERTAS_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.comercialService.contarAlertasNoLeidas())
      )
      .subscribe({
        next: (rs) => (this.alertasNoLeidas = rs.noLeidas),
        error: () => (this.alertasNoLeidas = 0)
      });
  }

  ngOnDestroy(): void {
    this.suscripcion?.unsubscribe();
  }

  async cerrarSesion(): Promise<void> {
    if (await confirmar('Cerrar sesión', '¿Desea salir de Zimbra CRM?', 'Sí, salir')) {
      this.auth.cerrarSesion();
    }
  }
}
