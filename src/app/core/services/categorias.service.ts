import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { CategoriaDTO } from '../models/request/categoriaDTO';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {

  private apiCategorias = '/product_categories';

  constructor(private http: HttpClient) { }

  saveCategoria(categoria: CategoriaDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiCategorias, JSON.stringify(categoria), { headers });
  }

  showCategoriaWithParent(uuid: string, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rol)
      .set('with[]', "productCategory.productCategory.productCategory.productCategory");
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCategorias + '/' + uuid, { headers, params });
  }

  editCategoria(uuid: string, categoria: CategoriaDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiCategorias + '/' + uuid, JSON.stringify(categoria), { headers });
  }

  eliminarCategoria(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiCategorias + '/' + uuid, { headers, params });
  }

}
