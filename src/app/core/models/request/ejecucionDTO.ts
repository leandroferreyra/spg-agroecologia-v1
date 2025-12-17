export class EjecucionDTO {

    disposition_uuid?: string;
    execution_datetime?: string;
    execution_action?: string;
    // quantity?: string;
    execution_comments?: number;
    "user->responsible_user_uuid": string;

    with: string[] = [];
    actual_role?: string;

    constructor() {

    }
}