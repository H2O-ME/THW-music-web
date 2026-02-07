'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useFavoritesStore } from '@/store/useFavoritesStore'
import { supabase } from '@/lib/supabase'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    initGeetest4: any;
  }
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function LoginModal() {
  const { isLoginModalOpen, setLoginModalOpen, setUser } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const captchaInstance = useRef<any>(null)

  const bindCaptchaEvents = (instance: any) => {
    instance.onSuccess(async () => {
      const result = instance.getValidate();
      if (!result) {
        console.error('没有获取到验证结果');
        setError('验证码验证失败，请重试');
        setIsLoading(false);
        return;
      }

      try {
        const verifyRes = await fetch('/api/auth/verify-captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result),
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          setError(verifyData.message || '人机验证失败，请重试');
          instance.reset(); // 失败则重置验证码
          setIsLoading(false);
          return;
        }
        await performLogin();
      } catch (err) {
        console.error('验证过程出错:', err);
        setError('验证过程出错，请重试');
        instance.reset();
        setIsLoading(false);
      }
    });

    instance.onError((err: any) => {
      console.error('极验验证码错误:', err);
      setError('验证码加载异常，请刷新页面重试');
      setIsLoading(false);
    });

    instance.onClose(() => {
      setIsLoading(false);
    });
  };

  useEffect(() => {
    if (isLoginModalOpen && typeof window !== 'undefined') {
      const initCaptcha = () => {
        if (typeof window.initGeetest4 === 'function' && !captchaInstance.current) {
          window.initGeetest4({
            captchaId: 'e1ec2edf6ce881db23bcd9dff5d7bb1d',
            product: 'bind', // 使用绑定模式，点击按钮时触发
            language: 'zh-cn',
            riskType: 'slide', // 默认滑块验证
            timeout: 10000
          }, (instance: any) => {
            captchaInstance.current = instance;
            bindCaptchaEvents(instance);
          });
          return true;
        }
        return false;
      };

      if (!initCaptcha()) {
        const checkGeetest = setInterval(() => {
          if (initCaptcha()) {
            clearInterval(checkGeetest);
          }
        }, 500);
        return () => clearInterval(checkGeetest);
      }
    }
  }, [isLoginModalOpen]);

  if (!isLoginModalOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }

    setIsLoading(true)
    setError('')

    // 启动极验验证
    try {
      if (captchaInstance.current) {
        captchaInstance.current.showCaptcha();
      } else if (typeof window.initGeetest4 === 'function') {
        window.initGeetest4({
          captchaId: 'e1ec2edf6ce881db23bcd9dff5d7bb1d',
          product: 'bind',
          language: 'zh-cn',
          riskType: 'slide',
          timeout: 10000
        }, (instance: any) => {
          captchaInstance.current = instance;
          bindCaptchaEvents(instance);
          instance.showCaptcha();
        });
      } else {
        setError('验证码模块尚未加载完毕，请稍候再试')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('启动验证码失败:', error);
      setError('验证码启动失败，请刷新页面重试');
      setIsLoading(false);
    }
  }

  const performLogin = async () => {
    try {
      console.log('Attempting login for:', username)
      // Check if user exists
      const { data: user, error: searchError } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .maybeSingle()

      if (searchError) throw searchError

      if (user) {
        if (user.password === password) {
          setUser({ id: user.id, username: user.username })
          useFavoritesStore.getState().loadFavorites()
          setLoginModalOpen(false)
        } else {
          setError('密码错误')
        }
      } else {
        // Register new user
        const { data: newUser, error: createError } = await supabase
          .from('app_users')
          .insert([{ username, password }])
          .select()
          .maybeSingle()

        if (createError) throw createError
        
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
