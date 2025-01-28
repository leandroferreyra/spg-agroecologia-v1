import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthResponse } from '../models/response/authResponse';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GeneroDTO } from '../models/request/generoDTO';

@Injectable({
  providedIn: 'root'
})
export class GenerosService {

  private apiGenero = '/genders';

  constructor(private http: HttpClient) { }

  saveGenero(genero: GeneroDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiGenero, JSON.stringify(genero), { headers });
  }

  editGenero(uuid: string, genero: GeneroDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiGenero + '/' + uuid, JSON.stringify(genero), { headers });
  }

  eliminarGenero(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiGenero + '/' + uuid, { headers, params });
  }


}
