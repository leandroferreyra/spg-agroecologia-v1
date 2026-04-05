import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ImagenResponse } from '../models/response/imagenResponse';

@Injectable({
  providedIn: 'root'
})
export class ImagenQuintaService {

  urlImagenQuintas = '/imagenQuinta/';

  constructor(private http: HttpClient) { }

  save(formData: FormData, idQuinta: number): Observable<ImagenResponse[]> {
    return this.http.post<ImagenResponse[]>(environment.baseUrl + this.urlImagenQuintas + idQuinta, formData);
  }


  delete(id: number) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.delete(environment.baseUrl + this.urlImagenQuintas + 'deleteByID/' + id, { headers });
  }
}
