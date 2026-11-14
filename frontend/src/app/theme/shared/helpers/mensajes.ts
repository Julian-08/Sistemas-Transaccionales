import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

/** Color principal de Zimbra para los botones de SweetAlert. */
const COLOR_ZIMBRA = '#0b5cad';

/** Extrae el mensaje claro que envia el backend (GlobalExceptionHandler). */
export function textoError(error: unknown, porDefecto = 'Ocurrió un error. Intente de nuevo.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No hay conexión con el servidor. Verifique que el backend esté encendido.';
    }
    const cuerpo = error.error as { message?: string; mensaje?: string } | null;
    return cuerpo?.message || cuerpo?.mensaje || porDefecto;
  }
  return porDefecto;
}

export function mensajeExito(texto: string, titulo = 'Listo'): Promise<unknown> {
  return Swal.fire({ icon: 'success', title: titulo, text: texto, confirmButtonColor: COLOR_ZIMBRA, timer: 2500 });
}

export function mensajeError(error: unknown, porDefecto?: string): Promise<unknown> {
  return Swal.fire({ icon: 'error', title: 'No se pudo completar', text: textoError(error, porDefecto), confirmButtonColor: COLOR_ZIMBRA });
}

export function mensajeInfo(texto: string, titulo = 'Información'): Promise<unknown> {
  return Swal.fire({ icon: 'info', title: titulo, text: texto, confirmButtonColor: COLOR_ZIMBRA });
}

/** Pide confirmacion antes de una accion importante; devuelve true si el usuario acepta. */
export async function confirmar(titulo: string, texto: string, botonConfirmar = 'Sí, continuar'): Promise<boolean> {
  const resultado = await Swal.fire({
    icon: 'question',
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: botonConfirmar,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: COLOR_ZIMBRA,
    reverseButtons: true
  });
  return resultado.isConfirmed;
}
