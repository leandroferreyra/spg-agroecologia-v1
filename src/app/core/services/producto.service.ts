import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { ProductoDTO } from '../models/request/productoDTO';
import { GastosDTO } from '../models/request/gastosDTO';
import { ArchivoDTO } from '../models/request/archivoDTO';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private apiProductos = '/products';

  constructor(private http: HttpClient) { }

  saveProducto(producto: ProductoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiProductos, JSON.stringify(producto), { headers });
  }

  editProducto(uuid: string, producto: ProductoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiProductos + '/' + uuid, JSON.stringify(producto), { headers });
  }

  editarParametrosCalculo(uuid: string, gastos: GastosDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiProductos + '/' + uuid, JSON.stringify(gastos), { headers });
  }

  deleteProducto(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiProductos + '/' + uuid, { headers, params });
  }

  deleteParametrosCalculo(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiProductos + '/' + uuid, JSON.stringify({ "cost_param_uuid": null }), { headers, params });
  }

  showProduct(uuid: string, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .append('actual_role', rol)
      .append('include[]', 'costs')
      .append('with[]', "productType")
      .append('with[]', "productType.costParam")
      .append('with[]', "costParam")
      .append('with[]', "productCategory")
      .append('with[]', "currentState")
      .append('with[]', "productStates")
      .append('with[]', "measure")
      .append('with[]', "country")
      .append('with[]', "stocks")
      .append('with[]', "files");
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProductos + '/' + uuid, { headers, params });
  }

  saveFile(uuidProducto: string, archivo: ArchivoDTO): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('description', archivo.description);
    if (archivo.file) {
      formData.append('file', archivo.file);
    }
    formData.append('actual_role', archivo.actual_role);
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiProductos + "/" + uuidProducto + "/files", formData);
  }

  deleteFile(uuidProducto: string, uuidFile: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiProductos + '/' + uuidProducto + "/files/" + uuidFile, { headers, params });
  }
}
