import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { AuthResponse } from '../models/response/authResponse';
import { CiudadDTO } from '../models/request/ciudadDTO';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUser = '/users';

  constructor(private http: HttpClient) { }


  getUsers(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .append('actual_role', rol)
      .append('with[]', 'human.person.city')
      .append('with[]', 'human.person.city.district')
      .append('with[]', 'human.person.city.district.country')
      .append('with[]', 'human.gender')
      .append('with[]', 'roles')
      .append('with[]', 'permissions');
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiUser, { headers, params });
  }


  getUser(rol: string, uuid: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .append('actual_role', rol)
      .append('with[]', 'human.person.city')
      .append('with[]', 'human.person.city.district')
      .append('with[]', 'human.person.city.district.country')
      .append('with[]', 'human.gender')
      .append('with[]', 'roles')
      .append('with[]', 'permissions');
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiUser + "/" + uuid, { headers, params });
  }

  updateUser(uuid: string, userUpdateDTO: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiUser + '/' + uuid, JSON.stringify(userUpdateDTO), { headers });
  }

  cambiarEstadoUsuario(uuid: string, userUpdateDTO: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiUser + '/' + uuid, JSON.stringify(userUpdateDTO), { headers });
  }

  eliminarUsuario(uuid: string, actual_role: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .append('actual_role', actual_role)
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiUser + '/' + uuid, { headers, params });
  }

  syncRolesUsuario(uuid: string, actual_role: string, roles: string[]): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let body = {
      "roles": roles,
      'actual_role': actual_role
    }
    const url = `${environment.baseUrl}${this.apiUser}/${uuid}/sync-roles`;
    return this.http.put<AuthResponse>(url, JSON.stringify(body), { headers });
  }


}
