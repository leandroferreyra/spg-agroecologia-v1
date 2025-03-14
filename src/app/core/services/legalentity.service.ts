import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse } from '../models/response/authResponse';
import { CiudadDTO } from '../models/request/ciudadDTO';
import { HumanDTO } from '../models/request/humanDTO';
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
