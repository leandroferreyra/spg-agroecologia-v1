export class CuentaBancariaDTO {

    bank_uuid!: string;
    account_type_uuid!: string;
    currency_uuid!: string;
    account_number!: string;
    cbu!: string;
    alias!: string;
    actual_role!: string;
    with: string[] = [];

    constructor() {

    }
}