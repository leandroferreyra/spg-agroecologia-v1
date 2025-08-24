import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthResponse } from '../models/response/authResponse';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GeneroDTO } from '../models/request/generoDTO';
import { CurrencyDTO } from '../models/request/currencyDTO';
import { PagoDTO } from '../models/request/pagoDTO';

@Injectable({
  providedIn: 'root'
})
export class ActiveFiltersService {


  constructor() { }

}
