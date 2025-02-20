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
