import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Client Component'lerde kullanılacak istemciyi oluşturur
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Middleware için istemci oluşturur (özellikle session okumak için)
// Cookie set/remove işlemleri middleware içinde response üzerinden yapılır.
export function createMiddlewareSupabaseClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // Middleware'de cookie set/remove için aşağıdaki gibi response kullanılır:
        // response.cookies.set({ name, value, ...options })
        // response.cookies.set({ name, value: '', ...options })
        set(name: string, value: string, options: CookieOptions) {
            console.warn("Middleware client set cookie called - should use response object")
        },
        remove(name: string, options: CookieOptions) {
            console.warn("Middleware client remove cookie called - should use response object")
        },
      },
    }
  )
} 