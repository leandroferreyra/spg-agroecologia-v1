export const environment = {
    production: true,
    // URL relativa: nginx (ver nginx.conf) reenvía /tesina/* al backend dentro
    // del docker-compose, así funciona en cualquier servidor sin recompilar.
  baseUrl: '/tesina'
};
