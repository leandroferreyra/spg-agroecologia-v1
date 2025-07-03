export class ProductoTransaccionDTO {

    transaction_uuid!: string;
    product_uuid!: string;
    quantity!: string;
    unit_price!: string;
    control_result?: boolean | null;
    "user->control_user_uuid"!: string | null;
    control_user_name!: string;
    control_user_email!: string;
    password?: string | null;
    control_comments!: string | null;
    location_uuid?: string;
    serial_number?: string;
    stock_uuid?: string;
    actual_role!: string;
    with: string[] = [];

    constructor() {

    }
}