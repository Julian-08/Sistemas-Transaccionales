import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ComercialService } from '../service/comercial.service';
import { Alerta } from 'src/app/models/comercial';
import { mensajeError } from 'src/app/theme/shared/helpers/mensajes';

/** Alertas del asesor o del administrador; las no leidas primero (RF-008, RF-011). */
@Component({
  selector: 'app-alertas',
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="zb-encabezado">
      <div>
        <h4>Alertas</h4>
        <p>Avisos cuando un prospecto vuelve al sitio o cuando te asignan uno nuevo.</p>
      </div>
      <div class="form-check form-switch">
        <input id="noLeidas" class="form-check-input" type="checkbox" [(ngModel)]="soloNoLeidas" (change)="listar()" />
        <label class="form-check-label" for="noLeidas">Solo no leídas</label>
      </div>
    </div>

    <div class="card">
      <div class="card-body p-0">
        @if (cargando) {
          <div class="zb-vacio"><span class="spinner-border text-primary"></span></div>
        } @else {
          <ul class="list-group list-group-flush">
            @for (alerta of alertas; track alerta.idAlerta) {
              <li class="list-group-item d-flex align-items-start gap-3 py-3" [class.bg-light]="!alerta.leida">
                <i class="feather mt-1" [ngClass]="alerta.leida ? 'icon-bell text-muted' : 'icon-bell text-warning'"></i>
                <div class="flex-grow-1">
                  <div [class.fw-semibold]="!alerta.leida">{{ alerta.mensaje }}</div>
                  <div class="small text-muted">
                    <a [routerLink]="['/inicio/prospecto', alerta.idCliente]">{{ alerta.nombreCliente }}</a> · {{ alerta.empresa }} ·
                    {{ alerta.fechaHora | date: 'dd/MM/yyyy HH:mm' }}
                  </div>
                </div>
                @if (!alerta.leida) {
                  <button type="button" class="btn btn-sm btn-outline-primary" (click)="marcarLeida(alerta)">Marcar leída</button>
                } @else {
                  <span class="small text-muted">Leída</span>
                }
              </li>
            } @empty {
              <li class="list-group-item zb-vacio"><i class="feather icon-bell-off"></i>No tienes alertas{{ soloNoLeidas ? ' sin leer' : '' }}.</li>
            }
          </ul>
        }
      </div>
    </div>
  `
})
export class AlertasComponent implements OnInit {
  private readonly comercialService = inject(ComercialService);

  alertas: Alerta[] = [];
  soloNoLeidas = false;
  cargando = true;

  ngOnInit(): void {
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.comercialService.listarAlertas(this.soloNoLeidas).subscribe({
      next: (alertas) => {
        this.alertas = alertas;
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        mensajeError(error, 'No fue posible cargar las alertas.');
      }
    });
  }

  marcarLeida(alerta: Alerta): void {
    this.comercialService.marcarAlertaLeida(alerta.idAlerta).subscribe({
      next: () => {
        alerta.leida = true;
        if (this.soloNoLeidas) {
          this.alertas = this.alertas.filter((a) => a.idAlerta !== alerta.idAlerta);
        }
      },
      error: (error) => mensajeError(error)
    });
  }
}
