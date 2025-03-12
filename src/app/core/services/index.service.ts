import { HttpClient, HttpEventType, HttpHeaders, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/response/authResponse';

@Injectable({
  providedIn: 'root'
})
export class IndexService {

  appKey = "base64:iZayzqqyK6E2rzZNxh4kg9C/CUArXA/LoO+wUd9/f8k=";
  apiProvincias = '/districts';
  apiCiudades = '/cities';
  apiBancos = '/banks';
  apiPaises = '/countries';
  apiGeneros = '/genders';
  apiMonedas = '/currencies';
  apiUbicaciones = '/locations';
  apiTiposDeCambio = '/exchange_rates';
  apiCategoriasProducto = '/product_categories';
  apiCuentas = "/ladie_bank_accounts";
  apiTipoDeCuentas = "/account_types";
  apiProveedores = '/suppliers';
  apiClientes = '/customers';
  apiCuentasProveedor = '/bank_accounts';
  apiComprasProveedor = '/purchases';
  apiDetalleContacto = '/contact_details';
  apiComprasClientes = '/transactions';

  constructor(private http: HttpClient) { }

  getParams(paramsObj: any, rol?: string): HttpParams {
    let params = new HttpParams();
    // Paging 
    paramsObj.paging && (params = params.append('paging', paramsObj.paging));
    paramsObj.page && (params = params.append('page', paramsObj.page));
    // para cada elemento de paramsObj.with, agregar un with[]
    paramsObj.with.forEach((element: any) => {
      params = params.append('with[]', element);
    });
    // para cada atributo del objeto paramsObj.order_by, mostrar el nombre y el valor
    Object.keys(paramsObj.order_by).forEach((key, index) => {
      if (paramsObj.order_by[key] !== '') {
        params = params.append(`order_by[${index}][]`, key);
        params = params.append(`order_by[${index}][]`, paramsObj.order_by[key]);
      }
    });
    // para cada elemento de paramsObj.filters, agregar un filters[]
    Object.keys(paramsObj.filters).forEach((key, index) => {
      if (paramsObj.filters[key] !== '') {
        if (key === 'location_uuid' || key === 'product_category_uuid' || key === 'person.uuid' || key === 'transactionType.name') {
          params = params.append(`filters[${index}][]`, key);
          params = params.append(`filters[${index}][]`, '=');
          params = params.append(`filters[${index}][]`, `${paramsObj.filters[key]}`);
        } else if (key === 'account_number') {
          params = params.append(`filters[${index}][]`, key);
          params = params.append(`filters[${index}][]`, 'LIKE');
          params = params.append(`filters[${index}][]`, `%${paramsObj.filters[key]}%`);
        } else if (key === 'currency_name' || key === 'supplier_uuid' || key === 'transaction_person_uuid') {
          // Si entró por currency_name es porque está trayendo los tipos de cambio.
          // Si entró por supplier_uuid es porque está trayendo las cuentas bancarias de un proveedor (proveedor.component)
          // Si entró por transaction_person_uuid es porque está trayendo las compras de un proveedor (proveedor.component)
          params = params.append(`filters[${index}][]`, key.replace(/_/g, '.'));
          params = params.append(`filters[${index}][]`, '=');
          params = params.append(`filters[${index}][]`, `${paramsObj.filters[key]}`);
        } else {
          params = params.append(`filters[${index}][]`, key.replace(/_/g, '.'));
          params = params.append(`filters[${index}][]`, 'LIKE');
          params = params.append(`filters[${index}][]`, `%${paramsObj.filters[key]}%`);
        }
      }
    });
    if (rol) {
      params = params.append('actual_role', rol);
    }

    return params;
  }

  getProvinciasWithParams(paramsObj: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProvincias, { headers, params: this.getParams(paramsObj) });
  }

  getCiudadesWithParams(paramsObj: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCiudades, { headers, params: this.getParams(paramsObj) });
  }

  getBancos(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiBancos, { headers, params });
  }

  getBancosWithParams(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiBancos, { headers, params: this.getParams(paramsObj, rol) });
  }

  getPaisesWithParams(paramsObj: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiPaises, { headers, params: this.getParams(paramsObj) });
  }

  getGenerosWithParam(paramsObj: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiGeneros, { headers, params: this.getParams(paramsObj) });
  }

  getMonedas(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiMonedas, { headers, params });
  }

  getMonedasWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiMonedas, { headers, params: this.getParams(paramsObj, rol) });
  }

  getUbicacionesWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiUbicaciones, { headers, params: this.getParams(paramsObj, rol) });
  }

  getTiposCambioWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiTiposDeCambio, { headers, params: this.getParams(paramsObj, rol) });
  }

  getCategoriasProductoWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCategoriasProducto, { headers, params: this.getParams(paramsObj, rol) });
  }

  getCuentasBancariasLadieWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCuentas, { headers, params: this.getParams(paramsObj, rol) });
  }

  getTipoDeCuentas(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiTipoDeCuentas, { headers, params });
  }

  getProveedoresWithParam(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol)
      .append("with[]", "person.city")
      .append("with[]", "person.city.district")
      .append("with[]", "person.city.district.country")
      .append("with[]", "person.human")
      .append("with[]", "person.human.gender")
      .append("with[]", "person.human.documentType")
      .append("with[]", "person.legalEntity");
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProveedores, { headers, params: params });
  }

  getClientesWithParam(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol)
      .append("with[]", "person.city")
      .append("with[]", "person.city.district")
      .append("with[]", "person.city.district.country")
      .append("with[]", "person.human")
      .append("with[]", "person.human.gender")
      .append("with[]", "person.human.documentType")
      .append("with[]", "person.human.user")
      .append("with[]", "person.legalEntity");
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiClientes, { headers, params: params });
  }


  getCuentasProveedorWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCuentasProveedor, { headers, params: this.getParams(paramsObj, rol) });
  }


  getComprasProveedorWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiComprasProveedor, { headers, params: this.getParams(paramsObj, rol) });
  }

  getDetalleContactosProveedorWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiDetalleContacto, { headers, params: this.getParams(paramsObj, rol) });
  }

  getComprasClientesWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiComprasClientes, { headers, params: this.getParams(paramsObj, rol) });
  }
}