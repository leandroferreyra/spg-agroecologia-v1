import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { ClienteDTO } from '../models/request/clienteDTO';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private apiClientes = '/customers';

  constructor(private http: HttpClient) { }

  saveCliente(cliente: ClienteDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiClientes, JSON.stringify(cliente), { headers });
  }

  editCliente(uuid: string, cliente: ClienteDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiClientes + '/' + uuid, JSON.stringify(cliente), { headers });
  }

  eliminarCliente(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiClientes + '/' + uuid, { headers, params });
  }

}
