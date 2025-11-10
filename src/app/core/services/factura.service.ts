import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse } from '../models/response/authResponse';
import { FacturaDTO } from '../models/request/facturaDTO';
import { environment } from 'src/environments/environment';
import { ArchivoDTO } from '../models/request/archivoDTO';

@Injectable({
  providedIn: 'root'
})
export class FacturaService {

  private api = '/transaction_documents';

  constructor(private http: HttpClient) { }

  saveFactura(factura: FacturaDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.api, JSON.stringify(factura), { headers });
  }

  editFactura(uuid: string, factura: FacturaDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.api + '/' + uuid, JSON.stringify(factura), { headers });
  }

  deleteFactura(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.api + '/' + uuid, { headers, params });
  }

  saveFile(uuid: string, archivo: ArchivoDTO): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('description', archivo.description);
    if (archivo.file) {
      formData.append('file', archivo.file);
    }
    formData.append('actual_role', archivo.actual_role);
    return this.http.post<AuthResponse>(environment.baseUrl + this.api + "/" + uuid + "/file", formData);
  }

  deleteFile(uuid: string, uuidFile: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.api + '/' + uuid + "/file/" + uuidFile, { headers, params });
  }

}
