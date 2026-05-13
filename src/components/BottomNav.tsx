'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';

const navItems = [
  { label: 'Home', icon: 'dashboard', path: '/' },
  { label: 'List', icon: 'shopping_basket', path: '/list' },
  { label: 'Add', icon: 'add_circle', path: '/add' },
  { label: 'Route', icon: 'map', path: '/route' },
  { label: 'History', icon: 'history', path: '/history' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
