import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UsuarioResponse } from '../models/response/usuarioResponse';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUser = '/usuarios/';

  constructor(private http: HttpClient) { }

  getUsuarios(): Observable<UsuarioResponse[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<UsuarioResponse[]>(environment.baseUrl + this.apiUser, { headers });
  }

  getUsuariosActivos(): Observable<UsuarioResponse[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<UsuarioResponse[]>(environment.baseUrl + this.apiUser + "activos", { headers });
  }

  deleteUsuario(id: number) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.delete(environment.baseUrl + this.apiUser + 'deleteByID/' + id, { headers });
  }

  setearEstado(id: number, estado: string) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(environment.baseUrl + this.apiUser + 'estado/' + id + "/" + estado, { headers });
  }

  cambiarRolAdmin(id: number, admin: boolean): Observable<UsuarioResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<UsuarioResponse>(environment.baseUrl + this.apiUser + 'cambiarRolAdmin/' + id + '?rolAdmin=' + admin, { headers });
  }

}
