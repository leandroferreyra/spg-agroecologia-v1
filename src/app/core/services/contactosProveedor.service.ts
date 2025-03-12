import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { ContactoProveedorDTO } from '../models/request/contactoProveedorDTO';

@Injectable({
  providedIn: 'root'
})
export class ContactosProveedorService {

  private apiContactos = '/contact_details';

  constructor(private http: HttpClient) { }

  saveContacto(contacto: ContactoProveedorDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiContactos, JSON.stringify(contacto), { headers });
  }

  editContacto(uuid: string, contacto: ContactoProveedorDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiContactos + '/' + uuid, JSON.stringify(contacto), { headers });
  }

  deleteContacto(uuid: string, rolActual: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .set('actual_role', rolActual);
    return this.http.delete<AuthResponse>(environment.baseUrl + this.apiContactos + '/' + uuid, { headers, params });
  }

}
