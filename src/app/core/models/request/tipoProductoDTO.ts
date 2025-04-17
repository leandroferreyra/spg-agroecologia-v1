export class TipoProductoDTO {

    name!: string;
    code!: string;
    is_process!: number;
    description!: string;
    color!: string;
    product_compound!: number;
    product_must_be_traceable!: number;
    stock_controlled!: number;
    can_be_provided!: number;
    can_be_purchased!: number;
    can_be_produced!: number;
    with: string[] = [];
    actual_role!: string;

    constructor() {

    }
}