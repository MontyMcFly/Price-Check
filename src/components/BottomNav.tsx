'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';

const navItems = [
  { label: 'Dashboard', path: '/', icon: 'dashboard' },
  { label: 'List', path: '/list', icon: 'receipt_long' },
  { label: 'Add', path: '/add', icon: 'add_circle' },
  { label: 'Catálogo', path: '/products', icon: 'local_mall' },
  { label: 'History', path: '/history', icon: 'history' },
];

export default function BottomNav() {
  const pathname = usePathname();

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
