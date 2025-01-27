import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaisesService {

  private apiPaises = '/countries';


  constructor(private http: HttpClient) { }



}
