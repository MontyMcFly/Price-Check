'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';

export default function AddProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    storeName: '',
    location: '',
    price: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Get or Create Product
      let productId;
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('name', formData.productName)
        .limit(1);

      if (existingProduct && existingProduct.length > 0) {
        productId = existingProduct[0].id;
      } else {
        const { data: newProduct, error: prodErr } = await supabase
          .from('products')
          .insert({ name: formData.productName, category: formData.category })
          .select()
          .single();
        if (prodErr) throw prodErr;
        productId = newProduct.id;
      }

      // 2. Get or Create Store
      let storeId;
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('name', formData.storeName)
        .limit(1);

      if (existingStore && existingStore.length > 0) {
        storeId = existingStore[0].id;
      } else {
        const { data: newStore, error: storeErr } = await supabase
          .from('stores')
          .insert({ name: formData.storeName, location: formData.location })
          .select()
          .single();
        if (storeErr) throw storeErr;
        storeId = newStore.id;
      }

      // 3. Log Price
      const { error: priceErr } = await supabase
        .from('prices')
        .insert({
          product_id: productId,
          store_id: storeId,
          price: parseFloat(formData.price)
        });
      
      if (priceErr) throw priceErr;

      setSuccessMsg('Product and price logged successfully!');
      setFormData({ productName: '', category: '', storeName: '', location: '', price: '' });
      
      // Optionally redirect to list or stay
      // router.push('/list');
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className="headline-lg">Log a Price</h1>
        <p className="body-md" style={{ color: 'var(--color-secondary)' }}>Help the community by registering a new price.</p>
      </header>

      {successMsg && <div className={styles.successAlert}>{successMsg}</div>}
      {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formSection}>
          <h3 className="headline-sm">Product Details</h3>
          
          <div className={styles.inputGroup}>
            <label htmlFor="productName" className="label-sm">Product Name</label>
            <input 
              type="text" 
              id="productName" 
              name="productName" 
              value={formData.productName} 
              onChange={handleChange} 
              required 
              placeholder="e.g., Sony WH-1000XM4"
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="category" className="label-sm">Category</label>
            <select 
              id="category" 
              name="category" 
              value={formData.category} 
              onChange={handleChange} 
              required
              className={styles.input}
            >
              <option value="" disabled>Select a category</option>
              <option value="Electronics">Electronics</option>
              <option value="Groceries">Groceries</option>
              <option value="Appliances">Appliances</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className="headline-sm">Store & Price</h3>
          
          <div className={styles.inputGroup}>
            <label htmlFor="storeName" className="label-sm">Store Name</label>
            <input 
              type="text" 
              id="storeName" 
              name="storeName" 
              value={formData.storeName} 
              onChange={handleChange} 
              required 
              placeholder="e.g., Target"
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="location" className="label-sm">Location / Branch (Optional)</label>
            <input 
              type="text" 
              id="location" 
              name="location" 
              value={formData.location} 
              onChange={handleChange} 
              placeholder="e.g., Downtown"
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="price" className="label-sm">Price ($)</label>
            <input 
              type="number" 
              id="price" 
              name="price" 
              step="0.01"
              min="0"
              value={formData.price} 
              onChange={handleChange} 
              required 
              placeholder="0.00"
              className={`${styles.input} ${styles.priceInput}`}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Saving...' : 'Save Price Check'}
        </button>
      </form>
    </div>
  );
}
