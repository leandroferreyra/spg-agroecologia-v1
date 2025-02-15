import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { AuthResponse } from '../models/response/authResponse';
import { GenericDTO } from '../models/request/genericDTO';
import { BancoDTO } from '../models/request/bancoDTO';

@Injectable({
  providedIn: 'root'
})
export class BancosService {

  private apiBancos = '/banks';

  constructor(private http: HttpClient) { }

  // getBancos(rol: string, paging: number, page?: number): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   let params = new HttpParams();
  //   if (page) {
  //     params = params.append('paging', paging).append('page', page).append('actual_role', rol).append('with []', 'bank_accounts.currency')
  //       .append('order_by[0][]', 'name')
  //       .append('order_by[0][]', 'ASC');
  //   } else {
  //     params = params.append('paging', paging).append('actual_role', rol).append('with []', 'bank_accounts.currency')
  //       .append('order_by[0][]', 'name')
  //       .append('order_by[0][]', 'ASC');;
  //   }
  //   return this.http.get<AuthResponse>(environment.baseUrl + this.apiBancos, { headers, params });
  // }

  // getBancosWithNameFilter(rol: string, paging: number, filter: string): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   let params = new HttpParams()
  //     .append('paging', paging)
  //     .append('actual_role', rol)
  //     .append('with []', 'bank_accounts.currency')
  //     .append('filters[0][]', 'name')
  //     .append('filters[0][]', 'LIKE')
  //     .append(`filters[0][]`, `%${filter}%`)
  //   return this.http.get<AuthResponse>(environment.baseUrl + this.apiBancos, { headers, params });
  // }

  // getBancosWithOrder(rol: string, paging: number, column: string, direction: string): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   let params = new HttpParams()
  //     .append('paging', paging)
  //     .append('actual_role', rol)
  //     .append('with []', 'bank_accounts.currency')
  //     .append('order_by[0][]', column)
  //     .append('order_by[0][]', direction)
  //   return this.http.get<AuthResponse>(environment.baseUrl + this.apiBancos, { headers, params });
  // }

  saveBanco(banco: BancoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiBancos, JSON.stringify(banco), { headers });
  }

  editBanco(uuid: string, banco: BancoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiBancos + '/' + uuid, JSON.stringify(banco), { headers });
  }

  eliminarBanco(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiBancos + '/' + uuid, { headers, params });
  }

}
