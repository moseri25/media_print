/**
 * מדיה פרינט - קוד JavaScript לממשק ניהול
 */

// ========== ניהול ממשק המשתמש ==========

/**
 * טוען את ממשק המשתמש ומאתחל את כל האירועים הנדרשים
 */
function initUI() {
    // בדיקת מצב התחברות
    checkLoginStatus();
    
    // אתחול אירועי ממשק
    initSidebar();
    initLogout();
    initTooltips();
    initDropdowns();
    
    // אתחול אנימציות
    initAnimations();
}

/**
 * אתחול סרגל צד
 */
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const adminSidebar = document.getElementById('adminSidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    
    if (sidebarToggle && adminSidebar && sidebarBackdrop) {
        // פתיחה וסגירה של סרגל הצד במובייל
        sidebarToggle.addEventListener('click', function() {
            adminSidebar.classList.toggle('show');
            sidebarBackdrop.classList.toggle('show');
        });
        
        // סגירת סרגל הצד בלחיצה על הרקע
        sidebarBackdrop.addEventListener('click', function() {
            adminSidebar.classList.remove('show');
            sidebarBackdrop.classList.remove('show');
        });
        
        // התאמה לשינויי גודל מסך
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 992) {
                adminSidebar.classList.remove('show');
                sidebarBackdrop.classList.remove('show');
            }
        });
    }
    
    // סימון הדף הנוכחי בתפריט
    highlightCurrentPage();
}

/**
 * מדגיש את הדף הנוכחי בתפריט הניווט
 */
function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.admin-sidebar .nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkPage = link.getAttribute('href');
        
        if (linkPage === currentPage || 
            (currentPage === '' && linkPage === 'index.html') || 
            (currentPage === 'index.html' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });
}

/**
 * אתחול פונקציית התנתקות
 */
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // מחיקת נתוני התחברות
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminUsername');
            sessionStorage.removeItem('adminLoggedIn');
            sessionStorage.removeItem('adminUsername');
            
            // הצגת הודעת התנתקות והפניה לדף הכניסה
            showToast('התנתקת בהצלחה', 'success');
            
            setTimeout(function() {
                window.location.href = 'login.html';
            }, 1000);
        });
    }
}

/**
 * בדיקת מצב התחברות
 */
function checkLoginStatus() {
    // בדיקה אם המשתמש מחובר
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true' || 
                      sessionStorage.getItem('adminLoggedIn') === 'true';
    
    // אם לא בדף הכניסה ולא מחובר, מפנה לדף הכניסה
    const isLoginPage = window.location.pathname.includes('login.html');
    
    if (!isLoggedIn && !isLoginPage) {
        window.location.href = 'login.html';
        return false;
    }
    
    // אם בדף הכניסה וכבר מחובר, מפנה ללוח הבקרה
    if (isLoggedIn && isLoginPage) {
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

/**
 * אתחול tooltips
 */
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * אתחול dropdowns
 */
function initDropdowns() {
    const dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
    dropdownElementList.map(function(dropdownToggleEl) {
        return new bootstrap.Dropdown(dropdownToggleEl);
    });
}

/**
 * אתחול אנימציות
 */
function initAnimations() {
    // אנימציית fade-in לאלמנטים
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((element, index) => {
        element.style.animationDelay = `${0.1 + (index * 0.1)}s`;
    });
}

// ========== הודעות והתראות ==========

/**
 * הצגת הודעת toast
 * @param {string} message - תוכן ההודעה
 * @param {string} type - סוג ההודעה (success, danger, warning, info)
 * @param {number} duration - משך הזמן להצגה (במילישניות)
 */
function showToast(message, type = 'info', duration = 3000) {
    // בדיקה אם קיים מיכל להודעות
    let toastContainer = document.querySelector('.admin-toast-container');
    
    // אם לא קיים, יוצר אחד חדש
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'admin-toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // יצירת הודעה חדשה
    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast-${type}`;
    
    // תוכן ההודעה
    toast.innerHTML = `
        <div class="admin-toast-header">
            <strong>${type === 'success' ? 'הצלחה' : 
                     type === 'danger' ? 'שגיאה' : 
                     type === 'warning' ? 'אזהרה' : 'הודעה'}</strong>
            <button type="button" class="btn-close btn-close-white" aria-label="Close"></button>
        </div>
        <div class="admin-toast-body">
            ${message}
        </div>
    `;
    
    // הוספת ההודעה למיכל
    toastContainer.appendChild(toast);
    
    // כפתור סגירה
    const closeBtn = toast.querySelector('.btn-close');
    closeBtn.addEventListener('click', function() {
        toast.style.transform = 'translateX(-100%)';
        toast.style.opacity = '0';
        
        setTimeout(function() {
            toast.remove();
        }, 300);
    });
    
    // סגירה אוטומטית לאחר זמן מוגדר
    setTimeout(function() {
        toast.style.transform = 'translateX(-100%)';
        toast.style.opacity = '0';
        
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, duration);
}

/**
 * הצגת התראה בתוך דף
 * @param {string} message - תוכן ההודעה
 * @param {string} type - סוג ההודעה (success, danger, warning, info)
 * @param {string} containerId - מזהה המיכל להוספת ההתראה
 */
function showAlert(message, type = 'info', containerId = null) {
    // מחיקת התראות קיימות
    const existingAlerts = document.querySelectorAll('.admin-alert');
    existingAlerts.forEach(alert => {
        alert.remove();
    });
    
    // יצירת התראה חדשה
    const alertDiv = document.createElement('div');
    alertDiv.className = `admin-alert admin-alert-${type} fade-in`;
    
    // תוכן ההתראה
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'danger' ? 'exclamation-circle' : 
                         type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <div>${message}</div>
    `;
    
    // הוספת ההתראה למיכל
    if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.prepend(alertDiv);
        }
    } else {
        // אם לא צוין מיכל, מוסיף בתחילת התוכן הראשי
        const mainContent = document.querySelector('.admin-content .container-fluid');
        if (mainContent) {
            mainContent.prepend(alertDiv);
        }
    }
    
    // סגירה אוטומטית להתראות הצלחה ומידע
    if (type === 'success' || type === 'info') {
        setTimeout(function() {
            alertDiv.style.opacity = '0';
            setTimeout(function() {
                alertDiv.remove();
            }, 300);
        }, 5000);
    }
}

// ========== טיפול בטפסים ==========

/**
 * אימות נתוני טופס
 * @param {HTMLFormElement} form - אלמנט הטופס לאימות
 * @returns {boolean} - האם הטופס תקין
 */
function validateForm(form) {
    let isValid = true;
    
    // איסוף כל השדות הנדרשים
    const requiredFields = form.querySelectorAll('[required]');
    
    // בדיקת כל שדה
    requiredFields.forEach(field => {
        // מחיקת הודעות שגיאה קודמות
        removeValidationError(field);
        
        // בדיקה אם השדה ריק
        if (!field.value.trim()) {
            showValidationError(field, 'שדה זה הוא שדה חובה');
            isValid = false;
        }
        // בדיקת אימייל
        else if (field.type === 'email' && !validateEmail(field.value)) {
            showValidationError(field, 'אנא הזן כתובת אימייל תקינה');
            isValid = false;
        }
        // בדיקת מספר טלפון
        else if (field.classList.contains('phone-input') && !validatePhone(field.value)) {
            showValidationError(field, 'אנא הזן מספר טלפון תקין');
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * הצגת הודעת שגיאה לשדה
 * @param {HTMLElement} field - השדה להצגת השגיאה
 * @param {string} message - הודעת השגיאה
 */
function showValidationError(field, message) {
    // הוספת קלאס שגיאה לשדה
    field.classList.add('is-invalid');
    
    // יצירת אלמנט הודעת שגיאה
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    // הוספת הודעת השגיאה אחרי השדה
    field.parentNode.appendChild(errorDiv);
}

/**
 * מחיקת הודעת שגיאה משדה
 * @param {HTMLElement} field - השדה למחיקת השגיאה
 */
function removeValidationError(field) {
    // הסרת קלאס שגיאה
    field.classList.remove('is-invalid');
    
    // מחיקת הודעת שגיאה אם קיימת
    const errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) {
        errorDiv.remove();
    }
}

/**
 * אימות כתובת אימייל
 * @param {string} email - כתובת האימייל לבדיקה
 * @returns {boolean} - האם האימייל תקין
 */
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * אימות מספר טלפון ישראלי
 * @param {string} phone - מספר הטלפון לבדיקה
 * @returns {boolean} - האם מספר הטלפון תקין
 */
function validatePhone(phone) {
    // מסיר תווים שאינם ספרות
    const cleanPhone = phone.replace(/\D/g, '');
    
    // בדיקת אורך ותחילית
    if (cleanPhone.length === 10 && (cleanPhone.startsWith('05') || cleanPhone.startsWith('07'))) {
        return true;
    }
    
    if (cleanPhone.length === 9 && cleanPhone.startsWith('5')) {
        return true;
    }
    
    return false;
}

// ========== אתחול הדף ==========

// אתחול כאשר ה-DOM נטען
document.addEventListener('DOMContentLoaded', function() {
    initUI();
});
