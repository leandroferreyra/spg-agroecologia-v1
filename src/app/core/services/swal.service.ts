import { Injectable } from '@angular/core';
import Swal, { SweetAlertPosition } from 'sweetalert2';


@Injectable({
  providedIn: 'root'
})
export class SwalService {

  constructor() { }

  toastSuccess(position: SweetAlertPosition, message: string) {
    Swal.fire({
      position: position,
      toast: true,
      width: '30em',
      icon: "success",
      title: message,
      showConfirmButton: false,
      timer: 1500
    });
  }

  toastError(position: SweetAlertPosition, message: string) {
    Swal.fire({
      position: position,
      toast: true,
      width: '30em',
      icon: "error",
      title: message,
      showConfirmButton: false,
      timer: 1500
    });
  }

}
