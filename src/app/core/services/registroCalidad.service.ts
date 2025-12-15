import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { RegistroCalidadDTO } from '../models/request/registroCalidadDTO';
import { DisposicionDTO } from '../models/request/disposicionDTO';
import { EjecucionDTO } from '../models/request/ejecucionDTO';

@Injectable({
  providedIn: 'root'
})
export class RegistroCalidadService {

  private apiRegistros = '/quality_records';
  private apiDisposiciones = '/dispositions';
  private apiEjecucion = '/disposition_executions';

  constructor(private http: HttpClient) { }

  saveRegistro(registroCalidad: RegistroCalidadDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiRegistros, JSON.stringify(registroCalidad), { headers });
  }

  saveEjecucion(ejecucion: EjecucionDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiEjecucion, JSON.stringify(ejecucion), { headers });
  }

  editRegistro(uuid: string, registroCalidad: RegistroCalidadDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiRegistros + '/' + uuid, JSON.stringify(registroCalidad), { headers });
  }

  editEjecucion(uuid: string, ejecucion: EjecucionDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiEjecucion + '/' + uuid, JSON.stringify(ejecucion), { headers });
  }

  eliminarRegistro(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiRegistros + '/' + uuid, { headers, params });
  }

  saveDisposicion(disposicion: DisposicionDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiDisposiciones, JSON.stringify(disposicion), { headers });
  }

  eliminarDisposicion(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiDisposiciones + '/' + uuid, { headers, params });
  }

  eliminarEjecucion(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiEjecucion + '/' + uuid, { headers, params });
  }

}
