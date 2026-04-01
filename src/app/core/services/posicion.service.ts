import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PosicionResponse } from '../models/response/posicionResponse';
import { environment } from 'src/environments/environment'; 

@Injectable({
  providedIn: 'root'
})
export class PosicionService {

  urlPosicion = environment.baseUrl + 'posiciones/';

  constructor(private http: HttpClient) { }

  // getPosiciones(): Observable<PosicionResponse[]> {
  //   let headers = new HttpHeaders();
  //   headers = headers.set('Content-type', 'application/json').set('ngrok-skip-browser-warning', "true");
  //   return this.http.get<PosicionResponse[]>(this.urlPosicion, {headers});
  // }

  // getPosicion(id: number): Observable<PosicionResponse> {
  //   let headers = new HttpHeaders();
  //   headers = headers.set('Content-type', 'application/json').set('ngrok-skip-browser-warning', "true");
  //   return this.http.get<PosicionResponse>(this.urlPosicion + id, {headers});
  // }

  // save(posicion: PosicionDTO): Observable<PosicionResponse> {
  //   let headers = new HttpHeaders();
  //   headers = headers.set('Content-type', 'application/json').set('ngrok-skip-browser-warning', "true");
  //   return this.http.post<PosicionResponse>(this.urlPosicion, JSON.stringify(posicion), {headers});
  // }

  // updateStatus(id: number) {
  //   let headers = new HttpHeaders();
  //   headers = headers.set('Content-type', 'application/json').set('ngrok-skip-browser-warning', "true");
  //   return this.http.put(this.urlPosicion + 'updateStatus/' + id, {headers});
  // }

  // updateNombre(posicionDTO: PosicionDTO, id: number) {
  //   let headers = new HttpHeaders();
  //   headers = headers.set('Content-type', 'application/json').set('ngrok-skip-browser-warning', "true");
  //   return this.http.put(this.urlPosicion + 'updateNombre/' + id, JSON.stringify(posicionDTO), {headers});
  // }

}
