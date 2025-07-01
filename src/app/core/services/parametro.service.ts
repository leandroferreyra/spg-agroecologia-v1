import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { AuthResponse } from '../models/response/authResponse';
import { ParametrosDTO } from '../models/request/parametrosDTO';

@Injectable({
  providedIn: 'root'
})
export class ParametroService {

  private apiParametros = '/general_parameters';

  constructor(private http: HttpClient) { }

  editParametros(uuid: string, parametros: ParametrosDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiParametros + '/' + uuid, JSON.stringify(parametros), { headers });
  }

}
