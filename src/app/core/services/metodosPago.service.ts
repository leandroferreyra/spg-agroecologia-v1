import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { AuthResponse } from '../models/response/authResponse';
import { GenericDTO } from '../models/request/genericDTO';
import { BancoDTO } from '../models/request/bancoDTO';
import { MetodoPagoDTO } from '../models/request/metodoPagoDTO';

@Injectable({
  providedIn: 'root'
})
export class MetodosPagoService {

  private api = '/payment_methods';

  constructor(private http: HttpClient) { }

  saveMetodo(metodoDTO: MetodoPagoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.api, JSON.stringify(metodoDTO), { headers });
  }

  editMetodo(uuid: string, metodoDTO: MetodoPagoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.api + '/' + uuid, JSON.stringify(metodoDTO), { headers });
  }

  deleteMetodo(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.api + '/' + uuid, { headers, params });
  }

}
