import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation} from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.route';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors } from '@angular/common/http';
// import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
// import { NgbDateCustomParserFormatter } from './core/pipes/NgbDateCustomParserFormatter';
import { HashLocationStrategy, LocationStrategy, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs);
// import { provideToastr } from 'ngx-toastr';
// import { tokenInterceptorInterceptor } from './core/interceptors/token-interceptor.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes, withHashLocation()),
  provideAnimations(),
  // provideHttpClient(withInterceptors([tokenInterceptorInterceptor])),
  // provideToastr(),
  { provide: LOCALE_ID, useValue: 'es-ES' },
  // { provide: NgbDateParserFormatter, useClass: NgbDateCustomParserFormatter },
  { provide: LocationStrategy, useClass: HashLocationStrategy },
  ]
};