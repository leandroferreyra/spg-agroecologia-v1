import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PosicionResponse } from '../models/response/posicionResponse';
import { environment } from 'src/environments/environment';
import { PosicionDTO } from '../models/request/posicionDTO';

@Injectable({
  providedIn: 'root'
})
export class PosicionService {

  urlPosicion = '/posiciones/';

  constructor(private http: HttpClient) { }

  getPosiciones(): Observable<PosicionResponse[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<PosicionResponse[]>(environment.baseUrl + this.urlPosicion, { headers });
  }

  // getPosicion(id: number): Observable<PosicionResponse> {
  //   let headers = new HttpHeaders();
  //   headers = headers.set('Content-type', 'application/json').set('ngrok-skip-browser-warning', "true");
  //   return this.http.get<PosicionResponse>(this.urlPosicion + id, {headers});
  // }

  save(posicion: PosicionDTO): Observable<PosicionResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<PosicionResponse>(environment.baseUrl + this.urlPosicion, JSON.stringify(posicion), { headers });
  }

  updateStatus(id: number) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(environment.baseUrl + this.urlPosicion + 'updateStatus/' + id, { headers });
  }

  updatePosicion(posicionDTO: PosicionDTO, id: number) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(environment.baseUrl + this.urlPosicion + 'updateNombre/' + id, JSON.stringify(posicionDTO), { headers });
  }

}
