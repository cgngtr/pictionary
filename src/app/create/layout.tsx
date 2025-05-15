import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create New Pin - Pictionary',
  description: 'Upload a new photo to share with the Pictionary community',
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
} 