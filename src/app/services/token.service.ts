import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

const TOKEN = 'token';
const USUARIO = 'usuario';
const AUTHORITIES = 'authorities';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  roles: string[] = [];

  constructor() { }

  public setToken(token: string) {
    localStorage.removeItem(TOKEN);
    localStorage.setItem(TOKEN, token);
  }

  public getToken() {
    return localStorage.getItem(TOKEN);
  }

  public setUsuario(usuario: string) {
    localStorage.removeItem(USUARIO);
    localStorage.setItem(USUARIO, usuario);
  }

  public getUsuario() {
    return localStorage.getItem(USUARIO);
  }

  public setAuthorities(authorities: string[]) {
    localStorage.removeItem(AUTHORITIES);
    localStorage.setItem(AUTHORITIES, JSON.stringify(authorities));
  }

  public getAuthorities() {
    this.roles = [];
    if (localStorage.getItem(AUTHORITIES)) {
      JSON.parse(localStorage.getItem(AUTHORITIES)!).forEach((authority: { authority: string; }) => {
        this.roles.push(authority.authority);
      });
    }
    return this.roles;
  }

  public logout() {
    localStorage.clear();
  }

  public isTokenExpired(token: string): boolean {
    const helper = new JwtHelperService();
    const isExpired = helper.isTokenExpired(token);
    return isExpired;
  }

}
