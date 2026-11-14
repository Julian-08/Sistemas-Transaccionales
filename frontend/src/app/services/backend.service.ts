import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Clave de localStorage donde se guarda el token JWT. */
export const CLAVE_TOKEN = 'token';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(private http: HttpClient) {}

  /**
   * Construye los headers con el token JWT guardado en localStorage
   * (Authorization: Bearer token), igual que en el proyecto de referencia.
   */
  construirHeader(json = true): HttpHeaders {
    const tokenRecuperado = localStorage.getItem(CLAVE_TOKEN) || '';
    let headers = new HttpHeaders();
    if (json) {
      headers = headers.set('Content-Type', 'application/json');
    }
    if (tokenRecuperado) {
      headers = headers.set('Authorization', `Bearer ${tokenRecuperado}`);
    }
    return headers;
  }

  // Servicio generico para realizar peticiones GET al backend.
  get<T>(urlApi: string, endpoint: string, service: string, routerParams?: HttpParams): Observable<T> {
    return this.http.get<T>(`${urlApi}/${endpoint}/${service}`, {
      params: routerParams,
      headers: this.construirHeader(false)
    });
  }

  // Servicio generico para realizar peticiones POST al backend.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post<T>(urlApi: string, endpoint: string, service: string, data: any): Observable<T> {
    return this.http.post<T>(`${urlApi}/${endpoint}/${service}`, data ?? {}, {
      headers: this.construirHeader()
    });
  }

  // Servicio generico para realizar peticiones PUT al backend.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put<T>(urlApi: string, endpoint: string, service: string, data: any): Observable<T> {
    return this.http.put<T>(`${urlApi}/${endpoint}/${service}`, data ?? {}, {
      headers: this.construirHeader()
    });
  }

  // Servicio generico para descargar archivos (por ejemplo, reportes CSV).
  getArchivo(urlApi: string, endpoint: string, service: string, routerParams?: HttpParams): Observable<Blob> {
    return this.http.get(`${urlApi}/${endpoint}/${service}`, {
      params: routerParams,
      headers: this.construirHeader(false),
      responseType: 'blob'
    });
  }
}
