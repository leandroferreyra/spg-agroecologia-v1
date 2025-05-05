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
  apiPosiblesEstados = '/possible_person_states';
  apiPosiblesEstadosProductos = '/possible_product_states';
  apiCondicionIva = '/vat_conditions';
  apiTiposDetalleContacto = '/contact_detail_types';
  apiCategorias = '/product_categories';
  apiTipoProductos = '/product_types';
  apiMeasures = '/measures';
  apiDocumentosContables = '/account_document_types';

  constructor(private http: HttpClient) { }

  getGeneros(): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiGeneros, { headers });
  }

  getPaises(): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    let params = new HttpParams().append('order_by[0][]', 'name').append('order_by[0][]', 'ASC');
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

  getPermisos(actual_role: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', actual_role)
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiPermisos, { headers, params });
  }

  getPosiblesEstados(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiPosiblesEstados, { headers, params: params });
  }

  getPosiblesEstadosProductos(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiPosiblesEstadosProductos, { headers, params: params });
  }

  getCondicionIva(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCondicionIva, { headers, params: params });
  }

  getTiposDetalleContacto(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiTiposDetalleContacto, { headers, params: params });
  }

  getCategorias(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCategorias, { headers, params: params });
  }


  getTipoProductos(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiTipoProductos, { headers, params: params });
  }

  getMeasures(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiMeasures, { headers, params: params });
  }

  getTiposDocumentosContables(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiDocumentosContables, { headers, params: params });
  }

}