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

    tiposUsuarios: string[] = [
        'Persona fisica', 'Persona jurídica'
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
            tipoUsuario: new FormControl(null, [Validators.required]),
            nombre: new FormControl(null, [Validators.required]),
            apellido: new FormControl(null, [Validators.required]),
            usuario: new FormControl(null, [Validators.required])
        });
    }

    registrarUsuario() {
        this.isSubmitRegistro = true;
        if (this.registroFormGroup.valid) {

        }
    }




}
