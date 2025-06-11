import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { GenericDTO } from '../models/request/genericDTO';
import { BancoDTO } from '../models/request/bancoDTO';
import { ProveedorDTO } from '../models/request/proveedorDTO';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {

  private apiProveedores = '/suppliers';

  constructor(private http: HttpClient) { }

  saveProveedor(proveedor: ProveedorDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiProveedores, JSON.stringify(proveedor), { headers });
  }

  editProveedor(uuid: string, proveedor: ProveedorDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiProveedores + '/' + uuid, JSON.stringify(proveedor), { headers });
  }

  eliminarProveedor(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiProveedores + '/' + uuid, { headers, params });
  }

  showProveedor(uuid: string, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .append('actual_role', rol)
      .append('with[]', "person.city")
      .append('with[]', "person.city.district")
      .append('with[]', "person.city.district.country")
      .append('with[]', "person.human")
      .append('with[]', "person.human.gender")
      .append('with[]', "person.human.documentType")
      .append('with[]', "person.human.user")
      .append('with[]', "person.legalEntity");
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProveedores + '/' + uuid, { headers, params });
  }

}
