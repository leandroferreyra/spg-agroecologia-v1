import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/shared.module';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { Subscription } from 'rxjs';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, RouterModule],
    templateUrl: './boxed-signup.html',
    animations: [toggleAnimation],
})
export class BoxedSignupComponent implements OnInit, OnDestroy {
    store: any;
    private subscription: Subscription = new Subscription();

    registroFormGroup!: FormGroup;
    isSubmitRegistro = false;

    tiposUsuarios: any[] = [
        { "name": "Persona física", "id": "fisica" },
        { "name": "Persona jurídica", "id": "juridica" },
    ]

    // Obtén la referencia al modal
    @ViewChild('modalSeleccionTipoUsuario') modalSeleccionTipoUsuario!: NgxCustomModalComponent;
    modalOptions: ModalOptions = {
        closeOnOutsideClick: false,
        hideCloseButton: true,
        closeOnEscape: false
    };

    constructor(
        public storeData: Store<any>,
        public router: Router
    ) {
        this.initStore();
    }
    ngOnInit(): void {
        this.inicializarFormRegistro();
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
            tipoUsuario: new FormControl('fisica', [Validators.required]),
            nombre: new FormControl(null, [Validators.required]),
            apellido: new FormControl(null, [Validators.required]),
            usuario: new FormControl(null, [Validators.required]),
            tipoDocumento: new FormControl(null, [Validators.required]),
            numeroDocumento: new FormControl(null, [Validators.required]),
            cuit: new FormControl(null, [Validators.required]),
            genero: new FormControl(null, [Validators.required]),
            password: new FormControl(null, [Validators.required]),
            confirmPassword: new FormControl(null, [Validators.required]),
            direccionCalle: new FormControl(null, [Validators.required]),
            direccionNumero: new FormControl(null, [Validators.required]),
            direccionDetalle: new FormControl(null, [Validators.required]),
            pais: new FormControl(null, [Validators.required]),
            ciudad: new FormControl(null, [Validators.required])
        });
    }

    registrarUsuario() {
        this.isSubmitRegistro = true;
        if (this.registroFormGroup.valid) {

        }
    }




}
