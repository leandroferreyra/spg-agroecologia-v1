export const initialState = {
    isDarkMode: false,
    mainLayout: 'app',
    theme: 'light',
    menu: 'vertical',
    layout: 'full',
    rtlClass: 'ltr',
    animation: '',
    navbar: 'navbar-sticky',
    locale: 'en',
    sidebar: false,
    isShowMainLoader: true,
    semidark: false,
    userRole: '',
    menuItems: [] as MenuItem[]

};

export interface MenuItem {
    label: string;
    route: string;
    submenu?: MenuItem[];
}

export function indexReducer(state = initialState, action: any) {
    // console.log('[Reducer] Action recibida:', action.type, action.payload);
    // console.log('[Reducer] Estado actual:', state);

    const type = action.type;
    let payload = action.payload;

    if (type === 'toggleDirection') {
        localStorage.setItem('direction', payload);
        document.querySelector('html')?.setAttribute('dir', payload || 'ltr');
        return { ...state, ...{ direction: payload } };
    } else if (type === 'toggleMainLoader') {
        return { ...state, ...{ isShowMainLoader: payload } };
    } else if (type === 'toggleMenu') {
        payload = payload || state.menu; // vertical, collapsible-vertical, horizontal
        localStorage.setItem('menu', payload);
        return { ...state, ...{ sidebar: false, menu: payload } };
    } else if (type === 'toggleLayout') {
        payload = payload || state.layout; // full, boxed-layout
        localStorage.setItem('layout', payload);
        return { ...state, ...{ layout: payload } };
    } else if (type === 'toggleAnimation') {
        payload = payload; // animate__fadeIn, animate__fadeInDown, animate__fadeInUp, animate__fadeInLeft, animate__fadeInRight, animate__slideInDown, animate__slideInLeft, animate__slideInRight, animate__zoomIn
        payload = payload?.trim();
        localStorage.setItem('animation', payload);
        if (payload) {
            const eleanimation: any = document.querySelector('.animation');
            eleanimation?.classList.add('animate__animated');
            eleanimation?.classList.add(payload);
        }
        return { ...state, ...{ animation: payload } };
    } else if (type === 'toggleNavbar') {
        payload = payload || state.navbar; // navbar-sticky, navbar-floating, navbar-static
        localStorage.setItem('navbar', payload);
        return { ...state, ...{ navbar: payload } };
    } else if (type === 'toggleSidebar') {
        return { ...state, ...{ sidebar: !state.sidebar } };
    }
    else if (type === 'setUserRole') {
        // console.log('[Reducer] Procesando setUserRole con payload:', payload);
        payload = payload || state.userRole;
        const menuItems = getMenuByRole(payload);
        // console.log('[Reducer] Nuevos menuItems:', menuItems);
        return { ...state, userRole: payload, menuItems };
    }

    // console.log('[Reducer] Estado final:', state);
    return state;
}

function getMenuByRole(role: string) {
    // console.log('[getMenuByRole] Obteniendo menú para rol:', role);
    switch (role) {
        case 'ADMIN':
        case 'ADMINISTRACION':
            return [
                { label: 'Productos', route: '/productos' },
                { label: 'Producción', route: '/produccion' },
                { label: 'Compras', route: '/users' },
                { label: 'Ventas', route: '/settings' },
                { label: 'Proveedores', route: '/proveedores' },
                { label: 'Clientes', route: '/clientes' },
                { label: 'Equipos', route: '/settings' },
                {
                    label: 'Configuraciones', route: '', submenu: [
                        { label: 'Usuarios', route: 'usuarios' },
                        { label: 'Bancos', route: 'bancos' },
                        { label: 'Países', route: 'paises' },
                        { label: 'Provincias', route: 'provincias' },
                        { label: 'Ciudades', route: 'ciudades' },
                        { label: 'Géneros', route: 'generos' },
                        { label: 'Monedas', route: 'monedas' },
                        { label: 'Ubicaciones', route: 'ubicaciones' },
                        { label: 'Tipos de cambio', route: 'exchanges' },
                        { label: 'Tipos de productos', route: 'tipos-productos' },
                        { label: 'Cuentas bancarias de LADIE', route: 'cuentas-bancarias' },
                        { label: 'Categorías de productos', route: 'categorias-productos' },
                    ]
                },
                { label: 'Mis datos', route: '/user-profile' },
            ];
        case 'PRODUCCION':
            return [
                { label: 'Producción', route: '/produccion' },
                { label: 'Mis datos', route: '/user-profile' },
            ];
        case 'USUARIO':
        default:
            return [
                { label: 'Mis datos', route: '/user-profile' },
            ];
    }
}

