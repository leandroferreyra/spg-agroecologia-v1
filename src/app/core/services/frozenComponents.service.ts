import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { ComponenteDTO } from '../models/request/componenteDTO';
import { FrozenComponentDTO } from '../models/request/frozenComponentDTO';
import { RolDTO } from '../models/request/rolDTO';

@Injectable({
  providedIn: 'root'
})
export class FrozenComponentService {

  private apiComponentes = '/frozen_components';

  constructor(private http: HttpClient) { }

  // saveComponente(componente: ComponenteDTO): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   return this.http.post<AuthResponse>(environment.baseUrl + this.apiComponentes, JSON.stringify(componente), { headers });
  // }

  editComponente(uuid: string, componente: FrozenComponentDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiComponentes + '/' + uuid, JSON.stringify(componente), { headers });
  }

  replaceComponente(uuidFrozen: string, uuidReplacement: string, rolDTO: RolDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiComponentes + '/' + uuidFrozen + '/replace/' + uuidReplacement, JSON.stringify(rolDTO), { headers });
  }

  deleteComponent(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiComponentes + '/' + uuid, { headers, params });
  }

}
