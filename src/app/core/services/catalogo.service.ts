import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

  getPaises(): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiPaises, { headers });
  }

  getDocumentos(): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiDocumentos, { headers });
  }


  getCiudades(): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    const params = new HttpParams()
      .set('with', 'country');
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCiudades, { headers, params });
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

}
