'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { addXp } from '@/lib/gamification';
import styles from './ProductPriceForm.module.css';

const UNITS = ['ml', 'l', 'g', 'kg', 'oz', 'lb', 'piezas'];
const CATEGORIES = [
  'Abarrotes', 'Bebidas', 'Lácteos', 'Carnes', 'Frutas y Verduras',
  'Limpieza', 'Cuidado Personal', 'Electrónica', 'Electrodomésticos', 'Otro'
];

const today = () => new Date().toISOString().split('T')[0];

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductPriceForm({ onSuccess, onCancel }: Props) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [addToList, setAddToList] = useState(false);

  const [form, setForm] = useState({
    productName: '',
    brand: '',
    category: '',
    units: '1',
    contentAmount: '',
    contentUnit: 'ml',
    date: today(),
    store: '',
    branch: '',
    price: '',
  });

  const set = (field: keyof typeof form, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Find or create product
      let productId: string;
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .ilike('name', form.productName.trim())
        .limit(1);

      if (existingProduct && existingProduct.length > 0) {
        productId = existingProduct[0].id;
        // Update product metadata if we have new info
        await supabase.from('products').update({
          brand: form.brand || undefined,
          category: form.category || undefined,
          quantity_amount: form.contentAmount ? parseFloat(form.contentAmount) : undefined,
          unit: form.contentAmount ? form.contentUnit : undefined,
          package_size: parseInt(form.units) || 1,
        }).eq('id', productId);
      } else {
        const { data: newProd, error: prodErr } = await supabase
          .from('products')
          .insert({
            name: form.productName.trim(),
            brand: form.brand.trim() || null,
            category: form.category || null,
            quantity_amount: form.contentAmount ? parseFloat(form.contentAmount) : null,
            unit: form.contentAmount ? form.contentUnit : null,
            package_size: parseInt(form.units) || 1,
            created_at: new Date(form.date + 'T12:00:00').toISOString(),
          })
          .select()
          .single();
        if (prodErr) throw prodErr;
        productId = newProd.id;
      }

      // 2. Find or create store
      let storeId: string;
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .ilike('name', form.store.trim())
        .limit(1);

      if (existingStore && existingStore.length > 0) {
        storeId = existingStore[0].id;
      } else {
        const { data: newStore, error: storeErr } = await supabase
          .from('stores')
          .insert({
            name: form.store.trim(),
            location: form.branch.trim() || null,
          })
          .select()
          .single();
        if (storeErr) throw storeErr;
        storeId = newStore.id;
      }

      // 3. Upsert price record
      const { error: priceErr } = await supabase.from('prices').upsert({
        product_id: productId,
        store_id: storeId,
        price: parseFloat(form.price),
        date_recorded: form.date,
        user_id: user?.id || null,
      }, { onConflict: 'product_id,store_id' });
      if (priceErr) throw priceErr;

      // 4. Optionally add to shopping list
      if (addToList && user) {
        const { data: listExisting } = await supabase
          .from('shopping_list')
          .select('id')
          .eq('product_id', productId)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .limit(1);

        if (!listExisting || listExisting.length === 0) {
          await supabase.from('shopping_list').insert({
            product_id: productId,
            user_id: user.id,
            quantity: parseInt(form.units) || 1,
            status: 'pending',
          });
        }
      }
      if (user) {
        await addXp(user.id, 10);
      }

      setSuccess('¡Producto y precio guardados correctamente! (+10 XP para tu Axolotl)');
      setForm({
        productName: '', brand: '', category: '', units: '1', contentAmount: '',
        contentUnit: 'ml', date: today(), store: '', branch: '', price: '',
      });
      setAddToList(false);
      onSuccess?.();

    } catch (err: unknown) {
      // Handle Supabase PostgrestError and native Error
      let message = 'Error al guardar';
      if (err && typeof err === 'object') {
        if ('message' in err) message = String((err as { message: unknown }).message);
        if ('details' in err && (err as { details: unknown }).details) {
          message += ' — ' + String((err as { details: unknown }).details);
        }
        if ('hint' in err && (err as { hint: unknown }).hint) {
          message += ' (' + String((err as { hint: unknown }).hint) + ')';
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>

      {/* ── SECTION: Producto ── */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Producto</p>

        <div className={styles.field}>
          <label className={styles.label}>Nombre del producto *</label>
          <input
            type="text"
            value={form.productName}
            onChange={e => set('productName', e.target.value)}
            required
            placeholder="ej. Leche entera"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Marca</label>
          <input
            type="text"
            value={form.brand}
            onChange={e => set('brand', e.target.value)}
            placeholder="ej. Lala"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Categoría</label>
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className={styles.input}
          >
            <option value="">Seleccionar...</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Unidades</label>
            <input
              type="number"
              min="1"
              value={form.units}
              onChange={e => set('units', e.target.value)}
              className={styles.input}
              placeholder="1"
            />
          </div>
          <div className={styles.field} style={{ flex: 2 }}>
            <label className={styles.label}>Contenido por unidad</label>
            <div className={styles.unitGroup}>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.contentAmount}
                onChange={e => set('contentAmount', e.target.value)}
                className={styles.input}
                placeholder="355"
              />
              <select
                value={form.contentUnit}
                onChange={e => set('contentUnit', e.target.value)}
                className={`${styles.input} ${styles.unitSelect}`}
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Fecha de compra *</label>
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            required
            className={styles.input}
          />
        </div>
      </div>

      {/* ── SECTION: Tienda & Precio ── */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Tienda y Precio</p>

        <div className={styles.field}>
          <label className={styles.label}>Tienda *</label>
          <input
            type="text"
            value={form.store}
            onChange={e => set('store', e.target.value)}
            required
            placeholder="ej. Walmart"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Sucursal <span className={styles.optional}>(opcional)</span></label>
          <input
            type="text"
            value={form.branch}
            onChange={e => set('branch', e.target.value)}
            placeholder="ej. Centro"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Precio *</label>
          <div className={styles.priceWrapper}>
            <span className={styles.currencySymbol}>$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={e => set('price', e.target.value)}
              required
              placeholder="0.00"
              className={`${styles.input} ${styles.priceInput}`}
            />
          </div>
        </div>
      </div>

      {user && (
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={addToList}
            onChange={e => setAddToList(e.target.checked)}
            className={styles.checkbox}
          />
          <span>Agregar también a mi lista de compras</span>
        </label>
      )}

      {success && <div className={styles.successMsg}>{success}</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>
            Cancelar
          </button>
        )}
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
