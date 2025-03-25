/**
 * מדיה פרינט - קוד JavaScript לחנות
 */

// אתחול משתנים גלובליים
let cart = [];
let products = [];
let categories = [];

// מערך דומיינים מורשים לסנכרון
const allowedDomains = [
    'http://localhost:8000',
    'http://localhost:8080',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:60898',
    'http://127.0.0.1:5500',
    'localhost:8000',
    'localhost:8080',
    '127.0.0.1:60898',
    '127.0.0.1:8000',
    '127.0.0.1:8080',
    'localhost',
    '127.0.0.1'
];

// האזנה לטעינת המסמך
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS animation library
    AOS.init({
        duration: 1000,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });

    // Products data - מוצרים ברירת מחדל שיוצגו אם אין מוצרים ב-localStorage
    const defaultProducts = [];

    // קבלת המוצרים מ-localStorage או שימוש במוצרי ברירת המחדל
    // האזנה לשינויים ב-localStorage
    window.addEventListener('storage', function(event) {
        if (event.key === 'products' || event.key === 'productsUpdatedTimestamp') {
            console.log('זוהה שינוי ב-localStorage:', event.key);
            loadProductsFromStorage();
        }
        if (event.key === 'mediaprint_categories') {
            console.log('זוהה שינוי בקטגוריות ב-localStorage');
            loadCategoriesFromStorage();
        }
    });
    
    // האזנה לשינויים ב-localStorage
    window.addEventListener('storage', function(event) {
        if (event.key === 'products' || event.key === 'productsUpdatedTimestamp') {
            console.log('זוהה שינוי ב-localStorage:', event.key);
            loadProductsFromStorage();
        }
    });
    
    // האזנה להודעות מדומיינים אחרים
    window.addEventListener('message', function(event) {
        // בדיקה שהמקור מורשה
        if (allowedDomains.some(domain => event.origin.includes(domain))) {
            const data = event.data;
            
            if (data.type === 'sync_products') {
                try {
                    // שמירת המוצרים ב-localStorage
                    localStorage.setItem('products', data.products);
                    localStorage.setItem('productsUpdatedTimestamp', data.timestamp);
                    
                    // טעינת המוצרים מחדש
                    loadProductsFromStorage();
                    
                    // שליחת אישור למקור
                    event.source.postMessage({
                        type: 'sync_response',
                        status: 'success',
                        message: 'המוצרים סונכרנו בהצלחה'
                    }, event.origin);
                    
                    console.log('התקבלו מוצרים מדומיין אחר:', event.origin);
                } catch (error) {
                    console.error('שגיאה בקבלת מוצרים מדומיין אחר:', error);
                    
                    // שליחת שגיאה למקור
                    event.source.postMessage({
                        type: 'sync_response',
                        status: 'error',
                        message: error.message
                    }, event.origin);
                }
            }
        }
    });
    
    // פונקציה לטעינת המוצרים מ-localStorage
    function loadProductsFromStorage() {
        const storedProducts = localStorage.getItem('products');
        
        if (storedProducts) {
            try {
                // המר את המוצרים מ-localStorage למבנה שהחנות יכולה להשתמש בו
                const adminProducts = JSON.parse(storedProducts);
                console.log('מוצרים מ-localStorage:', adminProducts);
                
                // בדיקה אם יש מוצרים
                if (Array.isArray(adminProducts) && adminProducts.length > 0) {
                    products = convertAdminProductsToShopFormat(adminProducts);
                    console.log('מוצרים לאחר המרה:', products);
                } else {
                    console.log('אין מוצרים ב-localStorage או המערך ריק, משתמש במוצרי ברירת מחדל');
                    products = defaultProducts;
                }
            } catch (error) {
                console.error('שגיאה בקריאת המוצרים מ-localStorage:', error);
                products = defaultProducts;
            }
        } else {
            // אם אין מוצרים ב-localStorage, השתמש במוצרי ברירת המחדל
            console.log('לא נמצאו מוצרים ב-localStorage, משתמש במוצרי ברירת מחדל');
            products = defaultProducts;
        }
        
        // עדכון התצוגה
        renderProducts();
        setupEventListeners();
        
        // הצגת התראה
        showNotification('המוצרים עודכנו');
    }
    
    // טעינת המוצרים מ-localStorage בטעינת הדף
    loadProductsFromStorage();

    // Initialize the shop
    function initShop() {
        // Setup event listeners
        setupEventListeners();
        
        // טעינת סל הקניות מ-localStorage
        loadCartFromStorage();
        
        // טעינת הקטגוריות מ-localStorage
        loadCategoriesFromStorage();
        
        // סנכרון סל הקניות בין דומיינים בעת טעינת הדף
        setTimeout(syncCartAcrossDomains, 1000);
        
        console.log('Shop initialized successfully');
    }

    // Initialize shop when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initShop();
    });

    // Function to render products
    function renderProducts() {
        const productsGrid = document.querySelector('.products-grid');
        if (!productsGrid) {
            console.error('לא נמצא אלמנט עם class: products-grid');
            return;
        }
        
        productsGrid.innerHTML = '';
        
        // Filter products based on active filter
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        let activeFilter = 'all'; // ברירת מחדל אם לא נמצא כפתור פעיל
        
        if (activeFilterBtn) {
            activeFilter = activeFilterBtn.getAttribute('data-filter');
        } else {
            console.log('לא נמצא כפתור סינון פעיל, מציג את כל המוצרים');
            // בדיקה אם יש כפתורי סינון בכלל
            const filterBtns = document.querySelectorAll('.filter-btn');
            if (filterBtns.length > 0) {
                // הפעלת הכפתור הראשון
                filterBtns[0].classList.add('active');
                activeFilter = filterBtns[0].getAttribute('data-filter') || 'all';
            }
        }
        
        let filteredProducts = [];
        
        if (activeFilter === 'all') {
            filteredProducts = products;
        } else if (activeFilter.startsWith('category-')) {
            // סינון לפי מזהה הקטגוריה
            const categoryId = parseInt(activeFilter.replace('category-', ''));
            filteredProducts = products.filter(product => {
                // אם למוצר יש שדה categories, בדוק אם הקטגוריה נמצאת בו
                if (product.categories && Array.isArray(product.categories)) {
                    return product.categories.includes(categoryId);
                }
                // אם למוצר יש שדה category כמספר, השווה אותו ישירות
                if (typeof product.category === 'number') {
                    return product.category === categoryId;
                }
                // אחרת, נסה לבדוק אם שדה category הוא מחרוזת המכילה את מזהה הקטגוריה
                if (typeof product.category === 'string') {
                    return product.category.includes(categoryId.toString());
                }
                return false;
            });
        } else {
            // סינון לפי הפילטר הישן (ברירת מחדל)
            filteredProducts = products.filter(product => product.category === activeFilter);
        }
        
        if (filteredProducts.length === 0) {
            // אין מוצרים להצגה
            productsGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="empty-products">
                        <i class="fas fa-box-open fa-4x mb-3"></i>
                        <h3>אין מוצרים להצגה</h3>
                        <p>עדיין לא נוספו מוצרים לחנות או אין מוצרים בקטגוריה שנבחרה.</p>
                        <p>אם אתה מנהל האתר, אנא הוסף מוצרים דרך <a href="admin-new/products.html" target="_blank">ממשק הניהול</a>.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Render products
        let productsHTML = '';
        filteredProducts.forEach(product => {
            productsHTML += `
                <div class="col-lg-3 col-md-4 col-sm-6" data-aos="fade-up" data-aos-delay="100" data-category="${product.category}">
                    <div class="product-card">
                        ${product.badge ? `<div class="product-badge ${product.badge === 'מבצע' ? 'sale' : 'new'}">${product.badge}</div>` : ''}
                        <div class="product-image">
                            <img src="${product.image}" alt="${product.title}">
                            <div class="product-actions">
                                <button class="quick-view-btn" data-product-id="${product.id}">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="add-to-cart-btn" data-product-id="${product.id}">
                                    <i class="fas fa-shopping-cart"></i>
                                </button>
                            </div>
                        </div>
                        <div class="product-info">
                            <h3 class="product-title">${product.title}</h3>
                            <div class="product-category">${getCategoryName(product.category)}</div>
                            <div class="product-rating">
                                ${getRatingStars(product.rating)}
                                <span class="rating-count">(${product.ratingCount})</span>
                            </div>
                            <div class="product-price">
                                ${product.oldPrice ? `<span class="old-price">₪${product.oldPrice.toFixed(2)}</span>` : ''}
                                <span class="current-price">₪${product.price.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        productsGrid.innerHTML = productsHTML;
        
        // הוספת אירועי לחיצה לכפתורים אחרי רינדור המוצרים
        // Quick view buttons
        document.querySelectorAll('.quick-view-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = parseInt(this.getAttribute('data-product-id'));
                openQuickView(productId);
            });
        });

        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = parseInt(this.getAttribute('data-product-id'));
                console.log('נלחץ כפתור הוסף לסל עבור מוצר:', productId);
                addToCart(productId, 1);
            });
        });
        
        console.log('הוספו אירועי לחיצה לכפתורי המוצרים');
    }

    // Function to get category name in Hebrew
    function getCategoryName(category) {
        const categories = {
            'signage': 'שילוט',
            'print': 'דפוס',
            'branding': 'מיתוג'
        };
        return categories[category] || category;
    }

    // Function to generate rating stars
    function getRatingStars(rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (halfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    // Setup event listeners
    function setupEventListeners() {
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Filter products
                renderProducts();
            });
        });

        // אירוע לחיצה על כפתור העגלה
        const cartToggle = document.getElementById('cart-toggle');
        const miniCart = document.querySelector('.mini-cart');
        
        if (cartToggle && miniCart) {
            cartToggle.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('פתיחת סל הקניות');
                
                // וידוא שה-cart מאותחל
                if (typeof cart === 'undefined') {
                    window.cart = [];
                    loadCartFromStorage();
                }
                
                // פתיחת החלון הצף של העגלה
                miniCart.classList.add('open');
                
                // יצירת שכבת האפלה אם היא לא קיימת
                if (!document.querySelector('.cart-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.className = 'cart-overlay';
                    document.body.appendChild(overlay);
                    
                    // הוספת אירוע לחיצה לשכבת האפלה
                    overlay.addEventListener('click', function() {
                        miniCart.classList.remove('open');
                        overlay.remove();
                    });
                }
            });
            
            console.log('נרשם אירוע לחיצה על כפתור סל הקניות');
        } else {
            console.error('לא נמצא כפתור סל הקניות או אלמנט סל הקניות');
            if (!cartToggle) console.error('לא נמצא אלמנט עם ID: cart-toggle');
            if (!miniCart) console.error('לא נמצא אלמנט עם class: mini-cart');
        }

        // סגירת סל הקניות
        const closeCart = document.querySelector('.close-cart');
        if (closeCart) {
            closeCart.addEventListener('click', function() {
                const miniCart = document.querySelector('.mini-cart');
                if (miniCart) {
                    miniCart.classList.remove('open');
                    
                    // הסרת שכבת האפלה
                    const overlay = document.querySelector('.cart-overlay');
                    if (overlay) {
                        overlay.remove();
                    }
                }
            });
        }

        // כפתור המשך לקנות בסל ריק
        const continueShoppingBtn = document.querySelector('.continue-shopping');
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', function() {
                // סגירת סל הקניות
                const miniCart = document.querySelector('.mini-cart');
                if (miniCart) {
                    miniCart.classList.remove('open');
                    
                    // הסרת שכבת האפלה
                    const overlay = document.querySelector('.cart-overlay');
                    if (overlay) {
                        overlay.remove();
                    }
                    
                    // גלילה לאזור המוצרים
                    document.getElementById('shop-products').scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
        
        // אירוע לחיצה על כפתור המשך לתשלום
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function(e) {
                // בדיקה אם הסל ריק
                if (cart.length === 0) {
                    e.preventDefault();
                    showNotification('סל הקניות ריק. אנא הוסף מוצרים לפני המעבר לתשלום.');
                } else {
                    // שמירת הסל ב-localStorage לפני המעבר לדף התשלום
                    localStorage.setItem('cart', JSON.stringify(cart));
                }
            });
        }
    }

    // Function to filter products
    function filterProducts(filter) {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        // מציאת הכפתור הפעיל ושינוי המחלקה שלו
        const activeButton = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        // Filter products
        renderProducts();
    }

    // פונקציה לטעינת הקטגוריות מ-localStorage
    function loadCategoriesFromStorage() {
        const categoryFilters = document.getElementById('categoryFilters');
        if (!categoryFilters) {
            console.error('לא נמצא אלמנט עם ID: categoryFilters');
            return;
        }
        
        // ניקוי תוכן קיים
        categoryFilters.innerHTML = '';
        
        // הוספת כפתור "הכל"
        const allButton = document.createElement('button');
        allButton.className = 'btn filter-btn active';
        allButton.setAttribute('data-filter', 'all');
        allButton.textContent = 'הכל';
        allButton.addEventListener('click', () => filterProducts('all'));
        categoryFilters.appendChild(allButton);
        
        // טעינת הקטגוריות מ-localStorage
        try {
            const storedCategories = localStorage.getItem('mediaprint_categories');
            
            if (storedCategories) {
                const categories = JSON.parse(storedCategories);
                
                // מיון הקטגוריות - קודם קטגוריות אב (parent=0)
                const parentCategories = categories.filter(cat => cat.parent === 0);
                
                // הוספת כפתורים עבור קטגוריות אב
                parentCategories.forEach(category => {
                    const button = document.createElement('button');
                    button.className = 'btn filter-btn';
                    button.setAttribute('data-filter', `category-${category.id}`);
                    button.setAttribute('data-category-id', category.id);
                    button.textContent = category.name;
                    button.addEventListener('click', () => filterProducts(`category-${category.id}`));
                    categoryFilters.appendChild(button);
                });
                
                console.log('קטגוריות נטענו בהצלחה');
            } else {
                console.log('לא נמצאו קטגוריות ב-localStorage, משתמש בברירות מחדל');
                
                // הוספת כפתורי ברירת מחדל אם אין קטגוריות
                const defaultCategories = ['שילוט', 'דפוס', 'מיתוג'];
                const defaultFilters = ['signage', 'print', 'branding'];
                
                defaultCategories.forEach((category, index) => {
                    const button = document.createElement('button');
                    button.className = 'btn filter-btn';
                    button.setAttribute('data-filter', defaultFilters[index]);
                    button.textContent = category;
                    button.addEventListener('click', () => filterProducts(defaultFilters[index]));
                    categoryFilters.appendChild(button);
                });
            }
        } catch (error) {
            console.error('שגיאה בטעינת הקטגוריות:', error);
            
            // הוספת כפתורי ברירת מחדל במקרה של שגיאה
            const defaultCategories = ['שילוט', 'דפוס', 'מיתוג'];
            const defaultFilters = ['signage', 'print', 'branding'];
            
            defaultCategories.forEach((category, index) => {
                const button = document.createElement('button');
                button.className = 'btn filter-btn';
                button.setAttribute('data-filter', defaultFilters[index]);
                button.textContent = category;
                button.addEventListener('click', () => filterProducts(defaultFilters[index]));
                categoryFilters.appendChild(button);
            });
        }
    }

    // Cart functionality
    let cart = [];
    
    // פונקציה לסנכרון סל הקניות בין דומיינים
    function syncCartAcrossDomains() {
        // יצירת iframe עבור כל דומיין מורשה
        allowedDomains.forEach(domain => {
            if (domain !== window.location.origin) {
                // בדיקה אם כבר קיים iframe לדומיין זה
                const existingFrame = document.querySelector(`iframe[data-domain="${domain}"]`);
                if (!existingFrame) {
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.src = `${domain}/sync-helper.html`;
                    iframe.setAttribute('data-domain', domain);
                    document.body.appendChild(iframe);
                    
                    // האזנה לטעינת ה-iframe
                    iframe.onload = function() {
                        // שליחת סל הקניות לסנכרון
                        sendCartToFrame(iframe);
                    };
                } else {
                    // שליחת סל הקניות ל-iframe קיים
                    sendCartToFrame(existingFrame);
                }
            }
        });
    }
    
    // פונקציה לשליחת סל הקניות ל-iframe
    function sendCartToFrame(iframe) {
        try {
            const cartJson = JSON.stringify(cart);
            iframe.contentWindow.postMessage({
                type: 'syncCart',
                cart: cartJson
            }, '*');
        } catch (error) {
            console.error('שגיאה בשליחת סל הקניות לסנכרון:', error);
        }
    }
    
    // האזנה לשינויים ב-localStorage
    window.addEventListener('storage', function(event) {
        if (event.key === 'cart') {
            try {
                // טעינת סל הקניות החדש
                cart = JSON.parse(event.newValue || '[]');
                // עדכון ממשק המשתמש
                updateCartUI();
                console.log('סל הקניות עודכן מדומיין אחר');
            } catch (error) {
                console.error('שגיאה בטעינת סל הקניות מ-localStorage:', error);
            }
        }
    });
    
    // האזנה להודעות מ-iframes
    window.addEventListener('message', function(event) {
        // בדיקה שההודעה מגיעה מדומיין מורשה
        if (allowedDomains.some(domain => event.origin.includes(domain))) {
            const data = event.data;
            
            // בדיקה אם זה אישור לסנכרון סל הקניות
            if (data && data.type === 'syncCartConfirmation') {
                console.log('אישור סנכרון סל הקניות התקבל מ-', event.origin, 'סטטוס:', data.status);
            }
        }
    });
    
    // טעינת סל הקניות מ-localStorage
    function loadCartFromStorage() {
        try {
            // וידוא שהמשתנה cart מאותחל גלובלית
            if (typeof window.cart === 'undefined') {
                window.cart = [];
            }
            
            // ניסיון לטעון את הסל מ-localStorage
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                cart = JSON.parse(savedCart);
                console.log('סל הקניות נטען בהצלחה מ-localStorage, פריטים:', cart.length);
            } else {
                cart = [];
                console.log('לא נמצא סל קניות ב-localStorage, מאתחל סל ריק');
            }
            
            // עדכון ממשק המשתמש רק אם הטעינה הצליחה
            updateCartUI();
        } catch (error) {
            console.error('שגיאה בטעינת סל הקניות מ-localStorage:', error);
            cart = [];
            // עדיין ננסה לעדכן את הממשק, למקרה שהשגיאה הייתה רק בפענוח ה-JSON
            try {
                updateCartUI();
            } catch (uiError) {
                console.error('שגיאה נוספת בעדכון ממשק סל הקניות:', uiError);
            }
        }
    }
    
    // Function to add product to cart
    function addToCart(productId, quantity, variant = null) {
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            console.error(`Product with ID ${productId} not found`);
            return;
        }
        
        // Check if product already in cart
        const existingItemIndex = cart.findIndex(item => 
            item.id === productId && 
            JSON.stringify(item.variant) === JSON.stringify(variant)
        );
        
        if (existingItemIndex !== -1) {
            // Update quantity
            cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.push({
                id: productId,
                title: product.title,
                price: product.price,
                image: product.image,
                quantity: quantity,
                variant: variant
            });
        }
        
        // Update UI
        updateCartUI();
        
        // פתיחת סל הקניות אוטומטית
        openMiniCart();
        
        // סנכרון סל הקניות בין דומיינים
        syncCartAcrossDomains();
        
        // Show notification
        showNotification(`${product.title} נוסף לסל הקניות`);
    }
    
    // פונקציה לפתיחת סל הקניות
    function openMiniCart() {
        const miniCart = document.querySelector('.mini-cart');
        
        if (miniCart) {
            miniCart.classList.add('open');
            
            // יצירת שכבת האפלה אם היא לא קיימת
            if (!document.querySelector('.cart-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'cart-overlay';
                document.body.appendChild(overlay);
                
                // הוספת אירוע לחיצה לשכבת האפלה
                overlay.addEventListener('click', function() {
                    miniCart.classList.remove('open');
                    overlay.remove();
                });
            }
            
            // הגדרת טיימר לסגירה אוטומטית של הסל אחרי 5 שניות
            setTimeout(function() {
                closeMiniCart();
            }, 5000);
        }
    }
    
    // פונקציה לסגירת סל הקניות
    function closeMiniCart() {
        const miniCart = document.querySelector('.mini-cart');
        
        if (miniCart) {
            miniCart.classList.remove('open');
            
            // הסרת שכבת האפלה
            const overlay = document.querySelector('.cart-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
    }

    // Function to update cart UI
    function updateCartUI() {
        // וידוא שהמשתנה cart מאותחל
        if (typeof cart === 'undefined' || !Array.isArray(cart)) {
            window.cart = [];
            return; // אין טעם להמשיך אם אין עגלה מאותחלת
        }
        
        // בדיקה האם האלמנטים של סל הקניות קיימים בדף
        const cartItemsContainer = document.querySelector('.mini-cart-items');
        const cartCount = document.querySelector('.cart-count');
        const subtotalAmount = document.querySelector('.subtotal-amount');
        const emptyCartMessage = document.querySelector('.empty-cart-message');
        
        // אם האלמנטים העיקריים לא קיימים בדף, לא צריך לעדכן את הממשק
        if (!cartItemsContainer || !cartCount) {
            console.log('אלמנטי סל הקניות לא נמצאו בדף הנוכחי, מדלג על עדכון הממשק');
            return;
        }
        
        // שמירת הסל ב-localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // סנכרון סל הקניות בין דומיינים
        if (typeof syncCartAcrossDomains === 'function') {
            syncCartAcrossDomains();
        }
        
        // Update cart count
        cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
        
        // Update subtotal if exists
        if (subtotalAmount) {
            const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
            subtotalAmount.textContent = `₪${subtotal.toLocaleString()}`;
        }
        
        // Show/hide empty cart message if exists
        if (emptyCartMessage) {
            if (cart.length === 0) {
                emptyCartMessage.style.display = 'block';
                cartItemsContainer.innerHTML = '';
                return;
            } else {
                emptyCartMessage.style.display = 'none';
            }
        }
        
        // Render cart items
        let cartItemsHTML = '';
        
        cart.forEach((item, index) => {
            cartItemsHTML += `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image || ''}" alt="${item.title || 'מוצר'}">
                    </div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.title || 'מוצר'}</h4>
                        ${item.variant ? `<div class="cart-item-variant">${formatVariant(item.variant)}</div>` : ''}
                        <div class="cart-item-price">₪${(item.price || 0).toLocaleString()}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn minus" data-index="${index}">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn plus" data-index="${index}">+</button>
                        </div>
                    </div>
                    <button class="remove-item-btn" data-index="${index}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
        });
        
        cartItemsContainer.innerHTML = cartItemsHTML;
        
        // הוסף מאזיני אירועים לכפתורי פריטי סל הקניות רק אם יש פריטים בסל
        if (cart.length > 0) {
            // Add event listeners to cart item buttons
            document.querySelectorAll('.quantity-btn.minus').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    updateCartItemQuantity(index, cart[index].quantity - 1);
                });
            });
            
            document.querySelectorAll('.quantity-btn.plus').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    updateCartItemQuantity(index, cart[index].quantity + 1);
                });
            });
            
            document.querySelectorAll('.remove-item-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    removeFromCart(index);
                });
            });
        }
    }

    // Function to format variant for display
    function formatVariant(variant) {
        return Object.entries(variant)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    }

    // Function to open quick view modal
    function openQuickView(productId) {
        const product = products.find(p => p.id == productId);
        if (!product) return;

        // Get modal elements
        const modal = document.createElement('div');
        modal.className = 'product-quick-view-modal';
        modal.innerHTML = `
            <div class="quick-view-overlay"></div>
            <div class="quick-view-content">
                <button class="quick-view-close"><i class="fas fa-times"></i></button>
                <div class="row">
                    <div class="col-md-6">
                        <div class="product-image">
                            <img src="${product.image}" alt="${product.title}">
                            ${product.badge ? `<div class="product-badge ${product.badge === 'מבצע' ? 'sale' : 'new'}">${product.badge}</div>` : ''}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="product-details">
                            <div class="product-category">${getCategoryName(product.category)}</div>
                            <h2 class="product-title">${product.title}</h2>
                            <div class="product-rating">
                                ${getRatingStars(product.rating)}
                                <span class="rating-count">(${product.ratingCount} ביקורות)</span>
                            </div>
                            <div class="product-price">
                                <span class="current-price">₪${product.price.toFixed(2)}</span>
                                ${product.oldPrice ? `<span class="old-price">₪${product.oldPrice.toFixed(2)}</span>` : ''}
                            </div>
                            <div class="product-description">
                                ${product.description}
                            </div>
                            <div class="product-meta">
                                <div class="meta-item">
                                    <span class="meta-label">מק"ט:</span>
                                    <span class="meta-value">${product.sku}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">קטגוריה:</span>
                                    <span class="meta-value">${getCategoryName(product.category)}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">מלאי:</span>
                                    <span class="meta-value stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                                        ${product.stock > 0 ? `${product.stock} במלאי` : 'אזל מהמלאי'}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="product-variations">
                                ${renderProductVariations(product)}
                            </div>
                            
                            <div class="product-quantity">
                                <label>כמות:</label>
                                <div class="quantity-selector">
                                    <button class="quantity-btn minus"><i class="fas fa-minus"></i></button>
                                    <input type="number" class="quantity-input" value="1" min="1" max="${product.stock}">
                                    <button class="quantity-btn plus"><i class="fas fa-plus"></i></button>
                                </div>
                            </div>
                            
                            <div class="product-actions">
                                <button class="btn btn-primary add-to-cart-btn" ${product.stock <= 0 ? 'disabled' : ''} data-product-id="${product.id}">
                                    <i class="fas fa-shopping-cart"></i> הוסף לסל
                                </button>
                                <button class="btn btn-outline-primary wishlist-btn">
                                    <i class="far fa-heart"></i>
                                </button>
                                <button class="btn btn-outline-primary compare-btn">
                                    <i class="fas fa-exchange-alt"></i>
                                </button>
                            </div>
                            
                            <div class="product-share">
                                <span>שתף:</span>
                                <div class="social-share">
                                    <a href="#" class="facebook"><i class="fab fa-facebook-f"></i></a>
                                    <a href="#" class="twitter"><i class="fab fa-twitter"></i></a>
                                    <a href="#" class="instagram"><i class="fab fa-instagram"></i></a>
                                    <a href="#" class="whatsapp"><i class="fab fa-whatsapp"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.appendChild(modal);

        // Setup event listeners
        const closeBtn = modal.querySelector('.quick-view-close');
        const overlay = modal.querySelector('.quick-view-overlay');
        
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        overlay.addEventListener('click', () => {
            modal.remove();
        });

        // Setup quantity selector
        const quantityInput = modal.querySelector('.quantity-input');
        const minusBtn = modal.querySelector('.quantity-btn.minus');
        const plusBtn = modal.querySelector('.quantity-btn.plus');
        
        minusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });
        
        plusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue < product.stock) {
                quantityInput.value = currentValue + 1;
            }
        });

        // Setup add to cart button
        const addToCartBtn = modal.querySelector('.add-to-cart-btn');
        addToCartBtn.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            
            // Get selected variants
            const selectedVariants = {};
            const variantSelects = modal.querySelectorAll('.variant-select');
            
            variantSelects.forEach(select => {
                const variantName = select.getAttribute('data-variant-name');
                const variantValue = select.value;
                selectedVariants[variantName] = variantValue;
            });
            
            // Add to cart
            addToCart(product.id, quantity, selectedVariants);
            
            // Close modal
            modal.remove();
        });
    }
    
    // פונקציה לרינדור וריאציות המוצר
    function renderProductVariations(product) {
        if (!product.variants || product.variants.length === 0) {
            return '';
        }
        
        let variationsHTML = '';
        
        // רינדור וריאציות רגילות
        product.variants.forEach(variant => {
            variationsHTML += `
                <div class="variation-group">
                    <label>${variant.name}:</label>
                    <select class="variant-select" data-variant-name="${variant.name}">
                        ${variant.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                    </select>
                </div>
            `;
        });
        
        // אם יש וריאציות ממממשק הניהול, הצג אותן בטבלה
        if (product.adminVariations && product.adminVariations.length > 0) {
            variationsHTML += `
                <div class="admin-variations mt-3">
                    <h5>אפשרויות זמינות:</h5>
                    <table class="admin-variations-table">
                        <thead>
                            <tr>
                                <th>שם</th>
                                <th>מק"ט</th>
                                <th>מחיר</th>
                                <th>מלאי</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${product.adminVariations.map(variation => `
                                <tr>
                                    <td>${variation.name}</td>
                                    <td>${variation.sku}</td>
                                    <td>₪${parseFloat(variation.price).toFixed(2)}</td>
                                    <td>${variation.stock}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        return variationsHTML;
    }

    // Function to convert admin products to shop format
    function convertAdminProductsToShopFormat(adminProducts) {
        return adminProducts.map(product => {
            // Convert variations from admin format to shop format
            let shopVariants = [];
            
            if (product.variations && product.variations.length > 0) {
                // Create variant for variation names
                const variantNames = [...new Set(product.variations.map(v => v.name))];
                
                if (variantNames.length > 0) {
                    const firstVariant = {
                        name: "סוג",
                        options: variantNames
                    };
                    shopVariants.push(firstVariant);
                }
                
                // Add additional variant for extra options
                shopVariants.push({
                    name: "אפשרויות נוספות",
                    options: ["סטנדרטי", "מותאם אישית"]
                });
            }
            
            // המרת קטגוריה לפורמט החנות
            let shopCategory = 'branding'; // ברירת מחדל
            const categoryLower = (product.category || '').toLowerCase();
            
            if (categoryLower.includes('שילוט') || categoryLower.includes('signage')) {
                shopCategory = 'signage';
            } else if (categoryLower.includes('דפוס') || categoryLower.includes('print') || 
                       categoryLower.includes('כרטיס') || categoryLower.includes('רול') || 
                       categoryLower.includes('באנר') || categoryLower.includes('דגל')) {
                shopCategory = 'print';
            } else if (categoryLower.includes('מיתוג') || categoryLower.includes('branding') || 
                       categoryLower.includes('לוגו') || categoryLower.includes('עיצוב')) {
                shopCategory = 'branding';
            }
            
            console.log(`המרת קטגוריה: ${product.category} -> ${shopCategory}`);
            
            return {
                id: product.id,
                title: product.name,
                category: shopCategory,
                price: parseFloat(product.price) || 0,
                oldPrice: null,
                rating: 4.5,  // Default rating
                ratingCount: 10,  // Default rating count
                image: product.image || "https://images.unsplash.com/photo-1545231027-637d2f6210f8?q=80&w=1470&auto=format&fit=crop",
                badge: null,
                description: product.description || `${product.name} - מוצר איכותי מבית מדיה פרינט.`,
                variants: shopVariants,
                sku: product.sku || '',
                stock: parseInt(product.stock) || 0,
                adminVariations: product.variations || []  // Store original variations for later use
            };
        });
    }

    // Function to show notification
    function showNotification(message) {
        // בדוק אם כבר יש אלמנט התראה
        let notification = document.querySelector('.shop-notification');
        
        if (!notification) {
            // יצירת אלמנט התראה חדש
            notification = document.createElement('div');
            notification.className = 'shop-notification';
            document.body.appendChild(notification);
        }
        
        // עדכון תוכן ההתראה
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-sync-alt"></i> ${message}
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // הצגת ההתראה
        notification.classList.add('show');
        
        // הוספת אירוע לכפתור הסגירה
        notification.querySelector('.notification-close').addEventListener('click', function() {
            notification.classList.remove('show');
        });
        
        // הסתרת ההתראה אוטומטית לאחר 3 שניות
        setTimeout(function() {
            notification.classList.remove('show');
        }, 3000);
    }

    // Function to remove item from cart
    function removeFromCart(index) {
        if (index >= 0 && index < cart.length) {
            const removedItem = cart[index];
            cart.splice(index, 1);
            updateCartUI();
            
            // הצגת התראה
            showNotification(`${removedItem.title} הוסר מסל הקניות`);
            
            // סנכרון סל הקניות בין דומיינים
            syncCartAcrossDomains();
        }
    }
    
    // Function to update cart item quantity
    function updateCartItemQuantity(index, newQuantity) {
        if (index >= 0 && index < cart.length) {
            if (newQuantity <= 0) {
                removeFromCart(index);
            } else {
                cart[index].quantity = newQuantity;
                updateCartUI();
                
                // סנכרון סל הקניות בין דומיינים
                syncCartAcrossDomains();
            }
        }
    }
});
