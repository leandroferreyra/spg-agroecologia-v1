import { HttpClient, HttpEventType, HttpHeaders, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/response/authResponse';

@Injectable({
  providedIn: 'root'
})
export class IndexService {

  appKey = "base64:iZayzqqyK6E2rzZNxh4kg9C/CUArXA/LoO+wUd9/f8k=";
  apiProvincias = '/districts';
  apiCiudades = '/cities';
  apiBancos = '/banks';
  apiPaises = '/countries';
  apiGeneros = '/genders';
  apiMonedas = '/currencies';

  constructor(private http: HttpClient) { }

  getParams(paramsObj: any, rol?: string): HttpParams {
    let params = new HttpParams();
    // Paging 
    paramsObj.paging && (params = params.append('paging', paramsObj.paging));
    paramsObj.page && (params = params.append('page', paramsObj.page));
    // para cada elemento de paramsObj.with, agregar un with[]
    paramsObj.with.forEach((element: any) => {
      params = params.append('with[]', element);
    });
    // para cada atributo del objeto paramsObj.order_by, mostrar el nombre y el valor
    Object.keys(paramsObj.order_by).forEach((key, index) => {
      if (paramsObj.order_by[key] !== '') {
        params = params.append(`order_by[${index}][]`, key.replace(/_/g, '.'));
        params = params.append(`order_by[${index}][]`, paramsObj.order_by[key]);
      }
    });
    // para cada elemento de paramsObj.filters, agregar un filters[]
    Object.keys(paramsObj.filters).forEach((key, index) => {
      if (paramsObj.filters[key] !== '') {
        params = params.append(`filters[${index}][]`, key.replace(/_/g, '.'));
        params = params.append(`filters[${index}][]`, 'LIKE');
        params = params.append(`filters[${index}][]`, `%${paramsObj.filters[key]}%`);
      }
    });
    if (rol) {
      params = params.append('actual_role', rol);
    }

    return params;
  }

  getProvinciasWithParams(paramsObj: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProvincias, { headers, params: this.getParams(paramsObj) });
  }

  getCiudadesWithParams(paramsObj: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCiudades, { headers, params: this.getParams(paramsObj) });
  }

  getBancosWithParams(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiBancos, { headers, params: this.getParams(paramsObj, rol) });
  }

  getPaisesWithParams(paramsObj: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiPaises, { headers, params: this.getParams(paramsObj) });
  }

  getGenerosWithParam(paramsObj: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiGeneros, { headers, params: this.getParams(paramsObj) });
  }

  getMonedasWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiMonedas, { headers, params: this.getParams(paramsObj, rol) });
  }
}