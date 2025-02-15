import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Constantes } from 'src/Constantes';
import { environment } from 'src/environments/environment';
import { LoginDTO } from '../models/request/loginDTO';
import { AuthResponse } from '../models/response/authResponse';
import { EmailDTO } from '../models/request/emailDTO';
import { RegistroDTO } from '../models/request/registroDTO';
import { ResetPasswordDTO } from '../models/request/resetPasswordDTO';
import { Rol } from '../models/response/rol';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { ChangePasswordDTO } from '../models/request/changePasswordDTO';
// import { AuthResponse } from '../models/response/authResponse';
// import { EmailDTO } from '../models/request/emailDTO';
// import { ResetPasswordDTO } from '../models/request/resetPasswordDTO';
// import { RegistroDTO } from '../models/request/registroDTO';
// import { Rol } from '../models/response/rol';
// import { ChangePasswordDTO } from '../models/request/changePasswordDTO';
// import { Constantes } from '../../components/Constantes';


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
  // private apiUsers = '/users';

  constructor(private http: HttpClient, public storeData: Store<any>, private router: Router) {
    // console.log('[AuthService] Constructor iniciado');
  }

  register(registro: RegistroDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': Constantes.APPKEY });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiRegister, JSON.stringify(registro), { headers });
  }

  // registerByAdmin(registro: RegistroDTO): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': Constantes.APPKEY });
  //   return this.http.post<AuthResponse>(environment.baseUrl + this.apiRegister, JSON.stringify(registro), { headers });
  // }

  login(login: LoginDTO): Observable<AuthResponse> {
    // console.log('[AuthService] Iniciando petición de login');
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': Constantes.APPKEY });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiLogin, JSON.stringify(login), { headers });
  }

  logout(): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiLogout, { headers });
  }


  sendMail(email: EmailDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': Constantes.APPKEY });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiResetMail, JSON.stringify(email), { headers });
  }

  reSendMail(email: EmailDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': Constantes.APPKEY });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiResendMail, JSON.stringify(email), { headers });
  }

  resetPassword(resetPassword: ResetPasswordDTO): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': Constantes.APPKEY });
    return this.http.post<AuthResponse>(environment.baseUrl + this.apiResetPass, JSON.stringify(resetPassword), { headers });
  }

  verifyUser(hash: string, token: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': Constantes.APPKEY });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiVerifyUser + hash + '/' + token, { headers });
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUserRoles(): Rol[] {
    let usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado') || '[]');
    if (usuarioLogueado && usuarioLogueado.roles.length > 0) {
      return usuarioLogueado.roles;
    }
    // let rol: Rol = new Rol();
    // rol.name = 'NO_ROLE';
    return [];
  }

  // hasRole(role: string): boolean {
  //   const roles = this.getUserRoles();
  //   return roles.some((r: Rol) => r.name === role);
  // }

  hasAnyRole(expectedRoles: string[]): boolean {
    const roles = this.getUserRoles();
    return expectedRoles.some(role => roles.some((r: Rol) => r.name === role));
  }

  changePassword(actual_role: string, changePasswordDTO: ChangePasswordDTO): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const params = new HttpParams()
      .append('actual_role', actual_role)
    return this.http.put<any>(environment.baseUrl + this.apiChangePassword, JSON.stringify(changePasswordDTO), { headers, params });
  }

  // getEmailInRegistro(uuid: string): Observable<AuthResponse> {
  //   const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': Constantes.APPKEY });
  //   return this.http.get<AuthResponse>(`${environment.baseUrl}${this.apiUsers}/${uuid}/email`, { headers });
  // }

  cambioRol(rol: any) {
    localStorage.setItem('userRole', rol);
    this.storeData.dispatch({ type: 'setUserRole', payload: rol });
    if (rol === Constantes.ADMIN || rol === Constantes.ADMINISTRACION) {
      this.router.navigate(['/dashboard/bancos']);
    }
    if (rol === Constantes.PRODUCCION) {
      this.router.navigate(['/dashboard/produccion']);
    }
    if (rol === Constantes.USUARIO) {
      this.router.navigate(['/dashboard/user-profile']);
    }
  }



}
