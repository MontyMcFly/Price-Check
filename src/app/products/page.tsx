'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  category: string;
  quantity_amount: number | null;
  unit: string | null;
  created_at: string;
}

const UNITS = ['g', 'kg', 'ml', 'l', 'oz', 'lb', 'units'];

export default function ProductsManager() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity_amount: '',
    unit: 'g',
    created_at: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading) fetchProducts();
  }, [loading, user]);

  async function fetchProducts() {
    setProductsLoading(true);
    setFetchError('');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
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
      .from('shopping_list')
      .select('id')
      .eq('product_id', product.id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .limit(1);
    if (existing && existing.length > 0) {
      setAddedIds(prev => new Set([...prev, product.id]));
      showToast(`"${product.name}" is already on your list!`);
      return;
    }
    const { error } = await supabase.from('shopping_list').insert({
      product_id: product.id,
      user_id: user.id,
      quantity: 1,
      status: 'pending',
    });
    if (!error) {
      setAddedIds(prev => new Set([...prev, product.id]));
      showToast(`"${product.name}" added to your list! \u2713`);
    } else {
      showToast('Error: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will also remove all prices and list entries for this product.')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) setProducts(products.filter(p => p.id !== id));
    else alert('Error deleting: ' + error.message);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        category: product.category || '',
        quantity_amount: product.quantity_amount?.toString() || '',
        unit: product.unit || 'g',
        created_at: product.created_at ? product.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', category: '', quantity_amount: '', unit: 'g', created_at: new Date().toISOString().split('T')[0] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingId(null); };

  const handleSave = async () => {
    if (!formData.name) return alert('Product name is required');
    const payload = {
      name: formData.name,
      category: formData.category,
      quantity_amount: formData.quantity_amount ? parseFloat(formData.quantity_amount) : null,
      unit: formData.quantity_amount ? formData.unit : null,
      created_at: formData.created_at ? new Date(formData.created_at).toISOString() : new Date().toISOString(),
    };
    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId);
      if (error) alert('Error updating: ' + error.message);
      else fetchProducts();
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) alert('Error adding: ' + error.message);
      else fetchProducts();
    }
    closeModal();
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><p className="body-md">Loading...</p></div>;

  return (
    <div className={styles.container}>
      {toast && <div className={styles.toast}>{toast}</div>}
      <header className={styles.header}>
        <div>
          <h1 className="headline-lg">Catalog</h1>
          <p className="body-md" style={{ color: 'var(--color-secondary)' }}>
            {user ? 'Tap + to add products to your list.' : 'Sign in to manage your list.'}
          </p>
        </div>
        <button onClick={() => openModal()} className={styles.addButton}>
          <span className="material-symbols-outlined">add</span>New
        </button>
      </header>

      {fetchError && (
        <div style={{ background: 'var(--color-error-container)', color: 'var(--color-error)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          Error: {fetchError}
        </div>
      )}

      {productsLoading ? (
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>Loading catalog...</p>
      ) : products.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline-variant)' }}>inventory_2</span>
          <p className="body-lg" style={{ marginTop: '12px' }}>No products yet.</p>
          <p className="body-md" style={{ color: 'var(--color-secondary)' }}>Click "New" to add the first product!</p>
        </div>
      ) : (
        <div className={styles.productList}>
          {products.map(product => {
            const isAdded = addedIds.has(product.id);
            return (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productInfo}>
                  <h3 className="body-lg" style={{ fontWeight: 600 }}>{product.name}</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                    <span className="label-caps" style={{ color: 'var(--color-secondary)' }}>{product.category || 'Uncategorized'}</span>
                    {product.quantity_amount && product.unit && (
                      <span className={styles.unitBadge}>{product.quantity_amount} {product.unit}</span>
                    )}
                    <span className="label-caps" style={{ color: 'var(--color-outline)' }}>{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={styles.actions}>
                  {user && (
                    <button onClick={() => handleAddToList(product)} className={`${styles.iconButton} ${isAdded ? styles.addedBtn : styles.addToListBtn}`} aria-label="Add to list" title={isAdded ? 'Already on your list' : 'Add to list'}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{isAdded ? 'check_circle' : 'playlist_add'}</span>
                    </button>
                  )}
                  <button onClick={() => openModal(product)} className={`${styles.iconButton} ${styles.editBtn}`} aria-label="Edit">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                  </button>
                  <button onClick={() => handleDelete(product.id)} className={`${styles.iconButton} ${styles.deleteBtn}`} aria-label="Delete">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 className="headline-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>{editingId ? 'Edit Product' : 'New Product'}</h2>
            <div className={styles.inputGroup}>
              <label className="label-sm">Product Name *</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={styles.input} placeholder="e.g. Avocado" />
            </div>
            <div className={styles.inputGroup}>
              <label className="label-sm">Category</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={styles.input}>
                <option value="">Select...</option>
                <option value="Electronics">Electronics</option>
                <option value="Groceries">Groceries</option>
                <option value="Appliances">Appliances</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup} style={{ flex: 2 }}>
                <label className="label-sm">Content Amount</label>
                <input type="number" min="0" step="0.1" value={formData.quantity_amount} onChange={e => setFormData({ ...formData, quantity_amount: e.target.value })} className={styles.input} placeholder="e.g. 500" />
              </div>
              <div className={styles.inputGroup} style={{ flex: 1 }}>
                <label className="label-sm">Unit</label>
                <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className={styles.input}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label className="label-sm">Date Added</label>
              <input type="date" value={formData.created_at} onChange={e => setFormData({ ...formData, created_at: e.target.value })} className={styles.input} />
            </div>
            <div className={styles.modalActions}>
              <button onClick={closeModal} className={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSave} className={styles.saveBtn}>Save Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
