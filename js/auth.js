import { supabase } from './supabase.js';
import { Toast } from './utils.js';

export class AuthManager {
    static currentUser = null;

    static init() {
        this.modal = document.getElementById('login-modal');
        this.panel = document.getElementById('login-panel');
        this.form = document.getElementById('login-form');
        this.usernameInput = document.getElementById('login-username');
        this.passwordInput = document.getElementById('login-password');
        
        this.profileSection = document.getElementById('user-profile');
        this.avatarEl = document.getElementById('user-avatar');
        this.nameEl = document.getElementById('user-name');
        this.btnLogout = document.getElementById('btn-logout');

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        if (this.btnLogout) {
            this.btnLogout.addEventListener('click', () => this.logout());
        }

        this.checkSession();
    }

    static async checkSession() {
        const savedUser = localStorage.getItem('twilight_music_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                this.currentUser = user; // Set current user
                this.updateUI(true);
                // Dispatch login event so other modules can load data
                document.dispatchEvent(new CustomEvent('auth:login', { detail: this.currentUser }));
            } catch (e) {
                localStorage.removeItem('twilight_music_user');
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
    }

    static showLogin() {
        this.modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            this.modal.classList.remove('opacity-0');
            this.panel.classList.remove('scale-95');
            this.panel.classList.add('scale-100');
        });
    }

    static hideLogin() {
        this.modal.classList.add('opacity-0');
        this.panel.classList.remove('scale-100');
        this.panel.classList.add('scale-95');
        setTimeout(() => {
            this.modal.classList.add('hidden');
        }, 300);
    }

    static async handleLogin() {
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();

        if (!username || !password) {
            Toast.show('请输入用户名和密码', 'error');
            return;
        }

        try {
            // Check if user exists
            const { data: users, error: searchError } = await supabase
                .from('app_users')
                .select('*')
                .eq('username', username)
                .single();

            if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is "not found"
                throw searchError;
            }

            if (users) {
                // User exists, check password
                if (users.password === password) {
                    this.loginSuccess(users);
                } else {
                    Toast.show('密码错误', 'error');
                }
            } else {
                // Register new user
                const { data: newUser, error: createError } = await supabase
                    .from('app_users')
                    .insert([{ username, password }])
                    .select()
                    .single();

                if (createError) throw createError;
                
                Toast.show('注册成功', 'success');
                this.loginSuccess(newUser);
            }
        } catch (error) {
            console.error('Login error:', error);
            Toast.show('登录失败: ' + error.message, 'error');
        }
    }

    static loginSuccess(user) {
        this.currentUser = user;
        localStorage.setItem('twilight_music_user', JSON.stringify(user));
        this.updateUI(true);
        this.hideLogin();
        Toast.show(`欢迎回来, ${user.username}`, 'success');
        
        // Trigger event for other modules
        document.dispatchEvent(new CustomEvent('auth:login', { detail: user }));
    }

    static updateUI(isLoggedIn) {
        if (isLoggedIn && this.currentUser) {
            if (this.profileSection) this.profileSection.classList.remove('hidden');
            if (this.nameEl) this.nameEl.textContent = this.currentUser.username;
            if (this.avatarEl) this.avatarEl.textContent = this.currentUser.username.charAt(0).toUpperCase();
            if (this.btnLogout) this.btnLogout.classList.remove('hidden');
        } else {
            if (this.profileSection) this.profileSection.classList.add('hidden');
            if (this.btnLogout) this.btnLogout.classList.add('hidden');
        }
    }

    static logout() {
        this.currentUser = null;
        localStorage.removeItem('twilight_music_user');
        this.updateUI(false);
        Toast.show('已退出登录', 'success');
        
        // Close settings modal if open
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal && !settingsModal.classList.contains('hidden')) {
            document.getElementById('btn-close-settings')?.click();
        }

        // Dispatch logout event
        document.dispatchEvent(new CustomEvent('auth:logout'));

        // Show login
        this.showLogin();
    }

    static getCurrentUser() {
        return this.currentUser;
    }
}
