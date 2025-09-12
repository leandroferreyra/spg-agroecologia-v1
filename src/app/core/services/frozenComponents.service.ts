import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { FrozenComponentDTO } from '../models/request/frozenComponentDTO';
import { ReplaceFrozenComponentDTO } from '../models/request/replaceFrozenComponentDTO';

@Injectable({
  providedIn: 'root'
})
export class FrozenComponentService {

  private apiComponentes = '/frozen_components';

  constructor(private http: HttpClient) { }

  editComponente(uuid: string, componente: FrozenComponentDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiComponentes + '/' + uuid, JSON.stringify(componente), { headers });
  }

  replaceComponente(uuidFrozen: string, uuidReplacement: string, replaceFrozenComponentDTO: ReplaceFrozenComponentDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiComponentes + '/' + uuidFrozen + '/replace/' + uuidReplacement, JSON.stringify(replaceFrozenComponentDTO), { headers });
  }

  deleteComponent(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiComponentes + '/' + uuid, { headers, params });
  }

}
