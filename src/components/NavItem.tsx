import { ReactNode } from 'react';

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  isCollapsed?: boolean;
}

const NavItem = ({ href, icon, label, isCollapsed = false }: NavItemProps) => {
  return (
    <li>
      <a
        href={href}
        className="flex items-center px-3 py-2 text-white rounded-xl hover:bg-gray-800/60 hover:text-red-400 group justify-start relative overflow-hidden"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-r-full"></div>
        <div className="z-10 flex items-center justify-center bg-[#121212] rounded-lg p-2 mr-3 group-hover:bg-[#1a1a1a] transition-all duration-300">
          {icon}
        </div>
        <span className={`font-bold transition-all duration-300 ${isCollapsed ? 'opacity-0 translate-x-10 hidden' : 'opacity-100 translate-x-0'}`}>
          {label}
        </span>
      </a>
    </li>
  );
};

export default NavItem; 