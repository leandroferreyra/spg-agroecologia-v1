import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EstrategiaDTO } from '../models/request/estrategiaDTO';
import { EstrategiaResponse } from '../models/response/estrategiaResponse';
import { QuintaResponse } from '../models/response/quintaResponse';
import { QuintaDTO } from '../models/request/quintaDTO';

@Injectable({
  providedIn: 'root'
})
export class QuintasService {

  url = '/quintas/';

  constructor(private http: HttpClient) { }

  getQuintas(): Observable<QuintaResponse[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<QuintaResponse[]>(environment.baseUrl + this.url, { headers });
  }

  // save(quintaDTO: QuintaDTO): Observable<QuintaResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   return this.http.post<QuintaResponse>(environment.baseUrl + this.url, JSON.stringify(quintaDTO), { headers });
  // }

  save(formData: FormData): Observable<QuintaResponse> {
    return this.http.post<QuintaResponse>(environment.baseUrl + this.url, formData);
  }

  // updateQuinta(quintaDTO: QuintaDTO, id: number) {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   return this.http.put(environment.baseUrl + this.url + id, JSON.stringify(quintaDTO), { headers });
  // }

  updateQuinta(formData: FormData, id: number): Observable<QuintaResponse> {
    return this.http.put<QuintaResponse>(environment.baseUrl + this.url + id, formData);
  }


  deleteQuinta(id: number) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.delete(environment.baseUrl + this.url + id, { headers });
  }

}
