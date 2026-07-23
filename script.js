// Konfigurasi Firebase Anda
// ⚠️ PASTIKAN MENGGANTI INI DENGAN CONFIG FIREBASE SEKOLAH ANDA ⚠️
const firebaseConfig = {
    // Contoh format: databaseURL: "https://project-nama-anda.firebaseio.com"
    databaseURL: "https://dummy-preview-only.firebaseio.com" 
};

// Inisialisasi Firebase
let database;
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
} catch (e) {
    console.error("Firebase Init Error:", e);
}

let apps = [];
let isAdmin = false;
let portalTheme = { primary: '#007aff', header: '#0f172a' };

// Elemen DOM
const appsContainer = document.getElementById('apps-container');
const btnAdminToggle = document.getElementById('btn-admin-toggle');
const clockDisplay = document.getElementById('clock-display');
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
    setupEventListeners();
    loadGlobalSettings();
    
    // Tampilkan animasi loading
    appsContainer.innerHTML = '<div style="color: var(--text-main); text-align: center; grid-column: 1/-1; margin-top: 3rem;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p class="mt-3" style="opacity:0.7">Menyambungkan ke database...</p></div>';
    
    setTimeout(loadApps, 500); // Simulasi delay halus
}

function loadApps() {
    if (!database || firebaseConfig.databaseURL.includes("dummy-preview-only")) {
        showFirebaseError();
        return;
    }
    
    const appsRef = database.ref('apps');
    appsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            apps = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            apps.sort((a, b) => a.id.localeCompare(b.id)); // Urutkan agar rapi
            renderApps();
        } else {
            // Jika kosong, masukkan data default otomatis
            const defaultApps = [
                { id: 'app-1', name: 'Pembentukan Karakter Gapura Panca Waluya', url: 'https://example.com/gapura', icon: 'fa-solid fa-hands-holding-child', color: '#f59e0b' },
                { id: 'app-2', name: 'Nadi Hijau', url: 'https://example.com/nadihijau', icon: 'fa-solid fa-leaf', color: '#10b981' },
                { id: 'app-3', name: 'Inklusif', url: 'https://example.com/inklusif', icon: 'fa-solid fa-users-rays', color: '#3b82f6' },
                { id: 'app-4', name: 'Perpustakaan', url: 'https://example.com/perpus', icon: 'fa-solid fa-book-open', color: '#8b5cf6' }
            ];
            defaultApps.forEach(app => database.ref('apps/' + app.id).set(app));
        }
    }, (error) => {
        console.error("Firebase error: ", error);
        showFirebaseError();
    });
}

function showFirebaseError() {
    apps = [
        { id: 'app-1', name: 'Pembentukan Karakter Gapura Panca Waluya', url: '#', icon: 'fa-solid fa-hands-holding-child', color: '#f59e0b' },
        { id: 'app-2', name: 'Nadi Hijau', url: '#', icon: 'fa-solid fa-leaf', color: '#10b981' },
        { id: 'app-3', name: 'Inklusif', url: '#', icon: 'fa-solid fa-users-rays', color: '#3b82f6' }
    ];
    
    appsContainer.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ef4444; padding: 1rem; border-radius: 12px; text-align: center; grid-column: 1/-1; margin-bottom: 1rem;">
            <b><i class="fa-solid fa-triangle-exclamation"></i> Menunggu Konfigurasi Firebase</b><br>
            <span style="font-size:0.85rem">Aplikasi saat ini menampilkan data sementara (preview). Untuk menyimpan secara dinamis, masukkan <b>databaseURL</b> Firebase Anda di file script.js</span>
        </div>
    `;
    renderApps(true);
}

function loadGlobalTheme() {
    const stored = localStorage.getItem('school_portal_colors');
    if (stored) portalTheme = JSON.parse(stored);
    applyGlobalTheme();
}

function loadGlobalSettings() {
    if (!database || firebaseConfig.databaseURL.includes("dummy-preview-only")) return;
    
    database.ref('settings/header').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            if (data.title) {
                const isEditing = document.getElementById('header-title-text').innerHTML.includes('fa-pen');
                document.getElementById('header-title-text').innerHTML = data.title + (isEditing ? ' <i class="fa-solid fa-pen" style="font-size: 0.8rem; margin-left: 0.5rem; color: rgba(255,255,255,0.7);"></i>' : '');
            }
            if (data.desc) document.getElementById('header-desc-text').textContent = data.desc;
        }
    });

    database.ref('settings/footer').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.text) {
            const footer = document.getElementById('footer-text');
            if(footer) footer.innerHTML = data.text;
        }
    });
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
        document.getElementById('date-display').textContent = now.toLocaleDateString('id-ID', options);
    };
    updateTime();
    setInterval(updateTime, 60000);
}

function renderApps(append = false) {
    if (!append) appsContainer.innerHTML = '';
    
    apps.forEach(app => {
        const item = document.createElement('div');
        item.className = 'app-item';
        
        item.innerHTML = `
                <div class="app-glass">
                    ${isAdmin ? `
                        <div class="admin-badge badge-edit" onclick="editApp('${app.id}'); event.preventDefault();"><i class="fa-solid fa-pen"></i></div>
                        <div class="admin-badge badge-delete" onclick="deleteApp('${app.id}'); event.preventDefault();"><i class="fa-solid fa-trash"></i></div>
                    ` : ''}
                    <div class="app-icon" style="background-color: ${app.color || '#3b82f6'}">
                        <i class="${app.icon || 'fa-solid fa-globe'}"></i>
                    </div>
                </div>
                <p class="app-label">${app.name}</p>
            `;
        
        item.addEventListener('click', (e) => {
            if (e.target.closest('.admin-badge')) return; // Abaikan jika klik tombol edit
            
            if (isAdmin) {
                editApp(app.id, e);
                return;
            }
            openApp(app);
        });
        
        appsContainer.appendChild(item);
    });

    if (isAdmin) {
        const addBtn = document.createElement('div');
        addBtn.className = 'app-item';
        addBtn.innerHTML = `
            <div class="app-glass" style="border: 2px dashed var(--border-color); background: transparent; box-shadow: none;">
                <div class="app-icon" style="background-color: var(--primary);"><i class="fa-solid fa-plus"></i></div>
            </div>
            <p class="app-label">Tambah Aplikasi</p>
        `;
        addBtn.addEventListener('click', () => editApp(null));
        appsContainer.appendChild(addBtn);
    }
}

function openApp(app) {
    if (!app.url || app.url === '#' || app.url.includes('example.com') || app.url.includes('dummy')) {
        document.getElementById('construction-modal').classList.remove('hidden');
        return;
    }
    
    appIframe.src = app.url;
    viewerTitle.textContent = app.name;
    portalView.classList.remove('active');
    viewerView.classList.add('active');
    document.getElementById('iframe-fallback').classList.add('hidden');
    
    appIframe.onerror = function() {
        document.getElementById('fallback-link').href = app.url;
        document.getElementById('iframe-fallback').classList.remove('hidden');
    };
}

function editApp(id, event) {
    if (event) event.stopPropagation();
    
    const app = id ? apps.find(a => a.id === id) : null;
    document.getElementById('form-id').value = app ? app.id : '';
    document.getElementById('form-name').value = app ? app.name : '';
    document.getElementById('form-url').value = app ? (app.url === '#' ? '' : app.url) : '';
    document.getElementById('form-icon').value = app ? app.icon : 'fa-solid fa-globe';
    document.getElementById('form-color').value = app ? app.color : '#007aff';
    
    document.getElementById('btn-delete-app').classList.toggle('hidden', !app);
    appFormModal.classList.remove('hidden');
}

function saveAppForm() {
    const id = document.getElementById('form-id').value;
    const newApp = {
        name: document.getElementById('form-name').value || 'Baru',
        url: document.getElementById('form-url').value || '#',
        icon: document.getElementById('form-icon').value || 'fa-solid fa-globe',
        color: document.getElementById('form-color').value || '#007aff'
    };
    
    if (!database || firebaseConfig.databaseURL.includes("dummy-preview-only")) {
        // Fallback untuk mode preview
        if (id) {
            const idx = apps.findIndex(a => a.id === id);
            if (idx !== -1) {
                newApp.id = id;
                apps[idx] = newApp;
            }
        } else {
            newApp.id = 'app-' + Date.now();
            apps.push(newApp);
        }
        appFormModal.classList.add('hidden');
        renderApps();
        return;
    }

    if (id) {
        newApp.id = id;
        database.ref('apps/' + id).set(newApp);
    } else {
        const newRef = database.ref('apps').push();
        newApp.id = newRef.key;
        database.ref('apps/' + newRef.key).set(newApp);
    }
    
    appFormModal.classList.add('hidden');
}

function authenticateAdmin() {
    const pwd = document.getElementById('admin-password').value;
    const ADMIN_EMAIL = 'admin@sekolah.com'; // Email default untuk Firebase Auth
    
    if (!database || firebaseConfig.databaseURL.includes("dummy-preview-only")) {
        // Fallback untuk preview tanpa Firebase Auth
        if (pwd === "admin123") {
            enableAdminMode();
        } else {
            showAuthError();
        }
        return;
    }
    
    // Auth sungguhan via Firebase
    firebase.auth().signInWithEmailAndPassword(ADMIN_EMAIL, pwd)
        .then(() => enableAdminMode())
        .catch((error) => {
            console.error(error);
            showAuthError();
        });
}

function showAuthError() {
    document.getElementById('auth-error').classList.remove('hidden');
    setTimeout(() => document.getElementById('auth-error').classList.add('hidden'), 3000);
}

function enableAdminMode() {
    isAdmin = true;
    passwordModal.classList.add('hidden');
    portalView.classList.add('admin-mode');
    
    btnAdminToggle.innerHTML = `<i class="fa-solid fa-check"></i>`;
    btnAdminToggle.classList.add('admin-btn-active');
    
    // Tampilkan tooltip ke header
    const headerTitle = document.getElementById('header-title-text');
    if (!headerTitle.innerHTML.includes('fa-pen')) {
        headerTitle.innerHTML += ' <i class="fa-solid fa-pen" style="font-size: 0.8rem; margin-left: 0.5rem; color: rgba(255,255,255,0.7);"></i>';
    }
    
    renderApps(); 
}

function setupEventListeners() {
    // Viewer Back
    document.getElementById('btn-back').addEventListener('click', () => {
        viewerView.classList.remove('active');
        portalView.classList.add('active');
        appIframe.src = 'about:blank';
    });

    // Admin Toggle
    btnAdminToggle.addEventListener('click', () => {
        if (isAdmin) {
            // Langsung Logout jika klik Ceklis
            isAdmin = false;
            try {
                if (window.firebase && firebase.auth && !firebaseConfig.databaseURL.includes("dummy-preview-only")) {
                    firebase.auth().signOut();
                }
            } catch(e) { console.error("SignOut error", e); }
            portalView.classList.remove('admin-mode');
            
            btnAdminToggle.innerHTML = `<i class="fa-solid fa-gear"></i>`;
            btnAdminToggle.classList.remove('admin-btn-active');
            
            // Hapus ikon pensil dari header
            const headerTitle = document.getElementById('header-title-text');
            headerTitle.innerHTML = headerTitle.innerHTML.replace(/ <i class="fa-solid fa-pen".*<\/i>/, '');
            
            renderApps();
        } else {
            passwordModal.classList.remove('hidden');
            document.getElementById('admin-password').value = '';
            setTimeout(() => document.getElementById('admin-password').focus(), 100);
        }
    });

    // Edit Header & Tema (Klik Header saat Admin Mode)
    document.querySelector('.header-content').addEventListener('click', () => {
        if (isAdmin) {
            // Buka Master Settings Modal
            let cleanTitle = document.getElementById('header-title-text').innerHTML.replace(/ <i class="fa-solid fa-pen".*<\/i>/, '');
            document.getElementById('master-header-title').value = cleanTitle;
            document.getElementById('master-header-desc').value = document.getElementById('header-desc-text').textContent;
            
            const footerEl = document.getElementById('footer-text');
            document.getElementById('master-footer-text').value = footerEl ? footerEl.innerHTML : '';
            
            document.getElementById('master-primary-color').value = portalTheme.primary || '#3b82f6';
            document.getElementById('master-header-color').value = portalTheme.header || '#1e293b';
            
            document.getElementById('master-settings-modal').classList.remove('hidden');
        }
    });

    // Password Modal
    document.getElementById('btn-cancel-auth').addEventListener('click', () => {
        passwordModal.classList.add('hidden');
    });
    document.getElementById('btn-submit-auth').addEventListener('click', authenticateAdmin);
    document.getElementById('admin-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') authenticateAdmin();
    });

    // Master Settings Modal
    document.getElementById('btn-cancel-master').addEventListener('click', () => {
        document.getElementById('master-settings-modal').classList.add('hidden');
    });

    document.getElementById('btn-submit-master').addEventListener('click', () => {
        const title = document.getElementById('master-header-title').value || 'Galeri Program Siswa';
        const desc = document.getElementById('master-header-desc').value || 'Kumpulan akses cepat...';
        const footerText = document.getElementById('master-footer-text').value || '&copy; 2026 Smandacis';
        
        // Save Theme
        portalTheme.primary = document.getElementById('master-primary-color').value;
        portalTheme.header = document.getElementById('master-header-color').value;
        localStorage.setItem('school_portal_colors', JSON.stringify(portalTheme));
        applyGlobalTheme();
        
        // Save Header & Footer (Dummy mode)
        if (!database || firebaseConfig.databaseURL.includes("dummy-preview-only")) {
            document.getElementById('header-title-text').innerHTML = title + ' <i class="fa-solid fa-pen" style="font-size: 0.8rem; margin-left: 0.5rem; color: rgba(255,255,255,0.7);"></i>';
            document.getElementById('header-desc-text').textContent = desc;
            const footerEl = document.getElementById('footer-text');
            if (footerEl) footerEl.innerHTML = footerText;
            
            document.getElementById('master-settings-modal').classList.add('hidden');
            return;
        }
        
        // Save to Firebase
        Promise.all([
            database.ref('settings/header').set({ title, desc }),
            database.ref('settings/footer').set({ text: footerText })
        ]).then(() => {
            document.getElementById('header-title-text').innerHTML = title + ' <i class="fa-solid fa-pen" style="font-size: 0.8rem; margin-left: 0.5rem; color: rgba(255,255,255,0.7);"></i>';
            document.getElementById('master-settings-modal').classList.add('hidden');
        }).catch(e => alert("Gagal menyimpan pengaturan: " + e.message));
    });

    document.getElementById('btn-logout-admin').addEventListener('click', () => {
        document.getElementById('master-settings-modal').classList.add('hidden');
        document.getElementById('btn-admin-toggle').click(); // Trigger fungsi logout di atas
    });

    // Form Modal Apps
    document.getElementById('btn-cancel-form').addEventListener('click', () => {
        appFormModal.classList.add('hidden');
    });
    document.getElementById('btn-submit-form').addEventListener('click', saveAppForm);
    document.getElementById('btn-delete-app').addEventListener('click', () => {
        appFormModal.classList.add('hidden');
        document.getElementById('delete-app-id').value = document.getElementById('form-id').value;
        deleteModal.classList.remove('hidden');
    });

    // Delete Modal
    document.getElementById('btn-cancel-delete').addEventListener('click', () => {
        deleteModal.classList.add('hidden');
    });
    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        const id = document.getElementById('delete-app-id').value;
        if (!database || firebaseConfig.databaseURL.includes("dummy-preview-only")) {
            apps = apps.filter(a => a.id !== id);
            renderApps();
        } else {
            database.ref('apps/' + id).remove();
        }
        deleteModal.classList.add('hidden');
    });


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

init();
