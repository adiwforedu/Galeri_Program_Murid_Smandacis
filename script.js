// Kata sandi
const ADMIN_PASSWORD = 'admin';

// Data default
const defaultApps = [
    {
        id: 'app-1',
        name: 'Gapura Pancawaluya',
        url: 'https://example.com/gapura',
        icon: 'fa-solid fa-hands-holding-child',
        color: '#f59e0b'
    },
    {
        id: 'app-2',
        name: 'Nadi Hijau',
        url: 'https://example.com/nadihijau',
        icon: 'fa-solid fa-leaf',
        color: '#10b981'
    },
    {
        id: 'app-3',
        name: 'Inklusif',
        url: 'https://adiwforedu.github.io/PelitaSMANDACIS/',
        icon: 'fa-solid fa-users-rays',
        color: '#3b82f6'
    }
];

let apps = [];
let isAdmin = false;
let portalTheme = { primary: '#007aff', header: '#0f172a' };

// Elemen DOM
const appsContainer = document.getElementById('apps-container');
const btnAdminToggle = document.getElementById('btn-admin-toggle');
const clockDisplay = document.getElementById('clock-display');

// Modals & Viewer
const passwordModal = document.getElementById('password-modal');
const appFormModal = document.getElementById('app-form-modal');
const deleteModal = document.getElementById('delete-modal');
const portalView = document.getElementById('portal-view');
const viewerView = document.getElementById('viewer-view');
const appIframe = document.getElementById('app-iframe');
const viewerTitle = document.getElementById('viewer-title');
const themeToggle = document.getElementById('theme-toggle');

function init() {
    loadGlobalTheme();
    initTheme();
    startClock();
    loadApps();
    renderApps();
    setupEventListeners();
}

function loadGlobalTheme() {
    const stored = localStorage.getItem('school_portal_colors');
    if (stored) portalTheme = JSON.parse(stored);
    applyGlobalTheme();
}

function applyGlobalTheme() {
    document.documentElement.style.setProperty('--primary', portalTheme.primary);
    document.documentElement.style.setProperty('--header-bg', portalTheme.header);
}

function initTheme() {
    const savedTheme = localStorage.getItem('school_portal_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

function startClock() {
    const updateTime = () => {
        const now = new Date();
        const hrs = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');
        clockDisplay.textContent = `${hrs}:${mins}`;
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = now.toLocaleDateString('id-ID', options);
        document.getElementById('date-display').textContent = dateStr;
    };
    updateTime();
    setInterval(updateTime, 60000);
}

function loadApps() {
    const stored = localStorage.getItem('school_portal_apps');
    if (stored) {
        apps = JSON.parse(stored);
    } else {
        apps = [...defaultApps];
        saveApps();
    }
}

function saveApps() {
    localStorage.setItem('school_portal_apps', JSON.stringify(apps));
}

function renderApps() {
    appsContainer.innerHTML = '';
    
    apps.forEach(app => {
        const item = document.createElement('div');
        item.className = 'app-item';
        
        item.innerHTML = `
            <div class="app-icon" style="background-color: ${app.color || '#007aff'}">
                <i class="${app.icon || 'fa-solid fa-cube'}"></i>
                <button class="admin-badge badge-edit" onclick="editApp('${app.id}', event)"><i class="fa-solid fa-pen"></i></button>
                <button class="admin-badge badge-delete" onclick="confirmDelete('${app.id}', '${app.name}', event)"><i class="fa-solid fa-minus"></i></button>
            </div>
            <span class="app-label">${app.name}</span>
        `;

        item.addEventListener('click', (e) => {
            // Cegah klik ikon aplikasi jika mode admin, atau jika klik badge
            if (e.target.closest('.admin-badge')) return;
            if (isAdmin) {
                // Di iOS, klik aplikasi saat jiggle tidak membuka aplikasi, tapi membiarkan jiggle.
                // Bisa opsional buka form edit jika di-klik. Kita abaikan saja atau panggil edit.
                editApp(app.id, e);
                return;
            }
            openApp(app);
        });

        appsContainer.appendChild(item);
    });

    if (isAdmin) {
        const addItem = document.createElement('div');
        addItem.className = 'app-item add-btn';
        addItem.innerHTML = `
            <div class="app-icon">
                <i class="fa-solid fa-plus"></i>
            </div>
            <span class="app-label">Tambah</span>
        `;
        addItem.addEventListener('click', () => openAppForm());
        appsContainer.appendChild(addItem);
    }
}

function openApp(app) {
    // Tampilkan notifikasi "nuju dikembangkeun" jika link belum diubah (berisi # atau example.com)
    if (!app.url || app.url === '#' || app.url.includes('example.com')) {
        document.getElementById('construction-modal').classList.remove('hidden');
        return;
    }

    portalView.classList.add('hidden');
    viewerView.classList.remove('hidden');
    viewerTitle.textContent = app.name;
    document.getElementById('btn-open-external').href = app.url;
    appIframe.src = app.url;
}

function closeViewer() {
    viewerView.classList.add('hidden');
    portalView.classList.remove('hidden');
    appIframe.src = ''; 
}

function setupEventListeners() {
    btnAdminToggle.addEventListener('click', () => {
        if (isAdmin) {
            isAdmin = false;
            portalView.classList.remove('admin-mode');
            btnAdminToggle.innerHTML = `
                <div class="dock-icon bg-gray"><i class="fa-solid fa-gear"></i></div>
                <span>Admin</span>
            `;
            const settingsBtn = document.getElementById('btn-global-settings');
            if (settingsBtn) settingsBtn.remove();
            renderApps();
        } else {
            passwordModal.classList.remove('hidden');
            document.getElementById('admin-password').value = '';
            document.getElementById('auth-error').classList.add('hidden');
            document.getElementById('admin-password').focus();
        }
    });

    // Password
    document.getElementById('btn-cancel-auth').addEventListener('click', () => {
        passwordModal.classList.add('hidden');
    });
    document.getElementById('btn-submit-auth').addEventListener('click', authenticateAdmin);
    document.getElementById('admin-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') authenticateAdmin();
    });

    // Form
    document.getElementById('btn-cancel-form').addEventListener('click', () => {
        appFormModal.classList.add('hidden');
    });
    document.getElementById('btn-submit-form').addEventListener('click', saveAppForm);

    // Settings
    document.getElementById('btn-cancel-settings').addEventListener('click', () => {
        document.getElementById('settings-modal').classList.add('hidden');
    });
    document.getElementById('btn-submit-settings').addEventListener('click', saveSettingsForm);

    // Delete
    document.getElementById('btn-cancel-delete').addEventListener('click', () => {
        deleteModal.classList.add('hidden');
    });
    document.getElementById('btn-confirm-delete').addEventListener('click', deleteApp);

    // Viewer Back
    document.getElementById('btn-back').addEventListener('click', closeViewer);

    // Construction Close
    document.getElementById('btn-close-construction').addEventListener('click', () => {
        document.getElementById('construction-modal').classList.add('hidden');
    });

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('school_portal_theme', isDark ? 'dark' : 'light');
        themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    });
}

function authenticateAdmin() {
    const pwd = document.getElementById('admin-password').value;
    if (pwd === ADMIN_PASSWORD) {
        isAdmin = true;
        passwordModal.classList.add('hidden');
        portalView.classList.add('admin-mode');
        // Ubah tombol dock menjadi Selesai (Merah)
        btnAdminToggle.innerHTML = `
            <div class="dock-icon bg-red"><i class="fa-solid fa-check"></i></div>
            <span>Selesai</span>
        `;
        
        const dock = document.querySelector('.os-dock');
        if (!document.getElementById('btn-global-settings')) {
            const settingsBtn = document.createElement('button');
            settingsBtn.className = 'dock-app';
            settingsBtn.id = 'btn-global-settings';
            settingsBtn.innerHTML = `
                <div class="dock-icon" style="background-color: var(--primary)"><i class="fa-solid fa-palette"></i></div>
                <span>Warna Tema</span>
            `;
            settingsBtn.addEventListener('click', openSettingsModal);
            dock.appendChild(settingsBtn);
        }
        
        renderApps();
    } else {
        document.getElementById('auth-error').classList.remove('hidden');
    }
}

window.openAppForm = function(app = null) {
    appFormModal.classList.remove('hidden');
    if (app) {
        document.getElementById('form-modal-title').textContent = 'Edit Aplikasi';
        document.getElementById('form-id').value = app.id;
        document.getElementById('form-name').value = app.name;
        document.getElementById('form-url').value = app.url;
        document.getElementById('form-icon').value = app.icon;
        document.getElementById('form-color').value = app.color;
    } else {
        document.getElementById('form-modal-title').textContent = 'Tambah Aplikasi';
        document.getElementById('form-id').value = '';
        document.getElementById('form-name').value = '';
        document.getElementById('form-url').value = '';
        document.getElementById('form-icon').value = 'fa-solid fa-globe';
        document.getElementById('form-color').value = '#007aff';
    }
}

window.editApp = function(id, event) {
    event.stopPropagation();
    const app = apps.find(a => a.id === id);
    if (app) openAppForm(app);
}

function saveAppForm() {
    const id = document.getElementById('form-id').value;
    const newApp = {
        id: id || 'app-' + Date.now(),
        name: document.getElementById('form-name').value || 'Baru',
        url: document.getElementById('form-url').value || '#',
        icon: document.getElementById('form-icon').value || 'fa-solid fa-globe',
        color: document.getElementById('form-color').value || '#007aff'
    };

    if (id) {
        const idx = apps.findIndex(a => a.id === id);
        if (idx !== -1) apps[idx] = newApp;
    } else {
        apps.push(newApp);
    }

    saveApps();
    renderApps();
    appFormModal.classList.add('hidden');
}

window.confirmDelete = function(id, name, event) {
    event.stopPropagation();
    document.getElementById('delete-app-name').textContent = name;
    document.getElementById('delete-app-id').value = id;
    deleteModal.classList.remove('hidden');
}

function deleteApp() {
    const id = document.getElementById('delete-app-id').value;
    apps = apps.filter(a => a.id !== id);
    saveApps();
    renderApps();
    deleteModal.classList.add('hidden');
}

function openSettingsModal() {
    document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('setting-primary-color').value = portalTheme.primary;
    document.getElementById('setting-header-color').value = portalTheme.header;
}

function saveSettingsForm() {
    portalTheme.primary = document.getElementById('setting-primary-color').value;
    portalTheme.header = document.getElementById('setting-header-color').value;
    localStorage.setItem('school_portal_colors', JSON.stringify(portalTheme));
    applyGlobalTheme();
    
    // Update dock icon color immediately if it exists
    const settingsBtnIcon = document.querySelector('#btn-global-settings .dock-icon');
    if (settingsBtnIcon) settingsBtnIcon.style.backgroundColor = portalTheme.primary;
    
    document.getElementById('settings-modal').classList.add('hidden');
}

init();
