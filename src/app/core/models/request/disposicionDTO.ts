export class DisposicionDTO {

    quality_record_uuid?: string;
    disposition_datetime?: string;
    defect_type?: string;
    disposition_action?: string;
    disposition_instruction?: number;
    corrective_action?: string;
    "user->responsible_user_uuid": string;
    corrective_action_comments?: string[] = [];

    with: string[] = [];
    actual_role?: string;

    constructor() {

    }
}