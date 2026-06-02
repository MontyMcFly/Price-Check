'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

// ---------------------------------------------------------------------------
// Translation strings
// ---------------------------------------------------------------------------

const translations = {
  es: {
    // Nav
    nav_dashboard: 'Dashboard',
    nav_list: 'Lista',
    nav_add: 'Agregar',
    nav_catalog: 'Catálogo',
    nav_history: 'Historial',

    // Login
    login_title: 'Price Check',
    login_subtitle: 'Ahorros inteligentes, cada día.',
    login_welcome: 'Bienvenido de nuevo',
    login_subtitle2: 'Inicia sesión para acceder a tu lista',
    login_username: 'Usuario',
    login_username_placeholder: 'tu usuario',
    login_password: 'Contraseña',
    login_submit: 'Iniciar Sesión',
    login_loading: 'Iniciando sesión...',
    login_error: 'Usuario o contraseña inválidos.',
    login_no_account: '¿No tienes cuenta?',
    login_create: 'Crear una',

    // Signup
    signup_title: 'Crea tu cuenta',
    signup_subtitle: 'Elige un usuario y listo',
    signup_password_placeholder: 'Mínimo 6 caracteres',
    signup_submit: 'Crear Cuenta',
    signup_loading: 'Creando cuenta...',
    signup_error_username: 'El usuario es obligatorio.',
    signup_error_taken: 'Ese usuario ya está tomado. Elige otro.',
    signup_has_account: '¿Ya tienes cuenta?',
    signup_signin: 'Inicia sesión',

    // Dashboard
    dash_hello: 'Hola',
    dash_greeting: '¿Listo para encontrar las mejores ofertas hoy?',
    dash_signout: 'Cerrar Sesión',
    dash_items_on_list: 'productos en tu lista',
    dash_view_list: 'Ver lista →',
    dash_recent: 'Productos Recientes',
    dash_loading: 'Cargando...',
    dash_no_products: 'Sin productos aún.',
    dash_add_first: '¡Agrega el primero!',

    // List
    list_title: 'Mi Lista',
    list_products: 'productos',
    list_est_total: 'Est. total:',
    list_loading: 'Cargando tu lista...',
    list_empty: 'Tu lista está vacía.',
    list_empty_hint: 'Ve al Catálogo y toca + para agregar productos.',
    list_best_at: 'Mejor en',
    list_no_price: 'Sin precio registrado',
    list_remove: 'Quitar',
    list_purchased: 'Comprado',
    list_confirm_remove: '¿Quitar este producto de tu lista?',

    // Add page
    add_title: 'Registrar Precio',
    add_subtitle: 'Agrega un producto y el precio que encontraste.',

    // ProductPriceForm
    form_product_section: 'Producto',
    form_product_name: 'Nombre del producto *',
    form_product_placeholder: 'ej. Leche entera',
    form_brand: 'Marca',
    form_brand_placeholder: 'ej. Lala',
    form_category: 'Categoría',
    form_category_select: 'Seleccionar...',
    form_units: 'Unidades',
    form_content: 'Contenido por unidad',
    form_date: 'Fecha de compra *',
    form_store_section: 'Tienda y Precio',
    form_store: 'Tienda *',
    form_store_placeholder: 'ej. Walmart',
    form_branch: 'Sucursal',
    form_branch_optional: '(opcional)',
    form_branch_placeholder: 'ej. Centro',
    form_price: 'Precio *',
    form_add_to_list: 'Agregar también a mi lista de compras',
    form_saving: 'Guardando...',
    form_save: 'Guardar',
    form_cancel: 'Cancelar',
    form_success:
      '¡Producto y precio guardados correctamente! (+10 XP, +5 🪙 para tu Axolotl)',
    form_error: 'Error al guardar',

    // Catalog
    catalog_title: 'Catálogo Inteligente',
    catalog_subtitle: 'Comparador de precios por rendimiento',
    catalog_new: 'Nuevo',
    catalog_loading: 'Cargando catálogo...',
    catalog_empty: 'Sin productos aún.',
    catalog_empty_hint:
      'Agrega un producto para empezar a comparar precios.',
    catalog_best: '★ Mejor Opción',
    catalog_no_prices: 'Sin precios para comparar rendimientos.',
    catalog_hide: 'Ocultar comparativa',
    catalog_show: 'Ver comparativa',
    catalog_options: 'opciones',
    catalog_confirm_delete_product:
      '¿Seguro? Esto eliminará también todos los precios y entradas de lista asociados a esta variante.',
    catalog_confirm_delete_price:
      '¿Seguro que deseas eliminar este precio de la tienda?',
    catalog_added_to_list: 'agregado a tu lista (+20% Hambre) ✓',
    catalog_already_in_list: 'ya está en tu lista',

    // History
    history_title: 'Historial',
    history_subtitle: 'Registro de tus compras completadas.',
    history_loading: 'Cargando historial...',
    history_empty: 'Sin historial todavía.',
    history_empty_hint:
      'Marca productos como comprados en tu lista para crear tu historial.',
    history_today: 'Hoy',
    history_yesterday: 'Ayer',
    history_day_total: 'Total del día',
    history_unknown: 'Desconocido',
    history_unknown_store: 'Desconocida',

    // Axolotl
    axolotl_lvl: 'Nvl',
    axolotl_hunger: 'Hambre',
    axolotl_xp: 'Experiencia (XP)',
    axolotl_max_level: '¡Nivel máximo alcanzado!',
    axolotl_xp_needed: 'Faltan {n} XP para crecer',
    axolotl_feed: 'Alimentar (15 🪙)',
    axolotl_info_title: '¿Cómo cuidar a tu Axolote?',
    axolotl_info_1:
      'Por registrar un nuevo producto o precio en el catálogo.',
    axolotl_info_2:
      'Por marcar un producto como comprado en tu lista.',
    axolotl_info_3:
      'Tu Axolote come gratis al agregar algo a tu lista desde el catálogo.',
    axolotl_info_4:
      'Aliméntalo con tus monedas desde el panel si tienes hambre y nada que comprar.',
    axolotl_info_desc:
      'El hambre bajará automáticamente con el tiempo. ¡Mantén a tu Axolote feliz y acumula XP para que evolucione de Huevo hasta Adulto!',
    axolotl_info_ok: 'Entendido',
    axolotl_reward_purchase:
      '+5 XP y +2 🪙 para tu Axolotl por completar un pendiente!',

    // Categories
    categories: [
      'Abarrotes',
      'Bebidas',
      'Lácteos',
      'Carnes',
      'Frutas y Verduras',
      'Limpieza',
      'Cuidado Personal',
      'Electrónica',
      'Electrodomésticos',
      'Otro',
    ] as readonly string[],

    // Level titles
    level_egg: 'Huevo',
    level_baby: 'Bebé',
    level_young: 'Joven',
    level_adult: 'Adulto',

    // Leaderboard
    lb_title: 'Ranking',
    lb_subtitle: 'Los mejores recolectores de precios',
    lb_loading: 'Cargando ranking...',
    lb_empty: 'Sin usuarios aún.',
    lb_products: 'precios',
    lb_you: '(tú)',
    lb_view: '🏆 Ranking',

    // Receipt
    receipt_label: 'Foto del ticket *',
    receipt_hint: 'Toma una foto de tu ticket de compra como verificación.',
    receipt_required: 'La foto del ticket es obligatoria.',
    receipt_uploading: 'Subiendo imagen...',
    receipt_change: 'Cambiar foto',

    // Feedback
    fb_title: 'Sugerencias',
    fb_subtitle: '¡Ayúdanos a mejorar la app!',
    fb_message: 'Tu mensaje',
    fb_placeholder: 'Me gustaría que la app tuviera...',
    fb_send: 'Enviar Sugerencia',
    fb_sending: 'Enviando...',
    fb_success: '¡Gracias por tus sugerencias! Las hemos recibido.',
    fb_error: 'Hubo un error al enviar tu mensaje. Intenta de nuevo.',
    fb_link: 'Dejar Feedback',
  },

  en: {
    // Nav
    nav_dashboard: 'Dashboard',
    nav_list: 'List',
    nav_add: 'Add',
    nav_catalog: 'Catalog',
    nav_history: 'History',

    // Login
    login_title: 'Price Check',
    login_subtitle: 'Smart savings, every day.',
    login_welcome: 'Welcome back',
    login_subtitle2: 'Sign in to access your shopping list',
    login_username: 'Username',
    login_username_placeholder: 'your username',
    login_password: 'Password',
    login_submit: 'Sign In',
    login_loading: 'Signing in...',
    login_error: 'Invalid username or password.',
    login_no_account: "Don't have an account?",
    login_create: 'Create one',

    // Signup
    signup_title: 'Create your account',
    signup_subtitle: "Pick a username and you're ready to go",
    signup_password_placeholder: 'Minimum 6 characters',
    signup_submit: 'Create Account',
    signup_loading: 'Creating account...',
    signup_error_username: 'Username is required.',
    signup_error_taken:
      'That username is already taken. Please choose another.',
    signup_has_account: 'Already have an account?',
    signup_signin: 'Sign in',

    // Dashboard
    dash_hello: 'Hello',
    dash_greeting: 'Ready to find the best deals today?',
    dash_signout: 'Sign Out',
    dash_items_on_list: 'items on your shopping list',
    dash_view_list: 'View list →',
    dash_recent: 'Recently Added Products',
    dash_loading: 'Loading...',
    dash_no_products: 'No products yet.',
    dash_add_first: 'Add the first one!',

    // List
    list_title: 'My List',
    list_products: 'products',
    list_est_total: 'Est. total:',
    list_loading: 'Loading your list...',
    list_empty: 'Your list is empty.',
    list_empty_hint: 'Go to the Catalog and tap + to add products.',
    list_best_at: 'Best at',
    list_no_price: 'No price recorded yet',
    list_remove: 'Remove',
    list_purchased: 'Purchased',
    list_confirm_remove: 'Remove this product from your list?',

    // Add page
    add_title: 'Register Price',
    add_subtitle: 'Add a product and the price you found.',

    // ProductPriceForm
    form_product_section: 'Product',
    form_product_name: 'Product name *',
    form_product_placeholder: 'e.g. Whole milk',
    form_brand: 'Brand',
    form_brand_placeholder: 'e.g. Lala',
    form_category: 'Category',
    form_category_select: 'Select...',
    form_units: 'Units',
    form_content: 'Content per unit',
    form_date: 'Purchase date *',
    form_store_section: 'Store & Price',
    form_store: 'Store *',
    form_store_placeholder: 'e.g. Walmart',
    form_branch: 'Branch',
    form_branch_optional: '(optional)',
    form_branch_placeholder: 'e.g. Downtown',
    form_price: 'Price *',
    form_add_to_list: 'Also add to my shopping list',
    form_saving: 'Saving...',
    form_save: 'Save',
    form_cancel: 'Cancel',
    form_success:
      'Product and price saved successfully! (+10 XP, +5 🪙 for your Axolotl)',
    form_error: 'Error saving',

    // Catalog
    catalog_title: 'Smart Catalog',
    catalog_subtitle: 'Price comparison by performance',
    catalog_new: 'New',
    catalog_loading: 'Loading catalog...',
    catalog_empty: 'No products yet.',
    catalog_empty_hint: 'Add a product to start comparing prices.',
    catalog_best: '★ Best Option',
    catalog_no_prices: 'No prices to compare performance.',
    catalog_hide: 'Hide comparison',
    catalog_show: 'View comparison',
    catalog_options: 'options',
    catalog_confirm_delete_product:
      'Are you sure? This will also delete all associated prices and list entries for this variant.',
    catalog_confirm_delete_price:
      'Are you sure you want to delete this price from this store?',
    catalog_added_to_list: 'added to your list (+20% Hunger) ✓',
    catalog_already_in_list: 'is already on your list',

    // History
    history_title: 'History',
    history_subtitle: 'Record of your completed purchases.',
    history_loading: 'Loading history...',
    history_empty: 'No history yet.',
    history_empty_hint:
      'Mark products as purchased in your list to build your history.',
    history_today: 'Today',
    history_yesterday: 'Yesterday',
    history_day_total: "Day's total",
    history_unknown: 'Unknown',
    history_unknown_store: 'Unknown',

    // Axolotl
    axolotl_lvl: 'Lvl',
    axolotl_hunger: 'Hunger',
    axolotl_xp: 'Experience (XP)',
    axolotl_max_level: 'Max level reached!',
    axolotl_xp_needed: '{n} XP to grow',
    axolotl_feed: 'Feed (15 🪙)',
    axolotl_info_title: 'How to care for your Axolotl?',
    axolotl_info_1:
      'For registering a new product or price in the catalog.',
    axolotl_info_2:
      'For marking a product as purchased in your list.',
    axolotl_info_3:
      'Your Axolotl eats for free when adding something to your list from the catalog.',
    axolotl_info_4:
      'Feed it with your coins from the panel if hungry and nothing to buy.',
    axolotl_info_desc:
      'Hunger will decrease automatically over time. Keep your Axolotl happy and accumulate XP to evolve from Egg to Adult!',
    axolotl_info_ok: 'Got it',
    axolotl_reward_purchase:
      '+5 XP and +2 🪙 for your Axolotl for completing a task!',

    // Categories
    categories: [
      'Groceries',
      'Beverages',
      'Dairy',
      'Meats',
      'Fruits & Veggies',
      'Cleaning',
      'Personal Care',
      'Electronics',
      'Appliances',
      'Other',
    ] as readonly string[],

    // Level titles
    level_egg: 'Egg',
    level_baby: 'Baby',
    level_young: 'Young',
    level_adult: 'Adult',

    // Leaderboard
    lb_title: 'Leaderboard',
    lb_subtitle: 'Top price collectors',
    lb_loading: 'Loading leaderboard...',
    lb_empty: 'No users yet.',
    lb_products: 'prices',
    lb_you: '(you)',
    lb_view: '🏆 Leaderboard',

    // Receipt
    receipt_label: 'Receipt photo *',
    receipt_hint: 'Take a photo of your purchase receipt for verification.',
    receipt_required: 'Receipt photo is required.',
    receipt_uploading: 'Uploading image...',
    receipt_change: 'Change photo',

    // Feedback
    fb_title: 'Feedback',
    fb_subtitle: 'Help us improve the app!',
    fb_message: 'Your message',
    fb_placeholder: 'I wish the app had...',
    fb_send: 'Send Feedback',
    fb_sending: 'Sending...',
    fb_success: 'Thanks for your feedback! We have received it.',
    fb_error: 'There was an error sending your message. Please try again.',
    fb_link: 'Leave Feedback',
  },
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Lang = keyof typeof translations;
export type Translations = (typeof translations)[Lang];

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const STORAGE_KEY = 'pricecheck-lang';
const DEFAULT_LANG: Lang = 'es';

const LanguageContext = createContext<LanguageContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'es') {
        setLangState(stored);
      }
    } catch {
      // localStorage unavailable (SSR, private mode, etc.)
    }
    setMounted(true);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const t = useMemo(() => translations[lang], [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t }),
    [lang, setLang, t],
  );

  // Avoid hydration mismatch by rendering children only after mount
  if (!mounted) return null;

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useLanguageContext(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error(
      'useT / useLanguage must be used inside <LanguageProvider>',
    );
  }
  return ctx;
}

/** Returns the translation strings for the current language. */
export function useT(): Translations {
  return useLanguageContext().t;
}

/** Returns `{ lang, setLang }` to read or toggle the current language. */
export function useLanguage(): { lang: Lang; setLang: (lang: Lang) => void } {
  const { lang, setLang } = useLanguageContext();
  return { lang, setLang };
}
