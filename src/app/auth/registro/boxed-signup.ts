import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { forkJoin, Subscription } from 'rxjs';
import { RegistroDTO } from 'src/app/core/models/request/registroDTO';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/core/services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowAltCircleLeft, faEye, faEyeSlash, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { SwalService } from 'src/app/core/services/swal.service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule, FontAwesomeModule, NgxSpinnerModule, NgSelectModule, FormsModule, ReactiveFormsModule],
    templateUrl: './boxed-signup.html',
    animations: [toggleAnimation],
})
export class BoxedSignupComponent implements OnInit, OnDestroy {
    store: any;
    private subscription: Subscription = new Subscription();

    registroFormGroup!: FormGroup;
    isSubmitRegistro = false;
    showPassword: boolean = false;
    showConfirmPassword: boolean = false;

    mostrarOrganizacion: boolean = false;

    // Iconos
    iconEye = faEye;
    iconEyeSlash = faEyeSlash;

    // Catalogos
    posiciones: any[] = [];

    constructor(
        public storeData: Store<any>,
        public router: Router, private _authService: AuthService, private _catalogService: CatalogoService,
        public spinner: NgxSpinnerService, private swalService: SwalService
    ) {
        this.initStore();
    }
    ngOnInit(): void {
        this.inicializarFormRegistro();

        forkJoin({
            posiciones: this._catalogService.getPosiciones(),
        }).subscribe({
            next: res => {
                this.posiciones = res.posiciones;
            },
            error: error => {
                console.error('Error cargando catalogos:', error);
            }
        });

    }
    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    ngAfterViewInit(): void {

    }

    async initStore() {
        this.storeData
            .select((d) => d.index)
            .subscribe((d) => {
                this.store = d;
            });
    }

    inicializarFormRegistro() {
        this.registroFormGroup = new FormGroup({
            nombre: new FormControl(null, [Validators.required]),
            posicion: new FormControl(null, [Validators.required]),
            organizacion: new FormControl(null, [Validators.required]),
            celular: new FormControl(null, [Validators.required]),
            email: new FormControl(null, [Validators.required, Validators.email]),
            password: new FormControl(null, [Validators.required]),
            confirmPassword: new FormControl(null, [Validators.required]),
            tipoDocumento: new FormControl(null, [])
        });
        this.onChange();
    }
    onChange() {
        this.registroFormGroup.get('posicion')!.valueChanges.subscribe(
            (valor: string) => {
                const posicionSeleccionada = this.posiciones.find(posicion => posicion.id === +valor);
                this.mostrarOrganizacion = (posicionSeleccionada.nombre !== 'Consumidor/a');
                if (!this.mostrarOrganizacion) {
                    this.registroFormGroup.get('organizacion')!.reset(); // Restablecer el valor de organizacion si no se muestra
                    const organizacionControl = this.registroFormGroup.get('organizacion');
                    organizacionControl!.setValidators([]);
                    organizacionControl!.updateValueAndValidity();
                } else {
                    // Si es true, se actualiza para que sea requerido.
                    const organizacionControl = this.registroFormGroup.get('organizacion');
                    organizacionControl!.setValidators([Validators.required]);
                    organizacionControl!.updateValueAndValidity();
                }

            });
    }

    registrarUsuario() {
        this.isSubmitRegistro = true;
        if (this.registroFormGroup.valid) {
            if (this.coincidePassword()) {
                this.spinner.show();
                let registro = new RegistroDTO();
                registro.nombre = this.registroFormGroup.get('nombre')?.value;
                registro.posicion = this.registroFormGroup.get('posicion')?.value;
                registro.organizacion = this.registroFormGroup.get('organizacion')?.value;
                registro.email = this.registroFormGroup.get('email')?.value;
                registro.celular = this.registroFormGroup.get('celular')?.value;
                registro.password = this.registroFormGroup.get('password')?.value;
                registro.confirmPassword = this.registroFormGroup.get('confirmPassword')?.value;
                this.subscription.add(
                    this._authService.register(registro).subscribe({
                        next: res => {
                            this.showSwalFire("¡Genial!. Aguardá a ser habilitado/a para poder ingresar");
                            this.router.navigate(['auth/boxed-signin']);
                            this.spinner.hide();
                        },
                        error: error => {
                            this.spinner.hide();
                            console.error(error);
                        }
                    })
                )
            } else {
                this.swalService.toastError('top-right', 'Las contraseñas no coinciden');
            }
        }
    }

    coincidePassword() {
        return (this.registroFormGroup.get('password')?.value === this.registroFormGroup.get('confirmPassword')?.value);
    }

    showSwalFire(text: string) {
        Swal.fire({
            title: '',
            text: `${text}`,
            icon: 'success',
            confirmButtonText: 'Continuar',
        }).then((result) => {
            if (result.isConfirmed) {
                this.router.navigate(['auth/boxed-signin']);
            }
        });
    }


    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPassword() {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

}
