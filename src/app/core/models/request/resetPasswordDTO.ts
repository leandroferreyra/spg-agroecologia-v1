export class ResetPasswordDTO {

    new_password!: string;
    new_password_confirmation!: string;
    hash!: string;

    constructor() {

    }
}