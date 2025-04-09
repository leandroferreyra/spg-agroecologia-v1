import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { ReemplazoDTO } from '../models/request/reemplazoDTO';

@Injectable({
  providedIn: 'root'
})
export class ReemplazoService {

  private apiReemplazo = '/replacement';

  constructor(private http: HttpClient) { }

  saveReemplazo(reemplazo: ReemplazoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiReemplazo, JSON.stringify(reemplazo), { headers });
  }

  editReemplazo(uuid: string, reemplazo: ReemplazoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiReemplazo + '/' + uuid, JSON.stringify(reemplazo), { headers });
  }

  deleteReemplazo(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiReemplazo + '/' + uuid, { headers, params });
  }

}
