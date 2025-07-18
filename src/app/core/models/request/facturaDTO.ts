export class FacturaDTO {

    transaction_uuid?: string;
    account_document_type_uuid!: string;
    document_datetime!: string;
    prefix_number!: string;
    document_number!: string;
    currency_uuid!: string;
    exchange_rate!: string;
    is_invoice!: boolean;

    with: any[] = [];
    actual_role!: string;

    constructor() {

    }

}
