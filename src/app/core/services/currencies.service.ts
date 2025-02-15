import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthResponse } from '../models/response/authResponse';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GeneroDTO } from '../models/request/generoDTO';
import { CurrencyDTO } from '../models/request/currencyDTO';

@Injectable({
  providedIn: 'root'
})
export class CurrenciesService {

  private apiMonedas = '/currencies';

  constructor(private http: HttpClient) { }

  // getCurrencies(rol: string, paging: number, page?: number): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   let params = new HttpParams();
  //   if (page) {
  //     params = params.append('paging', paging).append('page', page).append('actual_role', rol).append('order_by[0][]', 'name')
  //       .append('order_by[0][]', 'ASC');
  //   } else {
  //     params = params.append('paging', paging).append('actual_role', rol).append('order_by[0][]', 'name')
  //       .append('order_by[0][]', 'ASC');
  //   }
  //   return this.http.get<AuthResponse>(environment.baseUrl + this.apiMonedas, { headers, params });
  // }

  // getCurrenciesWithFilter(rol: string, paging: number, filtros: any) {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   let params = new HttpParams()
  //     .append('actual_role', rol)
  //     .append('paging', paging);

  //   let filterIndex = 0;
  //   for (const key in filtros) {
  //     if (filtros[key]) { 
  //       params = params
  //         .append(`filters[${filterIndex}][]`, key) // Nombre del campo (name, symbol, etc.)
  //         .append(`filters[${filterIndex}][]`, 'LIKE')
  //         .append(`filters[${filterIndex}][]`, `%${filtros[key]}%`); // Valor del filtro
  //       filterIndex++;
  //     }
  //   }
  //   return this.http.get<AuthResponse>(environment.baseUrl + this.apiMonedas, { headers, params });
  // }

  // getCurrenciesWithOrder(rol: string, paging: number, column: string, direction: string) {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   let params = new HttpParams()
  //     .append('actual_role', rol)
  //     .append('paging', paging)
  //     .append('order_by[0][]', column)
  //     .append('order_by[0][]', direction)
  //   return this.http.get<AuthResponse>(environment.baseUrl + this.apiMonedas, { headers, params });
  // }

  saveCurrency(currencyDTO: CurrencyDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiMonedas, JSON.stringify(currencyDTO), { headers });
  }

  editCurrency(uuid: string, currencyDTO: CurrencyDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiMonedas + '/' + uuid, JSON.stringify(currencyDTO), { headers });
  }

  deleteCurrency(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiMonedas + '/' + uuid, { headers, params });
  }


}
