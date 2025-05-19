export class PagoDTO {

    transaction_uuid!: string;
    payments_datetime!: string;
    payments_method!: string;
    amount!: number;
    detail!: string;
    currency_uuid!: string;
    exchange_rate!: number;
    actual_role!: string;
    with: string[] = [];

    constructor() {

    }
}
