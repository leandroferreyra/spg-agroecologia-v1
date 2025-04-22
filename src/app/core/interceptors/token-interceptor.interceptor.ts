import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, EMPTY, tap, throwError } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { TokenService } from 'src/app/core/services/token.service';

export const tokenInterceptorInterceptor: HttpInterceptorFn = (req, next) => {

  const tokenService: TokenService = inject(TokenService);
  const router = inject(Router);
  const spinner = inject(NgxSpinnerService);
  const token = tokenService.getToken();

  // Clona la solicitud para agregar el token en la cabecera
  const clonedRequest = (token && !req.headers.has('app-key')) ? req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }) : req;

  return next(clonedRequest).pipe(
    tap({
      next: (event: any) => {
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && error.error?.message === "Unauthenticated.") {
        tokenService.logout();
        spinner.hide();
        router.navigate(['auth/boxed-signin']);
        return EMPTY;
      }
      return throwError(() => error);
    })
  );
};