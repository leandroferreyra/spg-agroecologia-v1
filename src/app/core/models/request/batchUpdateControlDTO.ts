export class BatchUpdateControlDTO {

    transaction_product_uuids: string[] = [];
    control_result?: boolean | null;
    "user->control_user_uuid"!: string | null;
    control_user_name!: string;
    control_user_email!: string;
    password?: string | null;
    control_comments!: string | null;
    with: string[] = [];
    actual_role!: string;

    constructor() {

    }
}