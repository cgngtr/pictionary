'use client';

import { useState, useEffect } from 'react';
import HomeClient from '@/components/HomeClient';
import { createClient } from '@/lib/supabase/utils';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        console.log("Home page initial session check:", !!session, session?.user?.email);
        if (!session) {
          console.log("Home page: No initial session, redirecting via middleware...");
          router.refresh();
        }
      } catch (error) {
        console.error("Error checking initial session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change on home page:", event);
      setUser(session?.user || null);
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Not Authenticated</h1>
        <p className="text-gray-600 mb-4">Redirecting to login...</p>
      </div>
    );
  }

  return <HomeClient />;
}
