import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { UsuarioResponse } from '../models/response/usuarioResponse';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUser = '/usuarios/';

  constructor(private http: HttpClient) { }


  // getUsers(rol: string): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   const params = new HttpParams()
  //     .append('actual_role', rol)
  //     .append('with[]', 'human.person.city.district.country')
  //     .append('with[]', 'human.gender')
  //     .append('with[]', 'roles')
  //     .append('with[]', 'permissions');
  //   return this.http.get<AuthResponse>(environment.baseUrl + this.apiUser, { headers, params });
  // }


  // getUser(rol: string, uuid: string): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   const params = new HttpParams()
  //     .append('actual_role', rol)
  //     .append('with[]', 'human.person.city.district.country')
  //     .append('with[]', 'human.gender')
  //     .append('with[]', 'roles')
  //     .append('with[]', 'permissions');
  //   return this.http.get<AuthResponse>(environment.baseUrl + this.apiUser + "/" + uuid, { headers, params });
  // }

  // updateUser(uuid: string, userUpdateDTO: any): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   return this.http.put<AuthResponse>(environment.baseUrl + this.apiUser + '/' + uuid, JSON.stringify(userUpdateDTO), { headers });
  // }

  // cambiarEstadoUsuario(uuid: string, userUpdateDTO: any): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   return this.http.put<AuthResponse>(environment.baseUrl + this.apiUser + '/' + uuid, JSON.stringify(userUpdateDTO), { headers });
  // }

  // eliminarUsuario(uuid: string, actual_role: string): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   const params = new HttpParams()
  //     .append('actual_role', actual_role)
  //   return this.http.delete<AuthResponse>(environment.baseUrl + this.apiUser + '/' + uuid, { headers, params });
  // }

  // syncRolesUsuario(uuid: string, actual_role: string, roles: string[]): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   let body = {
  //     "roles": roles,
  //     'actual_role': actual_role
  //   }
  //   const url = `${environment.baseUrl}${this.apiUser}/${uuid}/sync-roles`;
  //   return this.http.put<AuthResponse>(url, JSON.stringify(body), { headers });
  // }

  // -------------------------------------------------------------------


  getUsuarios(): Observable<UsuarioResponse[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<UsuarioResponse[]>(environment.baseUrl + this.apiUser, { headers });
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
