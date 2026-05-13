'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import ProductPriceForm from '@/components/ProductPriceForm';

interface Product {
  id: string;
  name: string;
  category: string;
  quantity_amount: number | null;
  unit: string | null;
  package_size: number | null;
  created_at: string;
}

const UNITS = ['ml', 'l', 'g', 'kg', 'oz', 'lb', 'piezas'];

export default function ProductsManager() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');

  // Modal modes: 'add' = full form, 'edit' = simple product edit
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', quantity_amount: '', unit: 'ml', package_size: '1' });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading) fetchProducts();
  }, [loading, user]);

  async function fetchProducts() {
    setProductsLoading(true);
    setFetchError('');
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) setFetchError(error.message);
    else setProducts(data || []);
    setProductsLoading(false);
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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro? Esto eliminará también todos los precios y entradas de lista.')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) setProducts(products.filter(p => p.id !== id));
    else alert('Error: ' + error.message);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
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
      category: editForm.category || null,
      quantity_amount: editForm.quantity_amount ? parseFloat(editForm.quantity_amount) : null,
      unit: editForm.quantity_amount ? editForm.unit : null,
      package_size: parseInt(editForm.package_size) || 1,
    }).eq('id', editingProduct.id);
    if (error) alert('Error: ' + error.message);
    else { fetchProducts(); setModalMode(null); }
  };

  const closeModal = () => { setModalMode(null); setEditingProduct(null); };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><p className="body-md">Cargando...</p></div>;

  return (
    <div className={styles.container}>
      {toast && <div className={styles.toast}>{toast}</div>}

      <header className={styles.header}>
        <div>
          <h1 className="headline-lg">Catálogo</h1>
          <p className="body-md" style={{ color: 'var(--color-secondary)' }}>
            {products.length} producto{products.length !== 1 ? 's' : ''} registrado{products.length !== 1 ? 's' : ''}
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
      ) : products.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline-variant)' }}>inventory_2</span>
          <p className="body-lg" style={{ marginTop: '12px' }}>Sin productos aún.</p>
          <p className="body-md" style={{ color: 'var(--color-secondary)' }}>Haz clic en "Nuevo" para agregar el primero.</p>
        </div>
      ) : (
        <div className={styles.productList}>
          {products.map(product => {
            const isAdded = addedIds.has(product.id);
            const hasContent = product.quantity_amount && product.unit;
            const packageLabel = (product.package_size && product.package_size > 1)
              ? `${product.package_size}x ` : '';
            return (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productInfo}>
                  <h3 className="body-lg" style={{ fontWeight: 600 }}>{product.name}</h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                    {product.category && (
                      <span className="label-caps" style={{ color: 'var(--color-secondary)' }}>{product.category}</span>
                    )}
                    {hasContent && (
                      <span className={styles.unitBadge}>{packageLabel}{product.quantity_amount} {product.unit}</span>
                    )}
                    <span className="label-caps" style={{ color: 'var(--color-outline)' }}>
                      {new Date(product.created_at).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                </div>
                <div className={styles.actions}>
                  {user && (
                    <button
                      onClick={() => handleAddToList(product)}
                      className={`${styles.iconButton} ${isAdded ? styles.addedBtn : styles.addToListBtn}`}
                      title={isAdded ? 'Ya en tu lista' : 'Agregar a lista'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {isAdded ? 'check_circle' : 'playlist_add'}
                      </span>
                    </button>
                  )}
                  <button onClick={() => openEdit(product)} className={`${styles.iconButton} ${styles.editBtn}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                  </button>
                  <button onClick={() => handleDelete(product.id)} className={`${styles.iconButton} ${styles.deleteBtn}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD MODAL — full shared form */}
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

      {/* EDIT MODAL — simple product metadata */}
      {modalMode === 'edit' && editingProduct && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 className="headline-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>Editar Producto</h2>

            <div className={styles.inputGroup}>
              <label className="label-sm">Nombre *</label>
              <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={styles.input} />
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
