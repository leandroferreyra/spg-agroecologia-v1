import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.route';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors } from '@angular/common/http';
// import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
// import { NgbDateCustomParserFormatter } from './core/pipes/NgbDateCustomParserFormatter';
import { HashLocationStrategy, LocationStrategy, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideStore } from '@ngrx/store';
import { indexReducer } from './store/index.reducer';
import { tokenInterceptorInterceptor } from './core/interceptors/token-interceptor.interceptor';
registerLocaleData(localeEs);
import { provideScrollbarOptions } from 'ngx-scrollbar';
import { provideFlatpickrDefaults } from 'angularx-flatpickr';
// import { tokenInterceptorInterceptor } from './core/interceptors/token-interceptor.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideAnimations(),
    provideStore({ index: indexReducer }),
    provideHttpClient(withInterceptors([tokenInterceptorInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-ES' },
    // { provide: NgbDateParserFormatter, useClass: NgbDateCustomParserFormatter },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    provideScrollbarOptions({
      visibility: 'hover',
      appearance: 'compact',
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        return () => {
          // console.log('[AppConfig] Inicializando aplicación');
        };
      },
      multi: true
    }
  ]
};

// console.log('[AppConfig] Configuración cargada');