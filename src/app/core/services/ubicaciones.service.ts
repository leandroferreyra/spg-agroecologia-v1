import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { UbicacionDTO } from '../models/request/ubicacionDTO';

@Injectable({
  providedIn: 'root'
})
export class UbicacionesService {

  private apiUbicaciones = '/locations';

  constructor(private http: HttpClient) { }

  saveUbicacion(ubicacion: UbicacionDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiUbicaciones, JSON.stringify(ubicacion), { headers });
  }

  showUbicacionWithParent(uuid: string, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rol)
      .set('with[]', "location.location.location.location");
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiUbicaciones + '/' + uuid, { headers, params });
  }

  editUbicacion(uuid: string, ubicacion: UbicacionDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiUbicaciones + '/' + uuid, JSON.stringify(ubicacion), { headers });
  }

  eliminarUbicacion(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiUbicaciones + '/' + uuid, { headers, params });
  }

}
