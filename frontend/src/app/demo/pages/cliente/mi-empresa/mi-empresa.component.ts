import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ClienteService } from '../service/cliente.service';
import { mensajeError, mensajeExito } from 'src/app/theme/shared/helpers/mensajes';

interface PasoGuia {
  icono: string;
  titulo: string;
  resumen: string;
  detalle: string[];
}

/**
 * Guia para llevar Zimbra a la empresa del cliente. Cada paso que abre y la
 * solicitud de acompanamiento quedan registrados como actividad (suma interes, RF-005/RF-006).
 */
@Component({
  selector: 'app-mi-empresa',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="zb-encabezado">
      <div>
        <h4>Zimbra en mi empresa</h4>
        <p>Sigue estos pasos para que todo tu equipo trabaje en Zimbra.</p>
      </div>
      <div class="text-end">
        <div class="small text-muted mb-1">{{ vistos.size }} de {{ pasos.length }} pasos revisados</div>
        <div class="zb-barra" style="width: 220px"><span [style.width.%]="(vistos.size / pasos.length) * 100"></span></div>
      </div>
    </div>

    <div class="row">
      <div class="col-lg-8">
        @for (paso of pasos; track paso.titulo; let i = $index) {
          <div class="card mb-3" [class.border-primary]="abierto === i">
            <button type="button" class="card-body d-flex align-items-center gap-3 text-start border-0 bg-transparent w-100" (click)="abrir(i)"
              [attr.aria-expanded]="abierto === i">
              <span class="zb-indicador p-0 border-0" [ngClass]="vistos.has(i) ? 'zb-indicador--verde' : ''">
                <i class="feather" [ngClass]="vistos.has(i) ? 'icon-check' : paso.icono"></i>
              </span>
              <span class="flex-grow-1">
                <strong class="d-block">{{ i + 1 }}. {{ paso.titulo }}</strong>
                <span class="text-muted small">{{ paso.resumen }}</span>
              </span>
              <i class="feather" [ngClass]="abierto === i ? 'icon-chevron-up' : 'icon-chevron-down'"></i>
            </button>
            @if (abierto === i) {
              <div class="card-body pt-0">
                <ol class="mb-0">
                  @for (linea of paso.detalle; track linea) {
                    <li class="mb-1">{{ linea }}</li>
                  }
                </ol>
              </div>
            }
          </div>
        }
      </div>

      <div class="col-lg-4">
        <div class="card">
          <div class="card-body text-center">
            <i class="feather icon-headphones text-primary" style="font-size: 36px"></i>
            <h5 class="mt-3">¿Necesitas ayuda?</h5>
            <p class="text-muted">Un asesor comercial de Zimbra puede acompañarte en la configuración y la migración de tu equipo.</p>
            <button type="button" class="btn btn-zimbra w-100" [disabled]="solicitado || enviando" (click)="solicitarAsesor()">
              {{ solicitado ? 'Solicitud enviada' : enviando ? 'Enviando...' : 'Quiero que un asesor me contacte' }}
            </button>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h6 class="fw-semibold">¿Listo para tu equipo completo?</h6>
            <p class="text-muted small">Compara el plan de pago por uso con la licencia ilimitada.</p>
            <a routerLink="/inicio/cliente/planes" class="btn btn-outline-primary w-100">Ver planes</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MiEmpresaComponent {
  private readonly clienteService = inject(ClienteService);

  readonly pasos: PasoGuia[] = [
    {
      icono: 'icon-globe',
      titulo: 'Conecta el dominio de tu empresa',
      resumen: 'Usa tu propio dominio para que los correos lleguen a nombre de tu empresa.',
      detalle: [
        'Ingresa al panel de tu proveedor de dominio.',
        'Crea los registros MX que apuntan al servidor de Zimbra.',
        'Agrega los registros SPF y DKIM para que tus correos no lleguen a spam.',
        'Espera la propagación (puede tardar algunas horas) y verifica el dominio.'
      ]
    },
    {
      icono: 'icon-users',
      titulo: 'Crea los buzones de tu equipo',
      resumen: 'Un buzón por persona, con su cuota y su contraseña.',
      detalle: [
        'Define quiénes de tu equipo necesitan correo.',
        'Crea cada buzón con el formato nombre.apellido@tuempresa.com.',
        'Agrupa a las personas en listas de distribución por área (ventas, soporte, gerencia).',
        'Comparte con cada persona sus datos de acceso de forma segura.'
      ]
    },
    {
      icono: 'icon-download',
      titulo: 'Migra correos y contactos',
      resumen: 'Trae tus mensajes y libretas de direcciones del sistema anterior.',
      detalle: [
        'Exporta los correos de tu proveedor actual (IMAP o archivo .pst).',
        'Importa los mensajes en cada buzón de Zimbra.',
        'Exporta los contactos en formato CSV o vCard e impórtalos.',
        'Revisa que las carpetas y los contactos estén completos.'
      ]
    },
    {
      icono: 'icon-calendar',
      titulo: 'Organiza calendarios compartidos',
      resumen: 'Agenda reuniones y comparte la disponibilidad del equipo.',
      detalle: [
        'Crea un calendario por área o por proyecto.',
        'Compártelo con permisos de lectura o de edición.',
        'Reserva salas y recursos desde el mismo calendario.',
        'Invita a tu equipo a la primera reunión desde Zimbra.'
      ]
    },
    {
      icono: 'icon-smartphone',
      titulo: 'Configura los celulares',
      resumen: 'Correo, calendario y contactos sincronizados en el móvil.',
      detalle: [
        'Agrega una cuenta de Exchange o IMAP en el celular.',
        'Usa el servidor y el correo de Zimbra de cada persona.',
        'Activa la sincronización de calendario y contactos.'
      ]
    },
    {
      icono: 'icon-award',
      titulo: 'Capacita a tu equipo',
      resumen: 'Que todos aprovechen las herramientas desde el primer día.',
      detalle: [
        'Comparte esta guía con tu equipo.',
        'Muestra cómo usar las carpetas, los filtros y la búsqueda.',
        'Enseña a compartir calendarios y documentos.',
        'Define a una persona de contacto para resolver dudas internas.'
      ]
    }
  ];

  abierto: number | null = null;
  readonly vistos = new Set<number>();
  solicitado = false;
  enviando = false;

  abrir(indice: number): void {
    this.abierto = this.abierto === indice ? null : indice;
    if (this.abierto !== null && !this.vistos.has(indice)) {
      this.vistos.add(indice);
      this.clienteService.registrarVisita(`/cliente/mi-empresa/paso-${indice + 1}`, 0);
    }
  }

  solicitarAsesor(): void {
    this.enviando = true;
    this.clienteService
      .registrarActividad({ tipoEvento: 'FORMULARIO', urlVisitada: '/cliente/mi-empresa/solicitar-asesor', tiempoPermanenciaSeg: 0 })
      .subscribe({
        next: () => {
          this.enviando = false;
          this.solicitado = true;
          mensajeExito('Recibimos tu solicitud. Un asesor de Zimbra te contactará pronto.');
        },
        error: (error) => {
          this.enviando = false;
          mensajeError(error);
        }
      });
  }
}
