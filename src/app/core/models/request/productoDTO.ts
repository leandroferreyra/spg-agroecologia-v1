export class ProductoDTO {

    name!: string;
    code!: string;
    product_type_uuid!: string;
    comments!: string;
    measure_uuid!: string;
    product_category_uuid!: string;
    possible_product_state_uuid!: string;
    vat_percent!: string;
    country_uuid!: string;
    mercosur_nomenclature!: string;
    assign_serial_number!: boolean;
    has_serial_number!: boolean;
    traceable!: boolean;
    salable!: boolean;
    sales_name!: string;
    control_description!: string;
    product_state!: ProductState;
    minimum!: number;
    optimum!: number;
    purchases_quantity!: number;
    calculation_function!: string;
    with: string[] = [];
    actual_role!: string;


    constructor() {

    }

}

export class ProductState {

    possible_product_state_uuid!: string;
    comments!: string;
}