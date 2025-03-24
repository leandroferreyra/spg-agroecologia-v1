export class Paginador {
    currentPage: number;
    itemsPerPage: number;
    itemsInPage: number;
    pageSize: number;
    totalItems: number;

    constructor(items: number) {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.itemsInPage = 10;
        this.pageSize = 0;
        this.totalItems = items;
    }
}
