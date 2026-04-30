import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ParametroResponse } from '../models/response/parametroResponse';
import { environment } from 'src/environments/environment';
import { ParametroDTO } from '../models/request/parametroDTO';

@Injectable({
  providedIn: 'root'
})
export class ParametroService {

  url = '/parametros/';

  constructor(private http: HttpClient) { }

  // getParametros(): Observable<ParametroResponse[]> {
  //   let headers = new HttpHeaders();
  //   headers = headers.set('Content-type', 'application/json').set('ngrok-skip-browser-warning', "true");
  //   return this.http.get<ParametroResponse[]>(this.url, { headers });
  // }

  getParametrosHabilitados(): Observable<ParametroResponse[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<ParametroResponse[]>(environment.baseUrl + this.url + 'habilitados', { headers });
  }

  // save(parametroDTO: ParametroDTO): Observable<ParametroResponse> {
  //   let headers = new HttpHeaders();
  //   headers = headers.set('Content-type', 'application/json').set('ngrok-skip-browser-warning', "true");
  //   return this.http.post<ParametroResponse>(this.url, JSON.stringify(parametroDTO), { headers });
  // }

  // updateStatus(id: number) {
  //   let headers = new HttpHeaders();
  //   headers = headers.set('Content-type', 'application/json').set('ngrok-skip-browser-warning', "true");
  //   return this.http.put(this.url + 'updateStatus/' + id, { headers });
  // }

  // update(parametroDTO: ParametroDTO, id: number) {
  //   let headers = new HttpHeaders();
  //   headers = headers.set('Content-type', 'application/json').set('ngrok-skip-browser-warning', "true");
  //   return this.http.put(this.url + id, JSON.stringify(parametroDTO), { headers });
  // }

}
