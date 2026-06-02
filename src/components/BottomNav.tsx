'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';
import { useT } from '@/lib/i18n';

export default function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  const navItems = [
    { label: t.nav_dashboard, path: '/', icon: 'dashboard' },
    { label: t.nav_list, path: '/list', icon: 'receipt_long' },
    { label: t.nav_add, path: '/add', icon: 'add_circle' },
    { label: t.nav_catalog, path: '/products', icon: 'local_mall' },
    { label: t.nav_history, path: '/history', icon: 'history' },
  ];

  return (
    <nav className={styles.bottomNav}>
      <div className={styles.navContainer}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link href={item.path} key={item.path} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
              <span className={`material-symbols-outlined ${styles.icon}`}>
                {item.icon}
              </span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
