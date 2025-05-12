import React, { ReactNode } from 'react';
import { HomeIcon, SearchIcon, PlusIcon, ProfileIcon } from '../components/Icons';

interface NavigationItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export const navigationItems: NavigationItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: <HomeIcon className="w-5 h-5 text-gray-300 group-hover:text-red-500 transition-colors duration-300" />,
  },
  {
    href: '/explore',
    label: 'Explore',
    icon: <SearchIcon className="w-5 h-5 text-gray-300 group-hover:text-red-500 transition-colors duration-300" />,
  },
  {
    href: '/create',
    label: 'Create Pin',
    icon: <PlusIcon className="w-5 h-5 text-gray-300 group-hover:text-red-500 transition-colors duration-300" />,
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: <ProfileIcon className="w-5 h-5 text-gray-300 group-hover:text-red-500 transition-colors duration-300" />,
  },
]; 