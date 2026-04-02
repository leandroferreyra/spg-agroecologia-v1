import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PrincipioResponse } from '../models/response/principioResponse';
import { PrincipioDTO } from '../models/request/principioDTO';

@Injectable({
  providedIn: 'root'
})
export class PrincipioService {

  urlPrincipios = '/principios/';

  constructor(private http: HttpClient) { }

  getPrincipios(): Observable<PrincipioResponse[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<PrincipioResponse[]>(environment.baseUrl + this.urlPrincipios, { headers });
  }

  save(principio: PrincipioDTO): Observable<PrincipioResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<PrincipioResponse>(environment.baseUrl + this.urlPrincipios, JSON.stringify(principio), { headers });
  }

  updateStatus(id: number) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(environment.baseUrl + this.urlPrincipios + 'updateStatus/' + id, { headers });
  }

  updatePrincipio(principioDTO: PrincipioDTO, id: number) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(environment.baseUrl + this.urlPrincipios + 'updateNombre/' + id, JSON.stringify(principioDTO), { headers });
  }

}
