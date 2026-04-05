import { HttpClient, HttpEventType, HttpHeaders, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { filter, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PosicionResponse } from '../models/response/posicionResponse';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {

  urlPosicion = '/posiciones/';

  constructor(private http: HttpClient) { }

  getPosiciones(): Observable<PosicionResponse[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<PosicionResponse[]>(environment.baseUrl + this.urlPosicion, { headers });
  }

}