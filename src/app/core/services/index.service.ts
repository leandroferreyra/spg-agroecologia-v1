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
  apiDetalleContactoPersona = '/contact_people';
  apiComprasClientes = '/transactions';

  apiHumans = '/humans'
  apiLegalEntities = '/legal_entities'

  apiProductosAdquiridos = '/transaction_products';
  apiProductosEnPosesion = '/product_instances';
  apiProductos = '/products';

  constructor(private http: HttpClient) { }

  getNewParams(paramsObj: any, rol?: string): HttpParams {
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
      if (paramsObj.filters[key] && paramsObj.filters[key].value !== '') {
        params = params.append(`filters[${index}][]`, key);
        params = params.append(`filters[${index}][]`, paramsObj.filters[key].op);
        if (paramsObj.filters[key].contiene) {
          params = params.append(`filters[${index}][]`, `%${paramsObj.filters[key].value}%`);
        } else {
          params = params.append(`filters[${index}][]`, `${paramsObj.filters[key].value}`);
        }
      }
    });
    if (rol) {
      params = params.append('actual_role', rol);
    }
    if (paramsObj.distinct !== null && paramsObj.distinct !== undefined) {
      params = params.append('distinct', paramsObj.distinct);
    }
    return params;
  }

  getProvinciasWithParams(paramsObj: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProvincias, { headers, params: this.getNewParams(paramsObj) });
  }

  getCiudadesWithParams(paramsObj: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCiudades, { headers, params: this.getNewParams(paramsObj) });
  }

  getBancos(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiBancos, { headers, params });
  }

  getBancosWithParams(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiBancos, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getPaisesWithParams(paramsObj: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiPaises, { headers, params: this.getNewParams(paramsObj) });
  }

  getGenerosWithParam(paramsObj: any): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'APP-KEY': this.appKey });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiGeneros, { headers, params: this.getNewParams(paramsObj) });
  }

  getMonedas(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiMonedas, { headers, params });
  }

  getMonedasWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiMonedas, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getUbicacionesWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiUbicaciones, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getTiposCambioWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiTiposDeCambio, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getCuentasBancariasLadieWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCuentas, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getCategoriasProductoWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCategoriasProducto, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getTipoDeCuentas(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol);
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiTipoDeCuentas, { headers, params });
  }

  getProveedores(rol: string): Observable<AuthResponse> {
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

  getClientes(rol: string): Observable<AuthResponse> {
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

  getProductos(rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    let params = new HttpParams();
    params = params.append('actual_role', rol)
      .append("with[]", "productType")
      .append("with[]", "productCategory")
      .append("with[]", "productStates")
      .append("with[]", "measure")
      .append("with[]", "country")
      .append("with[]", "stocks");
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProductos, { headers, params: params });
  }

  getCuentasProveedorWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiCuentasProveedor, { headers, params: this.getNewParams(paramsObj, rol) });
  }


  getComprasProveedorWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiComprasProveedor, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getDetalleContactosWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiDetalleContacto, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getDetalleContactosPersonaWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiDetalleContactoPersona, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getComprasClientesWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiComprasClientes, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getHumansWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiHumans, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getLegalEntitiesWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiLegalEntities, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getProductosAdquiridosWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProductosAdquiridos, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getProductosEnPosesionWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProductosEnPosesion, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getProductosTotalesComprados(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProductos, { headers, params: this.getNewParams(paramsObj, rol) });
  }

}