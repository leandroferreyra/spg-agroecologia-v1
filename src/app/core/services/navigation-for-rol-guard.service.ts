import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavigationForRolGuardService {

  constructor() { }

  private previousUrl: string = '/';

  public setPreviousUrl(url: string): void {
    this.previousUrl = url;
  }

  public getPreviousUrl(): string {
    return this.previousUrl;
  }
}
