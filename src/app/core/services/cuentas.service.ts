import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { CuentaBancariaDTO } from '../models/request/cuentaBancariaDTO';

@Injectable({
  providedIn: 'root'
})
export class CuentasBancariasService {

  private apiCuentas = '/ladie_bank_accounts';

  constructor(private http: HttpClient) { }

  saveCuenta(cuenta: CuentaBancariaDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiCuentas, JSON.stringify(cuenta), { headers });
  }

  editCuenta(uuid: string, cuenta: CuentaBancariaDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiCuentas + '/' + uuid, JSON.stringify(cuenta), { headers });
  }

  eliminarCuenta(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiCuentas + '/' + uuid, { headers, params });
  }

}
