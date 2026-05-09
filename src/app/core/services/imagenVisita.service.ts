import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ImagenResponse } from '../models/response/imagenResponse';

@Injectable({
  providedIn: 'root'
})
export class ImagenVisitaService {

  url = '/imagenVisita/';

  constructor(private http: HttpClient) { }

  save(formData: FormData, idVisita: number): Observable<ImagenResponse[]> {
    return this.http.post<ImagenResponse[]>(environment.baseUrl + this.url + idVisita, formData);
  }


  delete(id: number) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.delete(environment.baseUrl + this.url + 'deleteByID/' + id, { headers });
  }
}
