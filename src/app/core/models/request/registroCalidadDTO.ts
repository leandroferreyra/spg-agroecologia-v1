export class RegistroCalidadDTO {

    record_type?: string;
    stock_uuid?: string;
    detection_datetime?: string;
    quantity?: number;
    description?: string;
    "user->responsible_user_uuid": string;
    product_instance_uuids?: string[] = [];

    with: string[] = [];
    actual_role?: string;

    constructor() {

    }
}