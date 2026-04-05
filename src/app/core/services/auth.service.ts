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

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiLogin = '/login';
  private apiLogout = '/logout';
  private apiResetMail = '/password/reset';
  private apiResetPass = '/password/new';
  private apiResendMail = '/email/resend';
  private apiVerifyUser = '/email/verify/';
  private apiRegister = '/register';
  private apiChangePassword = '/change_password';


  private authURL = '/auth';


  constructor(private http: HttpClient, public storeData: Store<any>, private router: Router) {
  }

  // register(registro: RegistroDTO): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': Constantes.APPKEY });
  //   return this.http.post<AuthResponse>(environment.baseUrl + this.apiRegister, JSON.stringify(registro), { headers });
  // }

  // login(login: LoginDTO): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': Constantes.APPKEY });
  //   return this.http.post<AuthResponse>(environment.baseUrl + this.apiLogin, JSON.stringify(login), { headers });
  // }

  // logout(): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   return this.http.get<AuthResponse>(environment.baseUrl + this.apiLogout, { headers });
  // }


  // sendMail(email: EmailDTO): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': Constantes.APPKEY });
  //   return this.http.post<AuthResponse>(environment.baseUrl + this.apiResetMail, JSON.stringify(email), { headers });
  // }

  // reSendMail(email: EmailDTO): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': Constantes.APPKEY });
  //   return this.http.post<AuthResponse>(environment.baseUrl + this.apiResendMail, JSON.stringify(email), { headers });
  // }

  // resetPassword(resetPassword: ResetPasswordDTO): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': Constantes.APPKEY });
  //   return this.http.post<AuthResponse>(environment.baseUrl + this.apiResetPass, JSON.stringify(resetPassword), { headers });
  // }

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

  // changePassword(actual_role: string, changePasswordDTO: ChangePasswordDTO): Observable<any> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  //   const params = new HttpParams()
  //     .append('actual_role', actual_role)
  //   return this.http.put<any>(environment.baseUrl + this.apiChangePassword, JSON.stringify(changePasswordDTO), { headers, params });
  // }

  // cambioRol(rol: any) {
  //   localStorage.setItem('userRole', rol);
  //   this.storeData.dispatch({ type: 'setUserRole', payload: rol });
  //   if (rol === Constantes.ADMIN || rol === Constantes.ADMINISTRACION || Constantes.SUPER_ADMIN) {
  //     this.router.navigate(['/dashboard/producciones']);
  //   }
  //   if (rol === Constantes.PRODUCCION) {
  //     this.router.navigate(['/dashboard/producciones']);
  //   }
  //   if (rol === Constantes.USUARIO) {
  //     this.router.navigate(['/dashboard/user-profile']);
  //   }
  // }

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
