import { Rol } from 'src/app/models/sesion';

export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;

  children?: NavigationItem[];
}

const item = (id: string, title: string, url: string, icon: string): NavigationItem => ({
  id,
  title,
  type: 'item',
  url,
  icon: `feather ${icon}`,
  classes: 'nav-item'
});

/**
 * Menu de cada rol (RF-002). Cada usuario solo ve su apartado;
 * las rutas tambien estan protegidas por rol en app-routing (RNF-002).
 */
export const NAVEGACION_POR_ROL: Record<Rol, NavigationItem[]> = {
  ADMINISTRADOR: [
    {
      id: 'admin-inicio',
      title: 'Administración',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        item('admin-panel', 'Panel general', '/inicio/admin/panel', 'icon-home'),
        item('admin-usuarios', 'Usuarios y asesores', '/inicio/admin/usuarios', 'icon-users'),
        item('admin-asesores', 'Metas de asesores', '/inicio/admin/asesores', 'icon-target'),
        item('admin-clientes', 'Clientes', '/inicio/admin/clientes', 'icon-briefcase')
      ]
    },
    {
      id: 'admin-comercial',
      title: 'Gestión comercial',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        item('admin-calificados', 'Listos para plan de pago', '/inicio/admin/calificados', 'icon-star'),
        item('admin-prospectos', 'Prospectos y asignación', '/inicio/admin/prospectos', 'icon-user-check'),
        item('admin-seguimientos', 'Seguimientos', '/inicio/admin/seguimientos', 'icon-phone-call'),
        item('admin-ventas', 'Ventas de licencias', '/inicio/admin/ventas', 'icon-credit-card'),
        item('admin-alertas', 'Alertas', '/inicio/alertas', 'icon-bell')
      ]
    },
    {
      id: 'admin-analisis',
      title: 'Análisis y ajustes',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        item('admin-reportes', 'Reportes', '/inicio/admin/reportes', 'icon-bar-chart-2'),
        item('admin-configuracion', 'Configuración', '/inicio/admin/configuracion', 'icon-settings')
      ]
    }
  ],
  ASESOR: [
    {
      id: 'asesor-inicio',
      title: 'Mi gestión',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        item('asesor-panel', 'Mis estadísticas', '/inicio/asesor/panel', 'icon-activity'),
        item('asesor-calificados', 'Listos para plan de pago', '/inicio/asesor/calificados', 'icon-star'),
        item('asesor-prospectos', 'Mis prospectos', '/inicio/asesor/prospectos', 'icon-user-check'),
        item('asesor-alertas', 'Alertas', '/inicio/alertas', 'icon-bell')
      ]
    },
    {
      id: 'asesor-comercial',
      title: 'Ventas',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        item('asesor-propuestas', 'Propuestas', '/inicio/asesor/propuestas', 'icon-file-text'),
        item('asesor-ventas', 'Mis ventas', '/inicio/asesor/ventas', 'icon-credit-card')
      ]
    }
  ],
  CLIENTE: [
    {
      id: 'cliente-inicio',
      title: 'Mi Zimbra',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        item('cliente-cuenta', 'Mi cuenta y prueba', '/inicio/cliente/mi-cuenta', 'icon-user'),
        item('cliente-empresa', 'Zimbra en mi empresa', '/inicio/cliente/mi-empresa', 'icon-briefcase'),
        item('cliente-planes', 'Planes y licencias', '/inicio/cliente/planes', 'icon-award')
      ]
    }
  ]
};

/** Menu del rol, o vacio si no hay sesion. */
export function navegacionPorRol(rol: Rol | null): NavigationItem[] {
  return rol ? NAVEGACION_POR_ROL[rol] : [];
}
