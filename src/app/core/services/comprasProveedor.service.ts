import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { CompraProveedorDTO } from '../models/request/compraProveedorDTO';
import { CompraDTO } from '../models/request/compraDTO';

@Injectable({
  providedIn: 'root'
})
export class ComprasProveedorService {

  private apiCompras = '/purchases';

  constructor(private http: HttpClient) { }

  getCompraById(uuid: string, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .append('actual_role', rol)
      .append('with[]', "transaction.person.human")
      .append('with[]', "transaction.person.city.district.country")
      .append('with[]', "transaction.person.legalEntity")
      .append('with[]', "transaction.transactionDocuments.accountDocumentType")
      .append('with[]', "transaction.transactionDocuments.currency")
      .append('with[]', "transaction.transactionProducts.product.measure")
      .append('with[]', "transaction.transactionProducts.controlUser")
      .append('with[]', "transaction.transactionProducts.product.stocks.location")
      .append('with[]', "transaction.transactionProducts.product.productType")
      .append('with[]', "transaction.currentState")
      .append('with[]', "transaction.transactionStates")
      .append('with[]', "batch")
      .append('with[]', "qualificationOption")
      ;
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCompras + '/' + uuid, { headers, params });
  }

  saveCompra(compra: CompraDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiCompras, JSON.stringify(compra), { headers });
  }

  saveCompraProveedor(compra: CompraProveedorDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiCompras, JSON.stringify(compra), { headers });
  }

  editCompraProveedor(uuid: string, compra: CompraProveedorDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiCompras + '/' + uuid, JSON.stringify(compra), { headers });
  }

  editCompra(uuid: string, compra: CompraDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiCompras + '/' + uuid, JSON.stringify(compra), { headers });
  }

  deleteCompra(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiCompras + '/' + uuid, { headers, params });
  }

}
