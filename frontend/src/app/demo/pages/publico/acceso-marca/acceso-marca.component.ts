import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

/** Panel izquierdo con la marca de Zimbra que comparten las pantallas de acceso. */
@Component({
  selector: 'app-acceso-marca',
  imports: [RouterModule],
  template: `
    <div class="zb-acceso__marca">
      <a routerLink="/" class="zb-acceso__logo">
        <img src="assets/images/logo-zimbra.svg" alt="" />
        Zimbra CRM
      </a>
      <div>
        <h2>{{ titulo() }}</h2>
        <p>{{ texto() }}</p>
        <ul>
          <li>Correo, calendario y contactos en una sola suite.</li>
          <li>Prueba gratuita de 60 días.</li>
          <li>Un asesor comercial te acompaña en el proceso.</li>
        </ul>
      </div>
      <small>© 2026 Zimbra CRM</small>
    </div>
  `
})
export class AccesoMarcaComponent {
  titulo = input('La colaboración de tu empresa, en un solo lugar');
  texto = input('Ingresa para continuar con tu gestión en Zimbra.');
}
