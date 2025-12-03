export class Toast {
    static show(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `
            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg 
            bg-white/90 backdrop-blur-md border border-gray-200 
            transform transition-all duration-300 translate-y-10 opacity-0
            min-w-[200px] max-w-sm
        `;
        
        let icon = 'ri-information-line';
        let color = 'text-blue-600';
        
        if (type === 'error') {
            icon = 'ri-error-warning-line';
            color = 'text-red-600';
        } else if (type === 'success') {
            icon = 'ri-checkbox-circle-line';
            color = 'text-green-600';
        }

        toast.innerHTML = `
            <i class="${icon} ${color} text-xl"></i>
            <span class="text-sm font-medium text-gray-800">${message}</span>
        `;

        container.appendChild(toast);

        // Animate In
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
        });

        // Remove after 3s
        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
}

export function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
