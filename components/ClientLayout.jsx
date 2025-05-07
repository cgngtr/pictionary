'use client';

import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const ClientLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="md:ml-64 pt-16 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
};

export default ClientLayout;
