import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/shared.module';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { forkJoin, Subscription } from 'rxjs';
import { RegistroDTO } from 'src/app/core/models/request/registroDTO';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/core/services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowAltCircleLeft, faEye, faEyeSlash, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { CatalogoService } from 'src/app/core/services/catalogo.service';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, RouterModule, FontAwesomeModule],
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


    // Iconos
    iconEye = faEye;
    iconEyeSlash = faEyeSlash;

    // Obtén la referencia al modal
    // @ViewChild('modalSeleccionTipoUsuario') modalSeleccionTipoUsuario!: NgxCustomModalComponent;
    // modalOptions: ModalOptions = {
    //     closeOnOutsideClick: false,
    //     hideCloseButton: true,
    //     closeOnEscape: false
    // };

    // Catalogos
    paises: any[] = [];
    provincias: any[] = [];
    ciudades: any[] = [];
    generos: any[] = [];
    documentos: any[] = [];

    constructor(
        public storeData: Store<any>,
        public router: Router, private _authService: AuthService, private _catalogService: CatalogoService
    ) {
        this.initStore();
    }
    ngOnInit(): void {
        this.inicializarFormRegistro();

        forkJoin({
            generos: this._catalogService.getGeneros(),
            paises: this._catalogService.getPaises(),
            documentos:  this._catalogService.getDocumentos()
        }).subscribe({
            next: res => {
                // console.log(res);
                this.generos = res.generos.data;
                this.paises = res.paises.data;
                this.documentos = res.documentos.data;
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
            apellido: new FormControl(null, [Validators.required]),
            usuario: new FormControl(null, [Validators.required]),
            email: new FormControl(null, [Validators.required, Validators.email]),
            password: new FormControl(null, [Validators.required]),
            confirmPassword: new FormControl(null, [Validators.required]),
            tipoDocumento: new FormControl(null, []),
            numeroDocumento: new FormControl(null, []),
            cuit: new FormControl(null, []),
            genero: new FormControl(null, []),
            direccionCalle: new FormControl(null, []),
            direccionNumero: new FormControl(null, []),
            direccionDetalle: new FormControl(null, []),
            pais: new FormControl(null, []),
            provincia: new FormControl(null, []),
            ciudad: new FormControl(null, [])
        });
        this.onChange();
    }
    onChange() {
        this.registroFormGroup.get('pais')!.valueChanges.subscribe(
            (uuid: string) => {
                this._catalogService.getProvinciasByCountry(uuid).subscribe({
                    next: res => {
                        this.registroFormGroup.get('provincia')?.setValue(null);
                        this.provincias = res.data.districts;
                    },
                    error: error => {
                        Swal.fire({
                            position: "center",
                            toast: true,
                            width: '30em',
                            icon: "error",
                            title: "Error al traer provincias del servidor",
                            showConfirmButton: false,
                            timer: 1500
                        });
                        console.error(error);
                    }
                });
            });

        this.registroFormGroup.get('provincia')!.valueChanges.subscribe(
            (uuid: string) => {
                if (uuid) {
                    this._catalogService.getCiudadesByProvincia(uuid).subscribe({
                        next: res => {
                            this.registroFormGroup.get('ciudad')?.setValue(null);
                            this.ciudades = res.data.cities;
                        },
                        error: error => {
                            Swal.fire({
                                position: "center",
                                toast: true,
                                width: '30em',
                                icon: "error",
                                title: "Error al traer ciudades del servidor",
                                showConfirmButton: false,
                                timer: 1500
                            });
                            console.error(error);
                        }
                    });
                }
            });
    }

    registrarUsuario() {
        this.isSubmitRegistro = true;
        if (this.registroFormGroup.valid) {
            if (this.coincidePassword()) {
                let registro = new RegistroDTO();
                registro.firstname = this.registroFormGroup.get('nombre')?.value;
                registro.lastname = this.registroFormGroup.get('apellido')?.value;
                registro.email = this.registroFormGroup.get('email')?.value;
                registro.user_name = this.registroFormGroup.get('usuario')?.value;
                registro.password = this.registroFormGroup.get('password')?.value;
                registro.password_confirmation = this.registroFormGroup.get('confirmPassword')?.value;
                registro.CUIT = this.registroFormGroup.get('cuit')?.value;
                registro.document_type_uuid = this.registroFormGroup.get('tipoDocumento')?.value;
                registro.document_number = this.registroFormGroup.get('numeroDocumento')?.value;
                registro.city_uuid = this.registroFormGroup.get('ciudad')?.value;
                registro.street_name = this.registroFormGroup.get('direccionCalle')?.value;
                registro.door_number = this.registroFormGroup.get('direccionNumero')?.value;
                registro.address_detail = this.registroFormGroup.get('direccionDetalle')?.value;
                this.subscription.add(
                    this._authService.register(registro).subscribe({
                        next: res => {
                            console.log(res);
                            this.showSwalFire("¡Genial!. Se te ha enviado un e-mail a tu casilla de correo electrónico para confirmar tu cuenta. Recordá revisar SPAM.");
                            this.router.navigate(['auth/boxed-signin']);
                        },
                        error: error => {
                            console.log(error);
                        }
                    })
                )
            } else {
                Swal.fire({
                    position: "center",
                    toast: true,
                    width: '30em',
                    icon: "error",
                    title: "Las contraseñas no coinciden",
                    showConfirmButton: false,
                    timer: 1500
                });
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
