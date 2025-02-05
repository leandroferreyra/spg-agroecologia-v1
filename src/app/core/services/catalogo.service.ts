import { HttpClient, HttpEventType, HttpHeaders, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { filter, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/response/authResponse';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {

  appKey = "base64:iZayzqqyK6E2rzZNxh4kg9C/CUArXA/LoO+wUd9/f8k=";
  apiGeneros = '/genders';
  apiPaises = '/countries';
  apiProvincias = '/districts';
  apiCiudades = '/cities';
  apiPermisos = '/permissions';
  apiDocumentos = '/document_types';

  constructor(private http: HttpClient) { }

  getGeneros(): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiGeneros, { headers });
  }

  getGenerosWithPaging(paging: number, page?: number) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    let params = new HttpParams();
    if (page) {
      params = params.append('paging', paging).append('page', page);
    } else {
      params = params.append('paging', paging);
    }
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiGeneros, { headers, params });
  }

  getGenerosWithNameFilter(paging: number, filter: string) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    let params = new HttpParams()
      .append('paging', paging)
      .append('filters[0][]', 'name')
      .append('filters[0][]', 'LIKE')
      .append(`filters[0][]`, `%${filter}%`)
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiGeneros, { headers, params });
  }

  getGenerosWithOrder(paging: number, column: string, direction: string) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    let params = new HttpParams()
      .append('paging', paging)
      .append('order_by[0][]', column)
      .append('order_by[0][]', direction)
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiGeneros, { headers, params });
  }


  getPaises(): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    let params = new HttpParams().append('order_by[0][]', 'name').append('order_by[0][]', 'ASC');
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiPaises, { headers, params });
  }

  getPaisesWithPaging(paging: number, page?: number): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    let params = new HttpParams();
    if (page) {
      params = params.append('paging', paging).append('page', page)
        .append('order_by[0][]', 'name')
        .append('order_by[0][]', 'ASC');;
    } else {
      params = params.append('paging', paging)
        .append('order_by[0][]', 'name')
        .append('order_by[0][]', 'ASC');;
    }
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiPaises, { headers, params });
  }

  getPaisesWithNameFilter(paging: number, filter: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    let params = new HttpParams()
      .append('paging', paging)
      .append('filters[0][]', 'name')
      .append('filters[0][]', 'LIKE')
      .append(`filters[0][]`, `%${filter}%`)
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiPaises, { headers, params });
  }

  getPaisesWithOrder(paging: number, column: string, direction: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    let params = new HttpParams()
      .append('paging', paging)
      .append('order_by[0][]', column)
      .append('order_by[0][]', direction)
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiPaises, { headers, params });
  }

  getDocumentos(): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiDocumentos, { headers });
  }

  getProvincias(): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    const params = new HttpParams();
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProvincias, { headers, params });
  }

  getProvinciasWithOrder(paging: number, column: string, direction: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    let params = new HttpParams()
      .append('paging', paging)
      .append('order_by[0][]', column)
      .append('order_by[0][]', direction)
      .append('with[]', 'country')
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProvincias, { headers, params });
  }

  getProvinciasByCountry(idPais: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    const params = new HttpParams()
      .append('with[]', 'districts');
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiPaises + '/' + idPais, { headers, params });
  }

  getCiudadesByProvincia(provincia: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    const params = new HttpParams()
      .append('with[]', 'cities')
      .append('with[]', 'country');
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProvincias + '/' + provincia, { headers, params });
  }

  getCiudadWithProvinciaAndPais(uuidCiudad: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    const params = new HttpParams()
      .append('with[]', 'district')
      .append('with[]', 'district');
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCiudades + '/' + uuidCiudad, { headers, params });
  }

  getCiudadesWithDistrictsAndPaging(paging: number, page?: number): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    let params = new HttpParams();
    if (page) {
      params = params.append('paging', paging).append('page', page).append('with[]', 'district');;
    } else {
      params = params.append('paging', paging).append('with[]', 'district');;
    }
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCiudades, { headers, params });
  }

  getProvinciasWithCountryAndPaging(paging: number, page?: number): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    let params = new HttpParams();
    if (page) {
      params = params.append('paging', paging).append('page', page).append('with[]', 'country').append('order_by[0][]', 'name').append('order_by[0][]', 'ASC');
    } else {
      params = params.append('paging', paging).append('with[]', 'country').append('order_by[0][]', 'name').append('order_by[0][]', 'ASC');
    }
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProvincias, { headers, params });
  }

  // getProvinciasWithNameFilter(paging: number, filter: string): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
  //   let params = new HttpParams();
  //   params = params.append('paging', paging)
  //     .append('filters[0][]', 'name')
  //     .append('filters[0][]', 'LIKE')
  //     .append(`filters[0][]`, `%${filter}%`)
  //     .append('with[]', 'country');
  //   return this.http.get<AuthResponse>(environment.baseUrl + this.apiProvincias, { headers, params });
  // }

  getProvinciasWithFilter(paging: number, filtros: any) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    let params = new HttpParams().append('paging', paging).append('with[]', 'country');

    let filterIndex = 0;

    // Función recursiva para aplanar los filtros anidados
    const flattenFilters = (obj: any, prefix = '') => {
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === 'object') {
          // Si el valor es un objeto, concatenamos el prefijo y seguimos recursivamente
          flattenFilters(obj[key], prefix ? `${prefix}.${key}` : key);
        } else if (obj[key]) {
          // Si es un valor, lo agregamos al filtro
          params = params
            .append(`filters[${filterIndex}][]`, prefix ? `${prefix}.${key}` : key) // Nombre del campo con el prefijo
            .append(`filters[${filterIndex}][]`, 'LIKE')
            .append(`filters[${filterIndex}][]`, `%${obj[key]}%`); // Valor del filtro
          filterIndex++;
        }
      }
    };

    flattenFilters(filtros); // Llamamos a la función para aplanar los filtros

    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProvincias, { headers, params });
  }


  getPermisos(actual_role: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', actual_role)
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiPermisos, { headers, params });
  }

}
