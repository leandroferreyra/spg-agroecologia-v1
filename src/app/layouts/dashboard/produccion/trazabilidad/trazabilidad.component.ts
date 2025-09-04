import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { IndexService } from 'src/app/core/services/index.service';
import { ProduccionService } from 'src/app/core/services/produccion.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';

export interface TraceNode {
  id: string;
  label: string;
  children?: TraceNode[];
}

@Component({
  selector: 'app-trazabilidad',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule],
  templateUrl: './trazabilidad.component.html',
  styleUrl: './trazabilidad.component.css'
})
export class TrazabilidadComponent implements OnInit, OnDestroy {

  @Input() produccion: any;
  @Input() rol!: string;
  private subscription: Subscription = new Subscription();

  trazado: any;

  expanded = new Set<string>();

  constructor(private _indexService: IndexService, private _swalService: SwalService, private _tokenService: TokenService,
    private spinner: NgxSpinnerService, private _produccionService: ProduccionService
  ) {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['produccion'] && changes['produccion'].currentValue) {
      if (this.produccion.current_state?.state?.name === 'Liberado') {
        this.obtenerTrazabilidad();
      }
    }
  }

  ngOnInit(): void {
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }


  obtenerTrazabilidad() {
    this.spinner.show();
    this.subscription.add(
      this._produccionService.showProduccion(this.produccion.uuid, this.rol).subscribe({
        next: res => {
          this.trazado = this.mapProduccionToTraceNode(res.data);
          this._tokenService.setToken(res.token);
          this.spinner.hide();
        },
        error: error => {
          this._swalService.toastError('top-right', error.error.message);
          console.error(error);
          this.spinner.hide();
        }
      })
    )
  }

  toggle(id: string) {
    this.expanded.has(id)
      ? this.expanded.delete(id)
      : this.expanded.add(id);
  }

  isOpen(id: string): boolean {
    return this.expanded.has(id);
  }

  formatFecha(fechaStr: string): string {
    if (!fechaStr) return '-';
    const d = new Date(fechaStr);
    const pad = (n: number) => n.toString().padStart(2, '0');

    const dia = pad(d.getDate());
    const mes = pad(d.getMonth() + 1);
    const año = d.getFullYear();

    const horas = pad(d.getHours());
    const mins = pad(d.getMinutes());
    const segs = pad(d.getSeconds());

    return `${dia}-${mes}-${año} ${horas}:${mins}:${segs}`;
  }


  mapProduccionToTraceNode(prod: any): TraceNode {
    const cantidad = +prod.quantity;
    const esEntero = prod.product?.measure?.is_integer;
    const cantidadFmt = esEntero === 1 ? cantidad.toString() : cantidad.toFixed(2);
    const serialesRaiz = prod.batch?.stocks?.[0]?.product_instances?.map((pi: any) => pi.serial_number) ?? [];

    const frozen = (prod.frozen_components ?? []).sort((a: any, b: any) => a.order - b.order);

    const children: TraceNode[] = [
      {
        id: 'cantidad',
        label: ` Cantidad: ${cantidadFmt}`
      },
      {
        id: 'lote',
        label: ` Lote: ${prod.batch?.batch_identification ?? '(sin lote)'}`
      },
      {
        id: 'fecha-inicio',
        label: ` Fecha de inicio: ${this.formatFecha(prod.production_datetime) ?? '-'}`,
      },
      {
        id: 'creador',
        label: ` Usuario alta: ${prod.creator?.user_name ?? '-'}`,
      },
      {
        id: 'responsable',
        label: ` Usuario responsable: ${prod.responsible?.user_name ?? '-'}`,
      },
      {
        id: 'usuario-liberacion',
        label: ` Usuario liberación: ${prod.creator?.user_name ?? '-'}`,
      },
      {
        id: 'fecha-liberacion',
        label: ` Fecha de liberación: ${this.formatFecha(prod.current_state?.datetime_from) ?? '-'}`,
      }
    ];

    if (serialesRaiz.length > 0) {
      children.push({
        id: 'seriales-raiz',
        label: ` Números de serie:`,
        children: serialesRaiz.map((s: string, i: number) => ({
          id: `serial-root-${i}`,
          label: s
        }))
      });
    }

    // Componentes congelados
    frozen.forEach((fc: any, i: any) => {
      const seriales = (fc.product_instances ?? []).map((pi: any) => pi.serial_number);
      const origen =
        fc.origin === 'Sin selección' ? 'Sin control de stock'
          : fc.origin === 'Lote' ? (fc.stock?.batch?.batch_identification ?? 'Lote no definido')
            : fc.origin === 'Provisto por terceros' ? (
              fc.supplier?.person?.human
                ? `Provisto por ${fc.supplier.person.human.lastname} ${fc.supplier.person.human.firstname}`
                : fc.supplier?.person?.legal_entity
                  ? `Provisto por ${fc.supplier.person.legal_entity.company_name}`
                  : 'Provisto por tercero'
            )
              : fc.origin;

      const cantidadCompo = +fc.quantity;
      const cantidadTotal = cantidad * cantidadCompo;
      const cantidadFmt = esEntero ? cantidadCompo.toString() : cantidadCompo.toFixed(2);
      const totalFmt = esEntero ? cantidadTotal.toString() : cantidadTotal.toFixed(2);

      const nodoComponente: TraceNode = {
        id: `frozen-${fc.uuid ?? i}`,
        label: `🧩 Componente: ${fc.name ?? '(sin nombre)'}`,
        children: [
          { id: `origen-${i}`, label: ` Origen: ${origen}` },
          ...(seriales.length > 0 ? [{
            id: `seriales-${i}`,
            label: ` Números de serie: ${seriales.join(' - ')}`,
          }] : []),
          { id: `cantidad-unitaria-${i}`, label: ` Cantidad por producto: ${cantidadFmt}` },
          { id: `cantidad-total-${i}`, label: ` Cantidad total: ${totalFmt}` }
        ]
      };

      children.push(nodoComponente);
    });

    return {
      id: `produccion-${prod.uuid}`,
      label: `📦 Producto: ${prod.product?.name ?? '(sin nombre)'}`,
      children
    };



  }

}

