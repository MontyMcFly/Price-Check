'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { addReward } from '@/lib/gamification';
import styles from './ProductPriceForm.module.css';
import { useT } from '@/lib/i18n';

const UNITS = ['ml', 'l', 'g', 'kg', 'oz', 'lb', 'piezas'];

const today = () => new Date().toISOString().split('T')[0];

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductPriceForm({ onSuccess, onCancel }: Props) {
  const { user, refreshProfile } = useAuth();
  const t = useT();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [addToList, setAddToList] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

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

    if (!receiptFile) {
      setError(t.receipt_required);
      setLoading(false);
      return;
    }

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

      // 2.5 Upload receipt
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user?.id || 'anon'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, receiptFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      // 3. Upsert price record
      const { error: priceErr } = await supabase.from('prices').upsert({
        product_id: productId,
        store_id: storeId,
        price: parseFloat(form.price),
        date_recorded: form.date,
        user_id: user?.id || null,
        receipt_url: publicUrl,
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
        await addReward(user.id, 10, 5);
        await refreshProfile();
      }

      setSuccess(t.form_success);
      setForm({
        productName: '', brand: '', category: '', units: '1', contentAmount: '',
        contentUnit: 'ml', date: today(), store: '', branch: '', price: '',
      });
      setAddToList(false);
      setReceiptFile(null);
      setReceiptPreview(null);
      onSuccess?.();

    } catch (err: unknown) {
      let message: string = t.form_error;
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
        <p className={styles.sectionLabel}>{t.form_product_section}</p>

        <div className={styles.field}>
          <label className={styles.label}>{t.form_product_name}</label>
          <input type="text" value={form.productName} onChange={e => set('productName', e.target.value)} required placeholder={t.form_product_placeholder} className={styles.input} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t.form_brand}</label>
          <input type="text" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder={t.form_brand_placeholder} className={styles.input} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t.form_category}</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className={styles.input}>
            <option value="">{t.form_category_select}</option>
            {t.categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>{t.form_units}</label>
            <input type="number" min="1" value={form.units} onChange={e => set('units', e.target.value)} className={styles.input} placeholder="1" />
          </div>
          <div className={styles.field} style={{ flex: 2 }}>
            <label className={styles.label}>{t.form_content}</label>
            <div className={styles.unitGroup}>
              <input type="number" min="0" step="0.1" value={form.contentAmount} onChange={e => set('contentAmount', e.target.value)} className={styles.input} placeholder="355" />
              <select value={form.contentUnit} onChange={e => set('contentUnit', e.target.value)} className={`${styles.input} ${styles.unitSelect}`}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t.form_date}</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required className={styles.input} />
        </div>
      </div>

      {/* ── SECTION: Tienda & Precio ── */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>{t.form_store_section}</p>

        <div className={styles.field}>
          <label className={styles.label}>{t.form_store}</label>
          <input type="text" value={form.store} onChange={e => set('store', e.target.value)} required placeholder={t.form_store_placeholder} className={styles.input} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t.form_branch} <span className={styles.optional}>{t.form_branch_optional}</span></label>
          <input type="text" value={form.branch} onChange={e => set('branch', e.target.value)} placeholder={t.form_branch_placeholder} className={styles.input} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t.form_price}</label>
          <div className={styles.priceWrapper}>
            <span className={styles.currencySymbol}>$</span>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required placeholder="0.00" className={`${styles.input} ${styles.priceInput}`} />
          </div>
        </div>
        </div>
      </div>

      {/* ── SECTION: Ticket ── */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>{t.receipt_label}</p>
        <p className="body-sm" style={{ color: 'var(--color-secondary)', marginBottom: '8px' }}>
          {t.receipt_hint}
        </p>

        {receiptPreview ? (
          <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={receiptPreview} alt="Receipt preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              type="button"
              onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
              style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>
        ) : (
          <label className={styles.field} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', border: '2px dashed var(--color-outline-variant)', borderRadius: '8px', background: 'var(--color-surface-container-lowest)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-primary)', marginBottom: '8px' }}>add_a_photo</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{t.receipt_label}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setReceiptFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => setReceiptPreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        )}
      </div>

      {user && (
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={addToList} onChange={e => setAddToList(e.target.checked)} className={styles.checkbox} />
          <span>{t.form_add_to_list}</span>
        </label>
      )}

      {success && <div className={styles.successMsg}>{success}</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>
            {t.form_cancel}
          </button>
        )}
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? t.receipt_uploading : t.form_save}
        </button>
      </div>
    </form>
  );
}
