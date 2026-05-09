import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UsuarioResponse } from '../models/response/usuarioResponse';
import { UsuarioDTO } from '../models/request/usuarioDTO';
import { ChangePasswordDTO } from '../models/request/changePasswordDTO';

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

  getUsuario(id: number): Observable<UsuarioResponse[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<UsuarioResponse[]>(environment.baseUrl + this.apiUser + id, { headers });
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

  update(id: number, usuario: UsuarioDTO) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(environment.baseUrl + this.apiUser + id, JSON.stringify(usuario), { headers });
  }

  cambiarRolAdmin(id: number, admin: boolean): Observable<UsuarioResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<UsuarioResponse>(environment.baseUrl + this.apiUser + 'cambiarRolAdmin/' + id + '?rolAdmin=' + admin, { headers });
  }

  changePassword(id: number, changePasswordDTO: ChangePasswordDTO) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<any>(environment.baseUrl + this.apiUser + 'changePassword/' + id, JSON.stringify(changePasswordDTO), { headers });
  }

  recoverPassword(email: string) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<any>(environment.baseUrl + this.apiUser + 'sendNewPassword/' + email, { headers });
  }


}
