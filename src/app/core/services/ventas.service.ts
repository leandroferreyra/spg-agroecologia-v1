import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse } from '../models/response/authResponse';
import { environment } from 'src/environments/environment';
import { VentaDTO } from '../models/request/ventaDTO';

@Injectable({
  providedIn: 'root'
})
export class VentasService {

  private apiVentas = '/sales';

  constructor(private http: HttpClient) { }

  getVentaById(uuid: string, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .append('actual_role', rol)
      .append('with[]', "transaction.person.human.documentType")
      .append('with[]', "transaction.person.legalEntity")
      .append('with[]', "transaction.person.city.district.country")
      .append('with[]', "transaction.transactionProducts.product.measure")
      .append('with[]', "transaction.transactionProducts.saleProduct.stock.batch")
      .append('with[]', "transaction.transactionProducts.saleProduct.productInstances")
      .append('with[]', "transaction.transactionDocuments.accountDocumentType")
      .append('with[]', "transaction.transactionDocuments.currency")
      .append('with[]', "transaction.payments.currency")
      ;
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiVentas + '/' + uuid, { headers, params });
  }

  saveVenta(venta: VentaDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiVentas, JSON.stringify(venta), { headers });
  }

  editVenta(uuid: string, venta: VentaDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiVentas + '/' + uuid, JSON.stringify(venta), { headers });
  }

  deleteVenta(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiVentas + '/' + uuid, { headers, params });
  }

}
