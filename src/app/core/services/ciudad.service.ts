import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { CiudadDTO } from '../models/request/ciudadDTO';

@Injectable({
  providedIn: 'root'
})
export class CiudadService {

  private apiCiudad = '/cities';

  constructor(private http: HttpClient) { }

  saveCiudad(ciudad: CiudadDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiCiudad, JSON.stringify(ciudad), { headers });
  }

  editCiudad(uuid: string, ciudad: CiudadDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiCiudad + '/' + uuid, JSON.stringify(ciudad), { headers });
  }

  eliminarCiudad(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiCiudad + '/' + uuid, { headers, params });
  }

}
