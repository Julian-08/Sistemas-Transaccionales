import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClienteService } from '../service/cliente.service';
import { mensajeError, mensajeExito } from 'src/app/theme/shared/helpers/mensajes';

type Plan = 'PAGO_POR_USO' | 'ILIMITADA';

/**
 * Planes y licencias de Zimbra. El cliente puede calcular cual le conviene y
 * pedir que un asesor le ofrezca el plan (queda como actividad FORMULARIO).
 */
@Component({
  selector: 'app-planes',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="zb-encabezado">
      <div>
        <h4>Planes y licencias</h4>
        <p>Elige cómo quieres pagar Zimbra. Un asesor te enviará la propuesta con el valor exacto.</p>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <h6 class="fw-semibold mb-3"><i class="feather icon-sliders me-1"></i> ¿Cuál plan me conviene?</h6>
        <div class="row g-3 align-items-end">
          <div class="col-md-5">
            <label class="form-label" for="personas">¿Cuántas personas usarán Zimbra?</label>
            <input id="personas" type="range" class="form-range" min="1" max="200" [(ngModel)]="personas" />
            <div class="d-flex justify-content-between small text-muted"><span>1</span><strong class="text-dark">{{ personas }} personas</strong><span>200</span></div>
          </div>
          <div class="col-md-4">
            <div class="form-check form-switch">
              <input id="crece" class="form-check-input" type="checkbox" [(ngModel)]="equipoCrece" />
              <label class="form-check-label" for="crece">Mi equipo va a crecer este año</label>
            </div>
          </div>
          <div class="col-md-3">
            <div class="alert alert-primary mb-0 py-2">
              Te recomendamos: <strong>{{ recomendado === 'ILIMITADA' ? 'Ilimitada' : 'Pago por uso' }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      @for (plan of planes; track plan.codigo) {
        <div class="col-md-6 mb-4">
          <div class="card h-100" [class.border-primary]="recomendado === plan.codigo" [style.border-width.px]="recomendado === plan.codigo ? 2 : 1">
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start">
                <h4 class="fw-bold">{{ plan.nombre }}</h4>
                @if (recomendado === plan.codigo) {
                  <span class="zb-estado zb-estado--NUEVO">Recomendado</span>
                }
              </div>
              <p class="text-muted">{{ plan.descripcion }}</p>
              <ul class="list-unstyled flex-grow-1">
                @for (beneficio of plan.beneficios; track beneficio) {
                  <li class="py-1"><i class="feather icon-check text-success me-2"></i>{{ beneficio }}</li>
                }
              </ul>
              <p class="small text-muted">Periodos: {{ plan.periodos }}</p>
              <button type="button" class="btn w-100" [ngClass]="recomendado === plan.codigo ? 'btn-zimbra' : 'btn-outline-primary'"
                [disabled]="solicitados.has(plan.codigo) || enviando" (click)="solicitar(plan.codigo)">
                {{ solicitados.has(plan.codigo) ? 'Solicitud enviada' : 'Quiero este plan' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PlanesComponent {
  private readonly clienteService = inject(ClienteService);

  readonly planes = [
    {
      codigo: 'PAGO_POR_USO' as Plan,
      nombre: 'Pago por uso',
      descripcion: 'Pagas solo por los buzones que realmente usa tu empresa cada periodo.',
      periodos: 'mensual, trimestral o anual',
      beneficios: ['Correo, calendario y contactos', 'Agregas o quitas buzones cuando quieras', 'Soporte por correo', 'Ideal para equipos pequeños o que cambian']
    },
    {
      codigo: 'ILIMITADA' as Plan,
      nombre: 'Ilimitada',
      descripcion: 'Todo tu equipo en Zimbra sin contar usuarios ni preocuparte por cupos.',
      periodos: 'semestral o anual',
      beneficios: ['Usuarios ilimitados', 'Todas las herramientas de colaboración', 'Asesor comercial dedicado', 'Ideal para equipos medianos y grandes']
    }
  ];

  personas = 10;
  equipoCrece = false;
  readonly solicitados = new Set<Plan>();
  enviando = false;

  /** Mas de 25 personas, o un equipo que crece, conviene la licencia ilimitada. */
  get recomendado(): Plan {
    return this.personas > 25 || (this.equipoCrece && this.personas > 10) ? 'ILIMITADA' : 'PAGO_POR_USO';
  }

  solicitar(plan: Plan): void {
    this.enviando = true;
    this.clienteService
      .registrarActividad({ tipoEvento: 'FORMULARIO', urlVisitada: `/cliente/planes/${plan}?personas=${this.personas}`, tiempoPermanenciaSeg: 0 })
      .subscribe({
        next: () => {
          this.enviando = false;
          this.solicitados.add(plan);
          mensajeExito('Un asesor de Zimbra te contactará con la propuesta de este plan.', '¡Solicitud enviada!');
        },
        error: (error) => {
          this.enviando = false;
          mensajeError(error);
        }
      });
  }
}
