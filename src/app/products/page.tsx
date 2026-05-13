'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

interface Product {
  id: string;
  name: string;
  category: string;
}

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? All related prices and shopping list items will also be removed.')) return;
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert('Error deleting product: ' + error.message);
    } else {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({ name: product.name, category: product.category || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', category: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', category: '' });
  };

  const handleSave = async () => {
    if (!formData.name) return alert('Name is required');

    if (editingId) {
      const { error } = await supabase
        .from('products')
        .update({ name: formData.name, category: formData.category })
        .eq('id', editingId);
      
      if (error) alert('Error updating: ' + error.message);
      else fetchProducts();
    } else {
      const { error } = await supabase
        .from('products')
        .insert({ name: formData.name, category: formData.category });
      
      if (error) alert('Error adding: ' + error.message);
      else fetchProducts();
    }
    closeModal();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className="headline-lg">Catalog</h1>
          <p className="body-md" style={{ color: 'var(--color-secondary)' }}>Manage your products database.</p>
        </div>
        <button onClick={() => openModal()} className={styles.addButton}>
          <span className="material-symbols-outlined">add</span>
          New
        </button>
      </header>

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>No products in database. Add one to get started.</p>
      ) : (
        <div className={styles.productList}>
          {products.map(product => (
            <div key={product.id} className={styles.productCard}>
              <div className={styles.productInfo}>
                <h3 className="body-lg" style={{ fontWeight: 600 }}>{product.name}</h3>
                <span className="label-caps" style={{ color: 'var(--color-secondary)' }}>
                  {product.category || 'Uncategorized'}
                </span>
              </div>
              <div className={styles.actions}>
                <button onClick={() => openModal(product)} className={`${styles.iconButton} ${styles.editBtn}`} aria-label="Edit">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                </button>
                <button onClick={() => handleDelete(product.id)} className={`${styles.iconButton} ${styles.deleteBtn}`} aria-label="Delete">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className="headline-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>
              {editingId ? 'Edit Product' : 'New Product'}
            </h2>
            
            <div className={styles.inputGroup}>
              <label className="label-sm">Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={styles.input}
                placeholder="e.g. Avocado"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className="label-sm">Category</label>
              <select 
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className={styles.input}
              >
                <option value="">Select...</option>
                <option value="Electronics">Electronics</option>
                <option value="Groceries">Groceries</option>
                <option value="Appliances">Appliances</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className={styles.modalActions}>
              <button onClick={closeModal} className={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSave} className={styles.saveBtn}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
