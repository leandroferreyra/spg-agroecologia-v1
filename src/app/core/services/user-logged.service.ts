import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserLoggedService {

  private userSubject: BehaviorSubject<any>;
  public user: Observable<any>;

  constructor() {
    const storedUser = JSON.parse(localStorage.getItem('usuarioLogueado') || 'null');
    const storedRole = storedUser ? storedUser.role : null;

    this.userSubject = new BehaviorSubject<any>(storedUser);
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
