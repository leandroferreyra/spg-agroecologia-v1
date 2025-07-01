import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/response/authResponse';

@Injectable({
  providedIn: 'root'
})
export class RolesService {

  private apiRoles = '/roles';

  constructor(private http: HttpClient) { }

  getRoles(actual_role: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', actual_role)
      .set('with', 'permissions');
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiRoles, { headers, params });
  }

  getRolesWithoutPermissions(actual_role: string, unrefesh_token: boolean = false): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', actual_role)
      .set('unrefesh_token', unrefesh_token);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiRoles, { headers, params });
  }

}
