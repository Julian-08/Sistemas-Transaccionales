// angular import
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, filter } from 'rxjs';

// project import
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { NavigationComponent } from './navigation/navigation.component';
import { ConfigurationComponent } from 'src/app/theme/layout/admin/configuration/configuration.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { AuthService } from 'src/app/services/auth.service';
import { ClienteService } from 'src/app/demo/pages/cliente/service/cliente.service';

/** Minutos por defecto si la sesion no trae el valor del backend. */
const MINUTOS_INACTIVIDAD_DEFECTO = 15;

/**
 * Layout de las paginas internas (despues de iniciar sesion).
 * - Cierra la sesion tras los minutos de inactividad (RNF-003).
 * - Si el usuario es cliente, registra cada pagina visitada y el tiempo de
 *   permanencia (RF-005), en segundo plano (RNF-006).
 */
@Component({
  selector: 'app-admin',
  imports: [NavBarComponent, NavigationComponent, RouterModule, CommonModule, ConfigurationComponent, BreadcrumbsComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly clienteService = inject(ClienteService);

  // public props
  navCollapsed: any;
  navCollapsedMob: boolean;
  windowWidth: number;

  private temporizadorInactividad?: ReturnType<typeof setTimeout>;
  private suscripcionRutas?: Subscription;
  private paginaActual = '';
  private inicioPagina = Date.now();

  // constructor
  constructor() {
    this.windowWidth = window.innerWidth;
    this.navCollapsedMob = false;
  }

  ngOnInit(): void {
    this.reiniciarInactividad();
    if (this.auth.rol() === 'CLIENTE') {
      this.paginaActual = this.router.url;
      this.suscripcionRutas = this.router.events
        .pipe(filter((evento) => evento instanceof NavigationEnd))
        .subscribe((evento) => this.registrarVisita((evento as NavigationEnd).urlAfterRedirects));
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizadorInactividad);
    this.suscripcionRutas?.unsubscribe();
  }

  /** Cualquier actividad del usuario reinicia el conteo de inactividad. */
  @HostListener('document:mousemove')
  @HostListener('document:keydown')
  @HostListener('document:click')
  @HostListener('document:scroll')
  reiniciarInactividad(): void {
    clearTimeout(this.temporizadorInactividad);
    const minutos = this.auth.sesion()?.minutosInactividad || MINUTOS_INACTIVIDAD_DEFECTO;
    this.temporizadorInactividad = setTimeout(() => this.auth.cerrarSesion('inactividad'), minutos * 60 * 1000);
  }

  /** Envia la pagina anterior con su tiempo de permanencia y empieza a medir la nueva. */
  private registrarVisita(nuevaPagina: string): void {
    if (nuevaPagina === this.paginaActual) {
      return;
    }
    const segundos = Math.round((Date.now() - this.inicioPagina) / 1000);
    if (this.paginaActual) {
      this.clienteService.registrarVisita(this.paginaActual, segundos);
    }
    this.paginaActual = nuevaPagina;
    this.inicioPagina = Date.now();
  }

  // public method
  navMobClick() {
    if (this.navCollapsedMob && !document.querySelector('app-navigation.pcoded-navbar')?.classList.contains('mob-open')) {
      this.navCollapsedMob = !this.navCollapsedMob;
      setTimeout(() => {
        this.navCollapsedMob = !this.navCollapsedMob;
      }, 100);
    } else {
      this.navCollapsedMob = !this.navCollapsedMob;
    }
  }

  // this is for eslint rule
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenu();
    }
  }

  closeMenu() {
    const navigation = document.querySelector('app-navigation.pcoded-navbar');
    if (navigation?.classList.contains('mob-open')) {
      navigation.classList.remove('mob-open');
    }
  }
}
