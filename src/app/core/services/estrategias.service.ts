import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EstrategiaDTO } from '../models/request/estrategiaDTO';
import { EstrategiaResponse } from '../models/response/estrategiaResponse';

@Injectable({
  providedIn: 'root'
})
export class EstrategiasService {

  urlEstrategias = '/parametros/';

  constructor(private http: HttpClient) { }

  getEstrategias(): Observable<EstrategiaResponse[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<EstrategiaResponse[]>(environment.baseUrl + this.urlEstrategias, { headers });
  }

  getParametrosHabilitados(): Observable<EstrategiaResponse[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<EstrategiaResponse[]>(environment.baseUrl + this.urlEstrategias + 'habilitados', { headers });
  }


  save(estrategiaDTO: EstrategiaDTO): Observable<EstrategiaResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<EstrategiaResponse>(environment.baseUrl + this.urlEstrategias, JSON.stringify(estrategiaDTO), { headers });
  }

  updateStatus(id: number) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(environment.baseUrl + this.urlEstrategias + 'updateStatus/' + id, { headers });
  }

  updateEstrategia(estrategiaDTO: EstrategiaDTO, id: number) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(environment.baseUrl + this.urlEstrategias + id, JSON.stringify(estrategiaDTO), { headers });
  }

}
