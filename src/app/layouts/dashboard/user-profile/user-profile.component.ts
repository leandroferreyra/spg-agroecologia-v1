import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgxSpinner, NgxSpinnerService } from 'ngx-spinner';
import { forkJoin, Subscription } from 'rxjs';
import { RegistroDTO } from 'src/app/core/models/request/registroDTO';
import { AuthService } from 'src/app/core/services/auth.service';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { UserService } from 'src/app/core/services/user.service';
import { SharedModule } from 'src/shared.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();
  usuarioLogueado: any;
  actual_role: string = '';

  isEdicion: boolean = false;
  userForm!: FormGroup;

  // Catalogos
  tiposDocumento: any[] = [];
  paises: any[] = [];
  provincias: any[] = [];
  ciudades: any[] = [];
  generos: any[] = [];
  tipoDocumentos: any[] = [];
  dataLoaded = false;

  constructor(public storeData: Store<any>, private _userLogged: UserLoggedService, private userService: UserService,
    private _tokenService: TokenService, private spinner: NgxSpinnerService, private _catalogService: CatalogoService,
    private authService: AuthService, private router: Router, private swalService: SwalService
  ) {
    this.initStore();
  }
  async initStore() {
    this.storeData
      .select((d) => d.index)
      .subscribe((d) => {
        this.actual_role = d.userRole;
      });
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {

    this.usuarioLogueado = this._userLogged.getUsuarioLogueado;
    this.spinner.show();
    this.subscription.add(
      this.userService.getUser(this.actual_role, this.usuarioLogueado.uuid).subscribe({
        next: res => {
          this.usuarioLogueado = res.data;
          this.dataLoaded = true;
          this.inicializarForm();
          this._tokenService.setToken(res.token);
          console.log(this.usuarioLogueado);
          this.obtenerCatalogos();
        },
        error: error => {
          this.spinner.hide();
          console.error(error);
        }
      })
    );
  }

  obtenerCatalogos() {
    forkJoin({
      generos: this._catalogService.getGeneros(),
      paises: this._catalogService.getPaises(),
      provincias: this._catalogService.getProvinciasByCountry(this.usuarioLogueado.human.person.city.district.country.uuid),
      ciudades: this._catalogService.getCiudadesByProvincia(this.usuarioLogueado.human.person.city.district.uuid),
      // tiposDocumento: this._catalogService.getDocumentos(),
    }).subscribe({
      next: res => {
        this.generos = res.generos.data;
        this.paises = res.paises.data;
        this.provincias = res.provincias.data.districts;
        this.ciudades = res.ciudades.data.cities;
        // this.tipoDocumentos = res.tiposDocumento.data;
        this.spinner.hide();
      },
      error: error => {
        this.spinner.hide();
        console.error('Error cargando catalogos: ', error);
      }
    });
  }

  inicializarForm() {
    this.userForm = new FormGroup({
      email: new FormControl({ value: this.usuarioLogueado.email, disabled: true }, [Validators.required, Validators.email]),
      usuario: new FormControl({ value: this.usuarioLogueado.user_name, disabled: true }, [Validators.required]),
      nombres: new FormControl({ value: this.usuarioLogueado.human.firstname, disabled: true }, [Validators.required]),
      apellidos: new FormControl({ value: this.usuarioLogueado.human.lastname, disabled: true }, [Validators.required]),
      genero: new FormControl({ value: this.usuarioLogueado.human.gender.uuid, disabled: true }, []),
      pais: new FormControl({ value: this.usuarioLogueado.human.person.city.district.country.uuid, disabled: true }, []),
      provincia: new FormControl({ value: this.usuarioLogueado.human.person.city.district.uuid, disabled: true }, []),
      ciudad: new FormControl({ value: this.usuarioLogueado.human.person.city.uuid, disabled: true }, []),
      direccionCalle: new FormControl({ value: this.usuarioLogueado.human.person.street_name, disabled: true }, []),
      direccionNumero: new FormControl({ value: this.usuarioLogueado.human.person.door_number, disabled: true }, []),
      direccionDetalle: new FormControl({ value: this.usuarioLogueado.human.person.address_detail, disabled: true }, []),
    });
    this.onFormChange();
  }

  onFormChange() {

    this.userForm.get('pais')!.valueChanges.subscribe(
      (valor: string) => {
        this._catalogService.getProvinciasByCountry(valor).subscribe({
          next: res => {
            if (this.userForm.get('pais')?.value !== this.usuarioLogueado.human.person.city.district.country.uuid) {
              this.userForm.get('provincia')?.setValue('');
              this.userForm.get('ciudad')?.setValue('');
            }
            this.provincias = res.data.districts;
            this.ciudades = [];
          },
          error: error => {
            console.error(error);
          }
        });
      });

    this.userForm.get('provincia')!.valueChanges.subscribe(
      (valor: string) => {
        this._catalogService.getCiudadesByProvincia(valor).subscribe({
          next: res => {
            if (this.userForm.get('provincia')?.value !== this.usuarioLogueado.human.person.city.district.uuid) {
              this.userForm.get('ciudad')?.setValue('');
            }
            this.ciudades = res.data.cities;
          },
          error: error => {
            console.error(error);
          }
        });
      });

  }

  toggleEdicion() {
    this.isEdicion = !this.isEdicion;
    if (this.isEdicion) {
      this.modificarValidacionesForm();
    } else {
      this.cancelarEdicion();
    }
  }

  cancelarEdicion() {
    if (this.userForm.get('pais')?.value !== this.usuarioLogueado.human.person.city.district.country.uuid) {
      // Si es distinto quiere decir que modificó el select de país por lo que cambiaron las ciudades, hay que volverlo a su estado original.
      this.subscription.add(
        this._catalogService.getProvinciasByCountry(this.usuarioLogueado.human.person.city.district.country.uuid).subscribe({
          next: res => {
            this.provincias = res.data.districts;
          },
          error: error => {
            console.error(error);
          }
        })
      )
    }

    if (this.userForm.get('provincia')?.value !== this.usuarioLogueado.human.person.city.district.uuid) {
      // Si es distinto quiere decir que modificó el select de provincia por lo que cambiaron las ciudades, hay que volverlo a su estado original.
      this.subscription.add(
        this._catalogService.getCiudadesByProvincia(this.usuarioLogueado.human.person.city.district.uuid).subscribe({
          next: res => {
            this.ciudades = res.data.cities;
          },
          error: error => {
            console.error(error);
          }
        })
      )
    }

    this.isEdicion = false;
    this.inicializarForm();
  }

  modificarValidacionesForm() {
    this.userForm.get('email')?.enable();
    this.userForm.get('usuario')?.enable();
    this.userForm.get('nombres')?.enable();
    this.userForm.get('apellidos')?.enable();
    this.userForm.get('genero')?.enable();
    this.userForm.get('pais')?.enable();
    this.userForm.get('provincia')?.enable();
    this.userForm.get('ciudad')?.enable();
    this.userForm.get('direccionCalle')?.enable();
    this.userForm.get('direccionNumero')?.enable();
    this.userForm.get('direccionDetalle')?.enable();
  }

  confirmarEdicion() {
    if (this.userForm.valid && !this.userForm.pristine) {
      this.spinner.show();
      let registro = this.armarDTORegistro();
      this.subscription.add(
        this.userService.updateUser(this.usuarioLogueado.uuid, registro).subscribe({
          next: res => {
            this._tokenService.setToken(res.token);
            if (this.usuarioLogueado.email !== registro.email) {
              this.authService.logout().subscribe({
                next: res => {
                  Swal.fire({
                    title: "",
                    text: `Se le envió un correo para verificar el nuevo email. Recuerde revisar spam`,
                    icon: 'info',
                    confirmButtonText: 'Aceptar',
                    showDenyButton: false,
                    // denyButtonText: 'Cancelar',
                  }).then((result) => {
                    if (result.isConfirmed) {
                      // this.registroForm.get(formControl)!.setValue(true, { emitEvent: false });
                      this.router.navigate(['auth/boxed-sigin'])
                    }
                  });
                },
                error: error => {
                  console.error(error);
                }
              });
            }
            this.spinner.hide();
            this.usuarioLogueado.firstname = registro.firstname;
            this.usuarioLogueado.lastname = registro.lastname;
            // this.usuarioLogueado.document_number = registro.document_number;
            // this.usuarioLogueado.document_type.uuid = registro.document_type_uuid;
            this.usuarioLogueado.human.gender.uuid = registro.gender_uuid;
            this.usuarioLogueado.human.person.city.uuid = registro.city_uuid;
            this.usuarioLogueado.human.person.address_detail = registro.address_detail;
            this.usuarioLogueado.human.person.door_number = registro.door_number;
            this.usuarioLogueado.human.person.street_name = registro.street_name;
            this.usuarioLogueado.human.person.city.district.country.uuid = this.userForm.get('pais')?.value;
            // let roles = res.data?.roles;
            // this.usuarioLogueado.roles = [];
            // roles.forEach((element: string) => {
            //   let rol = new Rol();
            //   rol.name = element;
            //   this.usuarioLogueado.roles.push(rol);
            // });
            this._userLogged.setUsuarioLogueado(this.usuarioLogueado);
            this.inicializarForm();
            this.isEdicion = false;
            this.swalService.toastSuccess('top-right', "Usuario actualizado.");
          },
          error: error => {
            this.spinner.hide();
            console.error(error);
            this.swalService.toastError('top-right', error.error.message);
          }
        })
      );
    } else {
      this.swalService.toastError('top-right', "Formulario inválido o sin cambios.");
    }
  }
  armarDTORegistro() {
    let registro = new RegistroDTO();
    registro.actual_role = this.actual_role;
    registro.with = ["roles", "human.gender"]
    registro.email = this.userForm.get('email')?.value;
    registro.user_name = this.userForm.get('usuario')?.value;
    registro.firstname = this.userForm.get('nombres')?.value;
    registro.lastname = this.userForm.get('apellidos')?.value;
    registro.gender_uuid = this.userForm.get('genero')?.value;
    registro.city_uuid = this.userForm.get('ciudad')?.value;
    registro.street_name = this.userForm.get('direccionCalle')?.value;
    registro.door_number = this.userForm.get('direccionNumero')?.value;
    registro.address_detail = this.userForm.get('direccionDetalle')?.value;
    // cuit 
    // document_number!: string;
    // document_type_uuid!: string;

    return registro;
  }


}
