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
  apiVentas = '/sales';

  apiHumans = '/humans'
  apiLegalEntities = '/legal_entities'

  apiProductosAdquiridos = '/transaction_products';
  apiProductosEnPosesion = '/product_instances';
  apiProductos = '/products';
  apiTiposProductos = '/product_types';

  apiComponentes = '/components';
  apiReemplazos = '/replacements';
  apiStocks = '/stocks';
  apiPagos = '/payments';

  apiUsuarios = '/users';
  apiParametrosGenerales = '/general_parameters';
  apiMetodosPago = '/payment_methods';
  apiProducciones = '/productions';


  constructor(private http: HttpClient) { }

  getNewParams(paramsObj: any, rol?: string): HttpParams {
    let params = new HttpParams();
    if (paramsObj) {
      // Paging
      if (paramsObj.paging) params = params.append('paging', paramsObj.paging);
      if (paramsObj.page) params = params.append('page', paramsObj.page);

      // With[]
      if (Array.isArray(paramsObj.with)) {
        paramsObj.with.forEach((element: any) => {
          params = params.append('with[]', element);
        });
      }

      // Order by
      if (paramsObj.order_by) {
        Object.keys(paramsObj.order_by).forEach((key, index) => {
          const value = paramsObj.order_by[key];
          if (value !== '') {
            params = params.append(`order_by[${index}][]`, key);
            params = params.append(`order_by[${index}][]`, value);
          }
        });
      }

      // Filters
      let filterIndex = 0;

      if (paramsObj.filters) {
        Object.keys(paramsObj.filters).forEach((key) => {
          const filter = paramsObj.filters[key];

          const isValid = ((filter && filter.value !== '' && filter.value !== null && filter.value?.length > 0));

          if (isValid) {
            if (key === 'operator') {
              params = params.append(`filters[${filterIndex}]`, `${filter.value}`);
            } else {
              params = params.append(`filters[${filterIndex}][]`, key);
              params = params.append(`filters[${filterIndex}][]`, filter.op);

              let valueToUse = filter.value;

              if (filter.contiene) {
                valueToUse = `%${filter.value}%`;
              } else if (filter.op === 'LIKE') {
                valueToUse = `${filter.value}%`;
              }
              params = params.append(`filters[${filterIndex}][]`, valueToUse);
            }

            filterIndex++;
          }
        });
      }

      // Extra date filters (respetando el orden y continuidad del índice)
      if (Array.isArray(paramsObj.extraDateFilters)) {
        paramsObj.extraDateFilters.forEach((filtro: any[]) => {
          if (filtro.length === 3) {
            params = params.append(`filters[${filterIndex}][]`, filtro[0]);
            params = params.append(`filters[${filterIndex}][]`, filtro[1]);
            params = params.append(`filters[${filterIndex}][]`, filtro[2]);
            filterIndex++;
          }
        });
      }

      // Distinct
      if (paramsObj.distinct !== null && paramsObj.distinct !== undefined) {
        params = params.append('distinct', paramsObj.distinct);
      }
    }

    // Rol
    if (rol) {
      params = params.append('actual_role', rol);
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

  getTiposProductosWithParams(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiTiposProductos, { headers, params: this.getNewParams(paramsObj, rol) });
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

  getProveedoresWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProveedores, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getProveedoresWithParamAsync(paramsObj: any, rol: string): Observable<any[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<any[]>(environment.baseUrl + this.apiProveedores, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getClientesWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiClientes, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getClientesWithParamAsync(paramsObj: any, rol: string): Observable<any[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<any[]>(environment.baseUrl + this.apiClientes, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getUsuariosWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiUsuarios, { headers, params: this.getNewParams(paramsObj, rol) });
  }


  getProductosWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProductos, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getProductosWithParamAsync(paramsObj: any, rol: string): Observable<any[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<any[]>(environment.baseUrl + this.apiProductos, { headers, params: this.getNewParams(paramsObj, rol) });
  }


  getProductosPosiblesWithParam(paramsObj: any, rol: string, uuidProducto: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProductos + '/' + uuidProducto + '/possible_components', { headers, params: this.getNewParams(paramsObj, rol) });
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


  getVentasWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiVentas, { headers, params: this.getNewParams(paramsObj, rol) });
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

  getComponentesWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiComponentes, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getReemplazosWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiReemplazos, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getProovedoresByProductoWithParam(paramsObj: any, rol: string, uuid: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProductos + '/' + uuid, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getStocksWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiStocks, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getPagosWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiPagos, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getParametrosWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiParametrosGenerales, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getMetodosDePagoWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiMetodosPago, { headers, params: this.getNewParams(paramsObj, rol) });
  }

  getProduccionesWithParam(paramsObj: any, rol: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<AuthResponse>(environment.baseUrl + this.apiProducciones, { headers, params: this.getNewParams(paramsObj, rol) });
  }

}