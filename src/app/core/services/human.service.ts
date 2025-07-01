import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { HumanDTO } from '../models/request/humanDTO';

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

  saveHuman(humanDTO: HumanDTO) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiHuman, JSON.stringify(humanDTO), { headers });
  }


}
