/**
 * Busqueda y paginacion en memoria para las tablas, con la misma logica del
 * proyecto de referencia (terminoBusqueda, paginaActual, registrosPorPagina).
 */
export class ListaPaginada<T> {
  registros: T[] = [];
  terminoBusqueda = '';
  paginaActual = 1;

  /**
   * @param campos             funcion que devuelve los textos de un registro donde se busca.
   * @param registrosPorPagina registros que se muestran por pagina.
   */
  constructor(
    private readonly campos: (registro: T) => unknown[],
    readonly registrosPorPagina = 10
  ) {}

  cargar(registros: T[]): void {
    this.registros = registros ?? [];
    this.paginaActual = 1;
  }

  buscar(termino: string): void {
    this.terminoBusqueda = termino;
    this.paginaActual = 1;
  }

  get filtrados(): T[] {
    const termino = normalizarTexto(this.terminoBusqueda.trim());
    if (!termino) {
      return this.registros;
    }
    return this.registros.filter((registro) =>
      this.campos(registro).some((valor) => normalizarTexto(String(valor ?? '')).includes(termino))
    );
  }

  get paginados(): T[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.filtrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.filtrados.length / this.registrosPorPagina));
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }
}

/** Quita tildes y pasa a minusculas para buscar sin importar acentos. */
export function normalizarTexto(texto: string): string {
  return texto
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
