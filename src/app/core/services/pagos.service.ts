import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthResponse } from '../models/response/authResponse';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GeneroDTO } from '../models/request/generoDTO';
import { CurrencyDTO } from '../models/request/currencyDTO';
import { PagoDTO } from '../models/request/pagoDTO';
import { ArchivoDTO } from '../models/request/archivoDTO';

@Injectable({
  providedIn: 'root'
})
export class PagosService {

  private api = '/payments';

  constructor(private http: HttpClient) { }

  savePago(pagoDTO: PagoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.api, JSON.stringify(pagoDTO), { headers });
  }

  editPago(uuid: string, pagoDTO: PagoDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.api + '/' + uuid, JSON.stringify(pagoDTO), { headers });
  }

  deletePago(uuid: string, rolActual: string): Observable<AuthResponse> {
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
