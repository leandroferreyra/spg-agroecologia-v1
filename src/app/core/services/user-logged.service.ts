import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserLoggedService {

  private userSubject: BehaviorSubject<any>;
  public user: Observable<any>;

  constructor() {
    const stored = localStorage.getItem('usuarioLogueado');

    let parsedUser = null;

    try {
      parsedUser = stored && stored !== 'undefined'
        ? JSON.parse(stored)
        : null;
    } catch (e) {
      console.warn('Error parseando usuarioLogueado:', e);
      parsedUser = null;
      localStorage.removeItem('usuarioLogueado');
    }

    this.userSubject = new BehaviorSubject<any>(parsedUser);
    this.user = this.userSubject.asObservable();
  }

  public get getUsuarioLogueado(): any {
    return this.userSubject.value;
  }

  public setUsuarioLogueado(user: any): void {
    localStorage.setItem('usuarioLogueado', JSON.stringify(user));
    this.userSubject.next(user);
  }

  public clearUsuarioLogueado(): void {
    localStorage.removeItem('usuarioLogueado');
    this.userSubject.next(null);
  }

}
