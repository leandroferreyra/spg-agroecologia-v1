import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { ProductoDTO } from '../models/request/productoDTO';
import { ProduccionDTO } from '../models/request/produccionDTO';
import { ProduccionEstadoDTO } from '../models/request/produccionEstadoDTO';

@Injectable({
  providedIn: 'root'
})
export class ProduccionService {

  private apiProduccion = '/productions';

  constructor(private http: HttpClient) { }

  saveProduccion(produccion: ProduccionDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiProduccion, JSON.stringify(produccion), { headers });
  }

  editProduccion(uuid: string, produccion: ProduccionDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiProduccion + '/' + uuid, JSON.stringify(produccion), { headers });
  }

  editEstadoProduccion(uuid: string, produccion: ProduccionEstadoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiProduccion + '/' + uuid, JSON.stringify(produccion), { headers });
  }

  deleteProduccion(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiProduccion + '/' + uuid, { headers, params });
  }

  showProduccion(uuid: string, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .append('actual_role', rol)
      .append('with[]', "product.measure")
      .append('with[]', "frozenComponents")
      .append('with[]', "creator")
      .append('with[]', "responsible")
      .append('with[]', "currentState")
      .append('with[]', "productionStates.creator")
      .append('with[]', "batch.stocks.productInstances");
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProduccion + '/' + uuid, { headers, params });
  }

}
