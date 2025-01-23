import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserLoggedService {

  private userSubject: BehaviorSubject<any>;
  public user: Observable<any>;

  // private roleSignal: WritableSignal<string> = signal('');


  constructor() {
    const storedUser = JSON.parse(localStorage.getItem('usuarioLogueado') || 'null');
    const storedRole = storedUser ? storedUser.role : null;

    this.userSubject = new BehaviorSubject<any>(storedUser);
    this.user = this.userSubject.asObservable();

    // this.roleSignal.set(storedRole);

  }

  // Método para obtener el usuario actual
  public get getUsuarioLogueado(): any {
    return this.userSubject.value;
  }

  // Método para actualizar el usuario logueado
  public setUsuarioLogueado(user: any): void {
    // Guardar en localStorage para persistencia
    // localStorage.setItem('usuarioLogueado', JSON.stringify(user));
    localStorage.setItem('usuarioLogueado', JSON.stringify(user));
    // Actualizar el BehaviorSubject
    this.userSubject.next(user);
  }

  // Método para actualizar el rol del usuario logueado
  // public setRolElegido(rol: string): void {
  //   this.roleSignal.set(rol);
  // }
  // public get role(): Signal<string> {
  //   return this.roleSignal;
  // }

  // Método para eliminar el usuario logueado
  public clearUsuarioLogueado(): void {
    localStorage.removeItem('usuarioLogueado');
    this.userSubject.next(null);
    // this.roleSignal.set('');
  }

  
}
