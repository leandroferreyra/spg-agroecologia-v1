import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PaisDTO } from '../models/request/paisDTO';
import { AuthResponse } from '../models/response/authResponse';
import { ProvinciaDTO } from '../models/request/provinciaDTO';

@Injectable({
  providedIn: 'root'
})
export class ProvinciaService {

  private apiProvincia = '/districts';


  constructor(private http: HttpClient) { }

  saveProvincia(provincia: ProvinciaDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiProvincia, JSON.stringify(provincia), { headers });
  }

  editProvincia(uuid: string, provincia: ProvinciaDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiProvincia + '/' + uuid, JSON.stringify(provincia), { headers });
  }

  eliminarProvincia(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiProvincia + '/' + uuid, { headers, params });
  }

}
