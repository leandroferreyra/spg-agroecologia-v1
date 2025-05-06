export class ProductoTransaccionDTO {

    transaction_uuid!: string;
    product_uuid!: string;
    quantity!: string;
    unit_price!: string;
    control_result!: boolean;
    "user->control_user_uuid"!: string;
    password!: string;
    control_comments!: string;
    location_uuid!: string;
    actual_role!: string;
    with: string[] = [];

    constructor() {

    }
}