import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { CompraProveedorDTO } from '../models/request/compraProveedorDTO';

@Injectable({
  providedIn: 'root'
})
export class ComprasProveedorService {

  private apiCompras = '/purchases';

  constructor(private http: HttpClient) { }

  getCompraById(uuid: string, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rol)
      .set('with[]', "transaction.person.human")
      .set('with[]', "transaction.person.legalEntity")
      .set('with[]', "transaction.transactionDocuments.accountDocumentType")
      .set('with[]', "transaction.transactionDocuments.currency")
      .set('with[]', "transaction.transactionProducts.product.measure")
      .set('with[]', "transaction.transactionProducts.controlUser")
      .set('with[]', "batch")
      .set('with[]', "qualificationOption")
      ;
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCompras + '/' + uuid, { headers, params });
  }

  saveCompra(cuenta: CompraProveedorDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiCompras, JSON.stringify(cuenta), { headers });
  }

  editCompra(uuid: string, cuenta: CompraProveedorDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiCompras + '/' + uuid, JSON.stringify(cuenta), { headers });
  }

  deleteCompra(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiCompras + '/' + uuid, { headers, params });
  }

}
