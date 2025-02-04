import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { AuthResponse } from '../models/response/authResponse';
import { CiudadDTO } from '../models/request/ciudadDTO';

@Injectable({
  providedIn: 'root'
})
export class HumanService {

  private apiHuman = '/humans';

  constructor(private http: HttpClient) { }

  updateHuman(uuid: string, userUpdateDTO: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<AuthResponse>(environment.baseUrl + this.apiHuman + '/' + uuid, JSON.stringify(userUpdateDTO), { headers });
  }


}
