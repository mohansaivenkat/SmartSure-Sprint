import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useEffect } from 'react';
import { useAppSelector } from '../shared/hooks/reduxHooks';
import { selectDarkMode } from '../store/themeSlice';
import { selectCurrentUser } from '../features/auth/store/authSlice';

export default function MainLayout() {
  const darkMode = useAppSelector(selectDarkMode);
  const user = useAppSelector(selectCurrentUser);
  
  // Apply theme class to document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-1 ${user ? 'pb-28 md:pb-0' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
