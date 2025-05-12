import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { StockDTO } from '../models/request/stockDTO';

@Injectable({
  providedIn: 'root'
})
export class StocksService {

  private api = '/stocks';

  constructor(private http: HttpClient) { }

  editStock(uuid: string, stock: StockDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.api + '/' + uuid, JSON.stringify(stock), { headers });
  }

}
