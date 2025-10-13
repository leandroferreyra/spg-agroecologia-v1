import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { TipoProductoDTO } from '../models/request/tipoProductoDTO';
import { GastosDTO } from '../models/request/gastosDTO';

@Injectable({
  providedIn: 'root'
})
export class TipoProductoService {

  private apiTipoProducto = '/product_types';

  constructor(private http: HttpClient) { }

  saveTipoProducto(tipo: TipoProductoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiTipoProducto, JSON.stringify(tipo), { headers });
  }

  editTipoProducto(uuid: string, tipo: TipoProductoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiTipoProducto + '/' + uuid, JSON.stringify(tipo), { headers });
  }

  editarParametrosCalculo(uuid: string, gastos: GastosDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiTipoProducto + '/' + uuid, JSON.stringify(gastos), { headers });
  }

  showTipoProducto(uuid: string, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiTipoProducto + '/' + uuid, { headers, params });
  }

  deleteTipoProducto(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiTipoProducto + '/' + uuid, { headers, params });
  }

}
