'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useFavoritesStore } from '@/store/useFavoritesStore'
import { supabase } from '@/lib/supabase'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function LoginModal() {
  const { isLoginModalOpen, setLoginModalOpen, setUser } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isLoginModalOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('Attempting login for:', username)
      // Check if user exists
      const { data: user, error: searchError } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .maybeSingle() // Use maybeSingle to avoid error code for missing user

      if (searchError) {
        console.error('Supabase search error:', searchError)
        throw searchError
      }

      if (user) {
        console.log('User found, checking password')
        if (user.password === password) {
          setUser({ id: user.id, username: user.username })
          useFavoritesStore.getState().loadFavorites()
          setLoginModalOpen(false)
        } else {
          setError('密码错误')
        }
      } else {
        console.log('User not found, registering new user')
        // Register new user
        const { data: newUser, error: createError } = await supabase
          .from('app_users')
          .insert([{ username, password }])
          .select()
          .maybeSingle()

        if (createError) {
          console.error('Supabase create error:', createError)
          throw createError
        }
        
        if (newUser) {
          setUser({ id: newUser.id, username: newUser.username })
          useFavoritesStore.getState().loadFavorites()
          setLoginModalOpen(false)
        } else {
          throw new Error('Failed to create user')
        }
      }
    } catch (err: any) {
      console.error('Login process error:', err)
      setError(err.message || '登录失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => setLoginModalOpen(false)}
      />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-4 shadow-lg shadow-blue-200">
              <i className="ri-music-fill"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">欢迎回来</h2>
            <p className="text-gray-500 text-sm mt-1">登录或创建新账号</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                placeholder="请输入密码"
              />
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? <i className="ri-loader-4-line animate-spin"></i> : '登录 / 注册'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
