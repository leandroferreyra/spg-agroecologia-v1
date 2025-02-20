import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { TipoCambioDTO } from '../models/request/tipoCambioDTO';

@Injectable({
  providedIn: 'root'
})
export class TiposCambioService {

  private apiTiposCambio = '/exchange_rates';

  constructor(private http: HttpClient) { }

  saveTipo(tipo: TipoCambioDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiTiposCambio, JSON.stringify(tipo), { headers });
  }

  editTipo(uuid: string, tipo: TipoCambioDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiTiposCambio + '/' + uuid, JSON.stringify(tipo), { headers });
  }

  eliminarTipo(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiTiposCambio + '/' + uuid, { headers, params });
  }

}
