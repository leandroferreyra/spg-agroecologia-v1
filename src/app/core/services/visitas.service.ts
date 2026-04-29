import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PrincipioResponse } from '../models/response/principioResponse';
import { PrincipioDTO } from '../models/request/principioDTO';
import { VisitaDTO } from '../models/request/visitaDTO';
import { VisitaResponse } from '../models/response/visitaResponse';

@Injectable({
  providedIn: 'root'
})
export class VisitasService {

  url = '/visitas/';

  constructor(private http: HttpClient) { }

  save(visitaDto: VisitaDTO): Observable<VisitaResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<VisitaResponse>(environment.baseUrl + this.url, JSON.stringify(visitaDto), { headers });

  }

  update(visitaDto: VisitaDTO, id: number): Observable<VisitaResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<VisitaResponse>(environment.baseUrl + this.url + id, JSON.stringify(visitaDto), { headers });
  }

  // getPrincipiosHabilitados(): Observable<PrincipioResponse[]> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   return this.http.get<PrincipioResponse[]>(environment.baseUrl + this.url + 'habilitados', { headers });
  // }

  // save(principio: PrincipioDTO): Observable<PrincipioResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   return this.http.post<PrincipioResponse>(environment.baseUrl + this.url, JSON.stringify(principio), { headers });
  // }

  // updateStatus(id: number) {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   return this.http.put(environment.baseUrl + this.url + 'updateStatus/' + id, { headers });
  // }

  // updatePrincipio(principioDTO: PrincipioDTO, id: number) {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   return this.http.put(environment.baseUrl + this.url + 'updateNombre/' + id, JSON.stringify(principioDTO), { headers });
  // }

  getVisitaByQuintaId(id: number): Observable<any[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<any[]>(environment.baseUrl + this.url + "quinta/" + id, { headers });
  }

  delete(id: number) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.delete(environment.baseUrl + this.url + id, { headers });
  }

}
