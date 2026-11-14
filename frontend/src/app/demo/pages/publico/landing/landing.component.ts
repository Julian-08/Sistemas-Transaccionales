import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from 'src/app/services/auth.service';

/**
 * Pagina publica de Zimbra: presenta la suite y lleva a crear cuenta o iniciar sesion.
 * Es la puerta de entrada del modelo del caso: atraer visitas y ofrecer la prueba de 60 dias.
 */
@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  private readonly auth = inject(AuthService);

  readonly haySesion = this.auth.estaAutenticado();
  readonly rutaInicio = this.auth.rutaInicio();

  readonly caracteristicas = [
    {
      icono: 'icon-mail',
      titulo: 'Correo empresarial',
      texto: 'Buzones con tu dominio, filtros, carpetas compartidas y búsqueda rápida en todos tus mensajes.'
    },
    {
      icono: 'icon-calendar',
      titulo: 'Calendarios compartidos',
      texto: 'Agenda reuniones, revisa la disponibilidad de tu equipo y comparte calendarios por área.'
    },
    {
      icono: 'icon-users',
      titulo: 'Contactos y grupos',
      texto: 'Libreta de direcciones global de la empresa y listas de distribución para cada equipo.'
    },
    {
      icono: 'icon-folder',
      titulo: 'Documentos y tareas',
      texto: 'Guarda archivos, comparte documentos y organiza las tareas del equipo en un solo lugar.'
    },
    {
      icono: 'icon-globe',
      titulo: 'Funciona en cualquier navegador',
      texto: 'Chrome, Firefox, Edge o Safari, en el computador o en el celular. Sin complementos.'
    },
    {
      icono: 'icon-unlock',
      titulo: 'Código abierto',
      texto: 'Basado en estándares abiertos: sin amarrarte a un proveedor y fácil de integrar.'
    }
  ];

  readonly pasos = [
    { titulo: 'Crea tu cuenta', texto: 'Regístrate con el correo y el nombre de tu empresa en menos de un minuto.' },
    { titulo: 'Descarga la prueba', texto: 'Usa Zimbra completo durante 60 días sin costo y sin compromiso.' },
    { titulo: 'Te acompañamos', texto: 'Un asesor comercial resuelve tus dudas y te ayuda a migrar a tu equipo.' },
    { titulo: 'Elige tu plan', texto: 'Pago por uso o usuarios ilimitados: escoge la licencia que más te conviene.' }
  ];

  readonly planes = [
    {
      nombre: 'Pago por uso',
      descripcion: 'Ideal para empresas que están empezando o con equipos que cambian de tamaño.',
      destacado: false,
      beneficios: ['Pagas solo por los buzones activos', 'Correo, calendario y contactos', 'Soporte por correo', 'Periodo mensual, trimestral o anual']
    },
    {
      nombre: 'Ilimitada',
      descripcion: 'Para equipos que quieren a todas sus personas en Zimbra sin contar usuarios.',
      destacado: true,
      beneficios: ['Usuarios ilimitados', 'Todas las herramientas de colaboración', 'Asesor comercial dedicado', 'Periodo semestral o anual']
    }
  ];
}
