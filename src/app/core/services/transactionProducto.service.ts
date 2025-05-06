import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { CompraProveedorDTO } from '../models/request/compraProveedorDTO';
import { CompraDTO } from '../models/request/compraDTO';
import { ProductoTransaccionDTO } from '../models/request/productoTransaccionDTO';

@Injectable({
  providedIn: 'root'
})
export class TransactionProductoService {

  private api = '/transaction_products';

  constructor(private http: HttpClient) { }

  saveTransactionProduct(producto: ProductoTransaccionDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.api, JSON.stringify(producto), { headers });
  }

  // editCompra(uuid: string, compra: CompraDTO): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   return this.http.put<AuthResponse>(environment.baseUrl + this.apiCompras + '/' + uuid, JSON.stringify(compra), { headers });
  // }

  deleteTransactionProduct(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams().set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.api + '/' + uuid, { headers, params });
  }

}
