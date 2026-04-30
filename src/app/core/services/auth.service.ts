import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Constantes } from 'src/Constantes';
import { environment } from 'src/environments/environment';
import { LoginDTO } from '../models/request/loginDTO';
import { Rol } from '../models/response/rol';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { Token } from '../models/response/token';
import { RegistroDTO } from '../models/request/registroDTO';
import { ChangePasswordDTO } from '../models/request/changePasswordDTO';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authURL = '/auth';

  constructor(private http: HttpClient, public storeData: Store<any>, private router: Router) {
  }


  isLoggedIn(): boolean {
    return !!localStorage.getItem('usuarioLogueado');
  }

  getUserRoles(): Rol[] {
    let usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado') || '[]');
    if (usuarioLogueado && usuarioLogueado.authorities.length > 0) {
      return usuarioLogueado.authorities;
    }
    return [];
  }

  hasAnyRole(expectedRoles: string[]): boolean {
    const roles = this.getUserRoles();
    return expectedRoles.some(role =>
      roles.some((r: any) => r.authority === role)
    );
  }

  // ----------------------------------------------------------------

  register(registroDTO: RegistroDTO): Observable<Token> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Token>(environment.baseUrl + this.authURL + '/registro', JSON.stringify(registroDTO), { headers });
  }

  login(loginDTO: LoginDTO): Observable<Token> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Token>(environment.baseUrl + this.authURL + '/login', JSON.stringify(loginDTO), { headers });
  }




}
