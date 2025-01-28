import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { AuthResponse } from '../models/response/authResponse';
import { GenericDTO } from '../models/request/genericDTO';

@Injectable({
  providedIn: 'root'
})
export class BancosService {

  private apiBancos = '/banks';


  constructor(private http: HttpClient) { }

  getBancos(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams()
      .append('actual_role', rol)
      .append('with []', 'bank_accounts.currency');
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiBancos, { headers, params });
  }

}
