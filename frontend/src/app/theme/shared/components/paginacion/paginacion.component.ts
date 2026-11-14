import { Component, computed, input, output } from '@angular/core';

/** Paginacion simple para las tablas (Anterior, numeros, Siguiente). */
@Component({
  selector: 'app-paginacion',
  standalone: true,
  template: `
    @if (totalPaginas() > 1) {
      <nav aria-label="Paginación" class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
        <small class="text-muted">{{ totalRegistros() }} registros · página {{ pagina() }} de {{ totalPaginas() }}</small>
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" [class.disabled]="pagina() === 1">
            <button type="button" class="page-link" (click)="cambiar.emit(pagina() - 1)">Anterior</button>
          </li>
          @for (numero of paginas(); track numero) {
            <li class="page-item" [class.active]="numero === pagina()">
              <button type="button" class="page-link" (click)="cambiar.emit(numero)">{{ numero }}</button>
            </li>
          }
          <li class="page-item" [class.disabled]="pagina() === totalPaginas()">
            <button type="button" class="page-link" (click)="cambiar.emit(pagina() + 1)">Siguiente</button>
          </li>
        </ul>
      </nav>
    } @else if (totalRegistros() > 0) {
      <small class="text-muted d-block mt-3">{{ totalRegistros() }} registros</small>
    }
  `
})
export class PaginacionComponent {
  pagina = input.required<number>();
  totalPaginas = input.required<number>();
  totalRegistros = input<number>(0);
  cambiar = output<number>();

  paginas = computed(() => {
    const total = this.totalPaginas();
    const actual = this.pagina();
    const desde = Math.max(1, Math.min(actual - 2, total - 4));
    const hasta = Math.min(total, desde + 4);
    return Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);
  });
}
