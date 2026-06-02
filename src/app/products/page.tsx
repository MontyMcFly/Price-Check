'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import ProductPriceForm from '@/components/ProductPriceForm';
import { calculatePerformance } from '@/lib/utils/unitConverter';

interface Store {
  id: string;
  name: string;
  location: string | null;
}

interface Price {
  price: number;
  date_recorded: string;
  stores: Store;
}

interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  quantity_amount: number | null;
  unit: string | null;
  package_size: number | null;
  created_at: string;
  prices: Price[];
}

interface PriceComparison {
  product: Product;
  priceRecord: Price;
  baseAmount: number;
  baseUnit: string;
  pricePerBaseUnit: number;
}

interface ProductGroup {
  name: string;
  products: Product[];
  comparisons: PriceComparison[];
  bestOption: PriceComparison | null;
}

const UNITS = ['ml', 'l', 'g', 'kg', 'oz', 'lb', 'piezas'];

export default function ProductsManager() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ name: '', brand: '', category: '', quantity_amount: '', unit: 'ml', package_size: '1' });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading) fetchProducts();
  }, [loading, user]);

  async function fetchProducts() {
    setProductsLoading(true);
    setFetchError('');
    // Join products, prices, and stores
    const { data, error } = await supabase.from('products').select(`
      *,
      prices (
        price,
        date_recorded,
        stores (
          id,
          name,
          location
        )
      )
    `).order('name');

    if (error) {
      setFetchError(error.message);
    } else {
      const groups = groupProducts((data as any) || []);
      setProductGroups(groups);
    }
    setProductsLoading(false);
  }

  function groupProducts(products: Product[]): ProductGroup[] {
    const groups = new Map<string, ProductGroup>();

    for (const product of products) {
      const key = product.name.trim().toLowerCase();
      if (!groups.has(key)) {
        groups.set(key, { name: product.name.trim(), products: [], comparisons: [], bestOption: null });
      }
      const group = groups.get(key)!;
      group.products.push(product);

      for (const price of product.prices || []) {
        // Ensure stores object exists (sometimes postgrest returns an array if relation is weird, but it should be object for x-to-one)
        const store = Array.isArray(price.stores) ? price.stores[0] : price.stores;
        if (!store) continue;

        const perf = calculatePerformance(
          price.price,
          product.quantity_amount,
          product.unit,
          product.package_size
        );

        if (perf) {
          group.comparisons.push({
            product,
            priceRecord: { ...price, stores: store },
            baseAmount: perf.baseAmount,
            baseUnit: perf.baseUnit,
            pricePerBaseUnit: perf.pricePerBaseUnit
          });
        }
      }
    }

    const result = Array.from(groups.values());
    for (const group of result) {
      group.comparisons.sort((a, b) => a.pricePerBaseUnit - b.pricePerBaseUnit);
      if (group.comparisons.length > 0) {
        group.bestOption = group.comparisons[0];
      }
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAddToList = async (product: Product) => {
    if (!user) { router.push('/login'); return; }
    const { data: existing } = await supabase
      .from('shopping_list').select('id')
      .eq('product_id', product.id).eq('user_id', user.id).eq('status', 'pending').limit(1);

    if (existing && existing.length > 0) {
      setAddedIds(prev => new Set([...prev, product.id]));
      showToast(`"${product.name}" ya está en tu lista`);
      return;
    }
    const { error } = await supabase.from('shopping_list').insert({
      product_id: product.id, user_id: user.id, quantity: 1, status: 'pending',
    });
    if (!error) {
      setAddedIds(prev => new Set([...prev, product.id]));
      showToast(`"${product.name}" agregado a tu lista ✓`);
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      brand: product.brand || '',
      category: product.category || '',
      quantity_amount: product.quantity_amount?.toString() || '',
      unit: product.unit || 'ml',
      package_size: product.package_size?.toString() || '1',
    });
    setModalMode('edit');
  };

  const handleEditSave = async () => {
    if (!editingProduct || !editForm.name) return;
    const { error } = await supabase.from('products').update({
      name: editForm.name,
      brand: editForm.brand || null,
      category: editForm.category || null,
      quantity_amount: editForm.quantity_amount ? parseFloat(editForm.quantity_amount) : null,
      unit: editForm.quantity_amount ? editForm.unit : null,
      package_size: parseInt(editForm.package_size) || 1,
    }).eq('id', editingProduct.id);
    if (error) alert('Error: ' + error.message);
    else { fetchProducts(); setModalMode(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro? Esto eliminará también todos los precios y entradas de lista asociados a esta variante.')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) fetchProducts();
    else alert('Error: ' + error.message);
  };

  const closeModal = () => { setModalMode(null); setEditingProduct(null); };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><p className="body-md">Cargando...</p></div>;

  return (
    <div className={styles.container}>
      {toast && <div className={styles.toast}>{toast}</div>}

      <header className={styles.header}>
        <div>
          <h1 className="headline-lg">Catálogo Inteligente</h1>
          <p className="body-md" style={{ color: 'var(--color-secondary)' }}>
            Comparador de precios por rendimiento
          </p>
        </div>
        <button onClick={() => setModalMode('add')} className={styles.addButton}>
          <span className="material-symbols-outlined">add</span>Nuevo
        </button>
      </header>

      {fetchError && (
        <div style={{ background: 'var(--color-error-container)', color: 'var(--color-error)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          Error: {fetchError}
        </div>
      )}

      {productsLoading ? (
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>Cargando catálogo...</p>
      ) : productGroups.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline-variant)' }}>inventory_2</span>
          <p className="body-lg" style={{ marginTop: '12px' }}>Sin productos aún.</p>
          <p className="body-md" style={{ color: 'var(--color-secondary)' }}>Agrega un producto para empezar a comparar precios.</p>
        </div>
      ) : (
        <div className={styles.productList}>
          {productGroups.map(group => {
            const isExpanded = expandedGroups.has(group.name);
            const { bestOption } = group;

            return (
              <div key={group.name} className={styles.productCard} style={{ display: 'flex', flexDirection: 'column', padding: '16px' }}>
                {/* Header: Title and best option summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="headline-sm" style={{ fontWeight: 600 }}>{group.name}</h3>
                    {bestOption ? (
                      <div style={{ marginTop: '8px', background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '8px 12px', borderRadius: '8px', display: 'inline-block' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>★ Mejor Opción</div>
                        <div style={{ fontSize: '15px' }}>
                          {bestOption.priceRecord.stores.name}: <strong>${bestOption.priceRecord.price.toFixed(2)}</strong>
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>
                          {bestOption.product.brand && `${bestOption.product.brand} - `}
                          {bestOption.product.quantity_amount} {bestOption.product.unit} 
                          ({'$' + bestOption.pricePerBaseUnit.toFixed(2)} / {bestOption.baseUnit})
                        </div>
                      </div>
                    ) : (
                      <p className="body-sm" style={{ color: 'var(--color-outline)', marginTop: '4px' }}>Sin precios para comparar rendimientos.</p>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {bestOption && user && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddToList(bestOption.product); }}
                        className={`${styles.iconButton} ${addedIds.has(bestOption.product.id) ? styles.addedBtn : styles.addToListBtn}`}
                        title="Agregar la mejor opción a mi lista"
                        style={{ padding: '8px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', border: 'none' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                          {addedIds.has(bestOption.product.id) ? 'check' : 'add_shopping_cart'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '12px' }}>
                  <button 
                    onClick={() => toggleGroup(group.name)} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', marginRight: '4px' }}>
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                    {isExpanded ? 'Ocultar comparativa' : `Ver comparativa (${group.comparisons.length} opciones)`}
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {group.comparisons.length > 0 ? group.comparisons.map((comp, idx) => (
                      <div key={idx} style={{ 
                        background: 'var(--color-surface-container-low)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: idx === 0 ? '1px solid var(--color-primary)' : '1px solid transparent'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{comp.priceRecord.stores.name}</div>
                          <div style={{ fontSize: '13px', color: 'var(--color-secondary)' }}>
                            {comp.product.brand && <span style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{comp.product.brand} </span>}
                            - {comp.product.quantity_amount} {comp.product.unit}
                            {comp.product.package_size && comp.product.package_size > 1 ? ` (x${comp.product.package_size})` : ''}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-outline)', marginTop: '4px' }}>
                            {new Date(comp.priceRecord.date_recorded).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, fontSize: '16px' }}>${comp.priceRecord.price.toFixed(2)}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-secondary)' }}>${comp.pricePerBaseUnit.toFixed(2)} / {comp.baseUnit}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                           <button onClick={() => openEdit(comp.product)} className={`${styles.iconButton} ${styles.editBtn}`} style={{ padding: '6px' }}>
                             <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                           </button>
                           <button onClick={() => handleDelete(comp.product.id)} className={`${styles.iconButton} ${styles.deleteBtn}`} style={{ padding: '6px' }}>
                             <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                           </button>
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding: '12px', background: 'var(--color-surface-container-low)', borderRadius: '8px' }}>
                        {/* Si no tienen información de cantidad/precio, simplemente listarlos para poder editarlos */}
                        <p className="body-sm" style={{ color: 'var(--color-secondary)', marginBottom: '8px' }}>Productos sin datos de rendimiento:</p>
                        {group.products.map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-outline-variant)' }}>
                            <span className="body-sm">{p.brand || 'Sin marca'}</span>
                            <div>
                               <button onClick={() => openEdit(p)} className={styles.iconButton} style={{ padding: '4px' }}>
                                 <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ADD MODAL */}
      {modalMode === 'add' && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <h2 className="headline-sm">Registrar Producto</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: 'var(--color-secondary)' }}>✕</button>
            </div>
            <ProductPriceForm
              onSuccess={() => { fetchProducts(); closeModal(); showToast('Producto registrado ✓'); }}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {modalMode === 'edit' && editingProduct && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 className="headline-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>Editar Producto</h2>

            <div className={styles.inputGroup}>
              <label className="label-sm">Nombre *</label>
              <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={styles.input} />
            </div>
            <div className={styles.inputGroup}>
              <label className="label-sm">Marca</label>
              <input type="text" value={editForm.brand} onChange={e => setEditForm({ ...editForm, brand: e.target.value })} className={styles.input} />
            </div>
            <div className={styles.inputGroup}>
              <label className="label-sm">Categoría</label>
              <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className={styles.input}>
                <option value="">Seleccionar...</option>
                {['Abarrotes','Bebidas','Lácteos','Carnes','Frutas y Verduras','Limpieza','Cuidado Personal','Electrónica','Electrodomésticos','Otro'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup} style={{ flex: 1 }}>
                <label className="label-sm">Unidades</label>
                <input type="number" min="1" value={editForm.package_size} onChange={e => setEditForm({ ...editForm, package_size: e.target.value })} className={styles.input} />
              </div>
              <div className={styles.inputGroup} style={{ flex: 2 }}>
                <label className="label-sm">Contenido por unidad</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" min="0" step="0.1" value={editForm.quantity_amount} onChange={e => setEditForm({ ...editForm, quantity_amount: e.target.value })} className={styles.input} placeholder="355" />
                  <select value={editForm.unit} onChange={e => setEditForm({ ...editForm, unit: e.target.value })} className={styles.input} style={{ maxWidth: '72px' }}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button onClick={closeModal} className={styles.cancelBtn}>Cancelar</button>
              <button onClick={handleEditSave} className={styles.saveBtn}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
