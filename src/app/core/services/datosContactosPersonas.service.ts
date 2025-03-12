import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { ContactoDTO } from '../models/request/contactoDTO';

@Injectable({
  providedIn: 'root'
})
export class DatosContactoPersonaService {

  private apiContactos = '/contact_people';

  constructor(private http: HttpClient) { }

  // saveContacto(contacto: ContactoDTO): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   return this.http.post<AuthResponse>(environment.baseUrl + this.apiContactos, JSON.stringify(contacto), { headers });
  // }

  deleteContacto(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiContactos + '/' + uuid, { headers, params });
  }

}
