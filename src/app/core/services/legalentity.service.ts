import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { LegalEntityDTO } from '../models/request/legalEntityDTO';

@Injectable({
  providedIn: 'root'
})
export class LegalEntityService {

  private apiLegalEntities = '/legal_entities';

  constructor(private http: HttpClient) { }

  saveLegalEntity(legalEntityDTO: LegalEntityDTO) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiLegalEntities, JSON.stringify(legalEntityDTO), { headers });
  }


}
