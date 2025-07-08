import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { GenericDTO } from '../models/request/genericDTO';
import { BancoDTO } from '../models/request/bancoDTO';

@Injectable({
  providedIn: 'root'
})
export class BancosService {

  private apiBancos = '/banks';

  constructor(private http: HttpClient) { }

  saveBanco(banco: BancoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiBancos, JSON.stringify(banco), { headers });
  }

  editBanco(uuid: string, banco: BancoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiBancos + '/' + uuid, JSON.stringify(banco), { headers });
  }

  eliminarBanco(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiBancos + '/' + uuid, { headers, params });
  }

}
