/**
 * Checkout JavaScript - מדיה פרינט
 * מטפל בפונקציונליות של תהליך התשלום
 */

// אתחול משתנים גלובליים
let cart = [];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS
    AOS.init({
        duration: 1000,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });

    // Elements
    const checkoutSteps = document.querySelectorAll('.checkout-step');
    const stepContents = document.querySelectorAll('.checkout-step-content');
    const stepLines = document.querySelectorAll('.step-line');
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    const createAccountCheckbox = document.getElementById('create-account');
    const accountFields = document.querySelector('.account-fields');
    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    const creditCardFields = document.getElementById('credit-card-fields');
    const paypalFields = document.getElementById('paypal-fields');
    const bankFields = document.getElementById('bank-fields');
    const shippingOptions = document.querySelectorAll('input[name="shipping"]');
    const orderItems = document.querySelector('.order-items');
    const subtotalAmount = document.querySelector('.subtotal-amount');
    const shippingAmount = document.querySelector('.shipping-amount');
    const discountAmount = document.querySelector('.discount-amount');
    const totalAmount = document.querySelector('.total-amount');

    // Load cart items from localStorage
    loadCartItems();

    // Calculate order totals
    calculateOrderTotals();

    // Step navigation
    nextButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            // Validate current step
            if (validateStep(index)) {
                // Move to next step
                goToStep(index + 1);
            }
        });
    });

    prevButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            // Find the current step index
            const currentStepIndex = Array.from(stepContents).findIndex(step => 
                step.classList.contains('active'));
            
            // Go to previous step
            goToStep(currentStepIndex - 1);
        });
    });

    // Toggle account fields
    if (createAccountCheckbox) {
        createAccountCheckbox.addEventListener('change', function() {
            if (this.checked) {
                accountFields.style.display = 'block';
            } else {
                accountFields.style.display = 'none';
            }
        });
    }

    // Toggle payment method fields
    paymentOptions.forEach(option => {
        option.addEventListener('change', function() {
            // Hide all payment fields
            creditCardFields.style.display = 'none';
            paypalFields.style.display = 'none';
            bankFields.style.display = 'none';

            // Show selected payment fields
            if (this.id === 'payment-credit') {
                creditCardFields.style.display = 'block';
            } else if (this.id === 'payment-paypal') {
                paypalFields.style.display = 'block';
            } else if (this.id === 'payment-bank') {
                bankFields.style.display = 'block';
            }
        });
    });

    // Update shipping cost when shipping option changes
    shippingOptions.forEach(option => {
        option.addEventListener('change', function() {
            let shippingCost = 0;
            
            if (this.id === 'shipping-standard') {
                shippingCost = 40;
            } else if (this.id === 'shipping-express') {
                shippingCost = 60;
            } else if (this.id === 'shipping-pickup') {
                shippingCost = 0;
            }
            
            // Update shipping amount
            shippingAmount.textContent = `₪${shippingCost.toFixed(2)}`;
            
            // Recalculate totals
            calculateOrderTotals();
        });
    });

    // Credit card formatting
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            // Remove non-digits
            let value = this.value.replace(/\D/g, '');
            
            // Add spaces after every 4 digits
            if (value.length > 0) {
                value = value.match(/.{1,4}/g).join(' ');
            }
            
            // Update input value
            this.value = value;
            
            // Limit to 19 characters (16 digits + 3 spaces)
            if (this.value.length > 19) {
                this.value = this.value.slice(0, 19);
            }
            
            // Update card type icon
            updateCardTypeIcon(this.value.replace(/\s/g, ''));
        });
    }

    // Expiry date formatting
    const expiryDateInput = document.getElementById('expiry-date');
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', function(e) {
            // Remove non-digits
            let value = this.value.replace(/\D/g, '');
            
            // Format as MM/YY
            if (value.length > 0) {
                if (value.length <= 2) {
                    this.value = value;
                } else {
                    this.value = value.slice(0, 2) + '/' + value.slice(2, 4);
                }
            }
            
            // Limit to 5 characters (MM/YY)
            if (this.value.length > 5) {
                this.value = this.value.slice(0, 5);
            }
        });
    }

    // CVV formatting
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            // Remove non-digits
            this.value = this.value.replace(/\D/g, '');
            
            // Limit to 3 or 4 digits
            if (this.value.length > 4) {
                this.value = this.value.slice(0, 4);
            }
        });
    }

    // Apply coupon button
    const couponButton = document.querySelector('.coupon-code button');
    if (couponButton) {
        couponButton.addEventListener('click', function() {
            const couponInput = document.querySelector('.coupon-code input');
            const couponCode = couponInput.value.trim();
            
            if (couponCode) {
                // Check if coupon is valid (demo: "WELCOME10")
                if (couponCode === 'WELCOME10') {
                    // Apply 10% discount
                    const subtotal = parseFloat(subtotalAmount.textContent.replace('₪', ''));
                    const discount = subtotal * 0.1;
                    discountAmount.textContent = `₪${discount.toFixed(2)}`;
                    
                    // Show success message
                    alert('קוד הקופון הוחל בהצלחה! קיבלת 10% הנחה.');
                    
                    // Recalculate totals
                    calculateOrderTotals();
                } else {
                    // Invalid coupon
                    alert('קוד הקופון אינו תקף.');
                }
            } else {
                // Empty coupon
                alert('אנא הזן קוד קופון.');
            }
        });
    }

    /**
     * Go to specific step
     * @param {number} stepIndex - Index of the step to go to
     */
    function goToStep(stepIndex) {
        // Hide all steps
        stepContents.forEach(step => step.classList.remove('active'));
        checkoutSteps.forEach(step => step.classList.remove('active', 'completed'));
        stepLines.forEach(line => line.classList.remove('active'));
        
        // Show selected step
        stepContents[stepIndex].classList.add('active');
        
        // Update step indicators
        for (let i = 0; i <= stepIndex; i++) {
            if (i < stepIndex) {
                checkoutSteps[i].classList.add('completed');
            } else {
                checkoutSteps[i].classList.add('active');
            }
            
            if (i < stepIndex) {
                stepLines[i].classList.add('active');
            }
        }
        
        // Scroll to top of the step
        window.scrollTo({
            top: document.querySelector('.checkout-form-container').offsetTop - 100,
            behavior: 'smooth'
        });
    }

    /**
     * Validate current step
     * @param {number} stepIndex - Index of the step to validate
     * @returns {boolean} - Whether the step is valid
     */
    function validateStep(stepIndex) {
        let isValid = true;
        
        // Step 1: Customer details
        if (stepIndex === 0) {
            const firstName = document.getElementById('first-name');
            const lastName = document.getElementById('last-name');
            const email = document.getElementById('email');
            const phone = document.getElementById('phone');
            const password = document.getElementById('password');
            
            // Check required fields
            if (!firstName.value.trim()) {
                isValid = false;
                highlightInvalidField(firstName);
            }
            
            if (!lastName.value.trim()) {
                isValid = false;
                highlightInvalidField(lastName);
            }
            
            if (!email.value.trim() || !isValidEmail(email.value)) {
                isValid = false;
                highlightInvalidField(email);
            }
            
            if (!phone.value.trim()) {
                isValid = false;
                highlightInvalidField(phone);
            }
            
            // Check password if create account is checked
            if (createAccountCheckbox && createAccountCheckbox.checked && !password.value.trim()) {
                isValid = false;
                highlightInvalidField(password);
            }
        }
        
        // Step 2: Shipping
        else if (stepIndex === 1) {
            const address = document.getElementById('address');
            const city = document.getElementById('city');
            const zip = document.getElementById('zip');
            
            // Check required fields
            if (!address.value.trim()) {
                isValid = false;
                highlightInvalidField(address);
            }
            
            if (!city.value.trim()) {
                isValid = false;
                highlightInvalidField(city);
            }
            
            if (!zip.value.trim()) {
                isValid = false;
                highlightInvalidField(zip);
            }
        }
        
        // Step 3: Payment
        else if (stepIndex === 2) {
            const selectedPayment = document.querySelector('input[name="payment"]:checked');
            
            // Credit card validation
            if (selectedPayment && selectedPayment.id === 'payment-credit') {
                const cardHolder = document.getElementById('card-holder');
                const cardNumber = document.getElementById('card-number');
                const expiryDate = document.getElementById('expiry-date');
                const cvv = document.getElementById('cvv');
                
                if (!cardHolder.value.trim()) {
                    isValid = false;
                    highlightInvalidField(cardHolder);
                }
                
                if (!cardNumber.value.trim() || cardNumber.value.replace(/\s/g, '').length < 16) {
                    isValid = false;
                    highlightInvalidField(cardNumber);
                }
                
                if (!expiryDate.value.trim() || !isValidExpiryDate(expiryDate.value)) {
                    isValid = false;
                    highlightInvalidField(expiryDate);
                }
                
                if (!cvv.value.trim() || cvv.value.length < 3) {
                    isValid = false;
                    highlightInvalidField(cvv);
                }
            }
        }
        
        // If not valid, show error message
        if (!isValid) {
            alert('אנא מלא את כל השדות הנדרשים בצורה תקינה.');
        }
        
        return isValid;
    }

    /**
     * Highlight invalid field
     * @param {HTMLElement} field - Field to highlight
     */
    function highlightInvalidField(field) {
        field.classList.add('is-invalid');
        
        field.addEventListener('input', function() {
            this.classList.remove('is-invalid');
        }, { once: true });
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - Whether the email is valid
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate expiry date format and value
     * @param {string} expiryDate - Expiry date to validate (MM/YY)
     * @returns {boolean} - Whether the expiry date is valid
     */
    function isValidExpiryDate(expiryDate) {
        // Check format
        if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
            return false;
        }
        
        const [month, year] = expiryDate.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
        const currentMonth = currentDate.getMonth() + 1; // January is 0
        
        // Convert to numbers
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);
        
        // Check month range
        if (monthNum < 1 || monthNum > 12) {
            return false;
        }
        
        // Check if date is in the past
        if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
            return false;
        }
        
        return true;
    }

    /**
     * Update card type icon based on card number
     * @param {string} cardNumber - Card number
     */
    function updateCardTypeIcon(cardNumber) {
        const cardTypeIcon = document.querySelector('.card-type-icon i');
        
        if (!cardTypeIcon) return;
        
        // Visa
        if (/^4/.test(cardNumber)) {
            cardTypeIcon.className = 'fab fa-cc-visa';
        }
        // Mastercard
        else if (/^5[1-5]/.test(cardNumber)) {
            cardTypeIcon.className = 'fab fa-cc-mastercard';
        }
        // Amex
        else if (/^3[47]/.test(cardNumber)) {
            cardTypeIcon.className = 'fab fa-cc-amex';
        }
        // Default
        else {
            cardTypeIcon.className = 'far fa-credit-card';
        }
    }

    /**
     * Load cart items from localStorage
     */
    function loadCartItems() {
        if (!orderItems) return;
        
        // Get cart items from localStorage
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Clear order items
        orderItems.innerHTML = '';
        
        // If cart is empty, show message
        if (cart.length === 0) {
            orderItems.innerHTML = '<div class="text-center py-3">העגלה שלך ריקה</div>';
            return;
        }
        
        // Add items to order summary
        cart.forEach(item => {
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item';
            orderItem.innerHTML = `
                <div class="order-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="order-item-details">
                    <div class="order-item-title">${item.name}</div>
                    <div class="order-item-variant">כמות: ${item.quantity}</div>
                    <div class="order-item-price">
                        <span>₪${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                </div>
            `;
            
            orderItems.appendChild(orderItem);
        });
    }

    /**
     * Calculate order totals
     */
    function calculateOrderTotals() {
        // Get cart items from localStorage
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Calculate subtotal
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        // Get shipping cost
        const shippingCost = parseFloat(shippingAmount.textContent.replace('₪', '')) || 0;
        
        // Get discount
        const discount = parseFloat(discountAmount.textContent.replace('₪', '')) || 0;
        
        // Calculate total
        const total = subtotal + shippingCost - discount;
        
        // Update amounts
        subtotalAmount.textContent = `₪${subtotal.toFixed(2)}`;
        totalAmount.textContent = `₪${total.toFixed(2)}`;
    }

    // רשימת דומיינים מורשים לסנכרון
    const allowedDomains = [
        'http://localhost:8000',
        'http://localhost:8080',
        'http://127.0.0.1:60898',
        'http://127.0.0.1:8000',
        'http://127.0.0.1:8080'
    ];
    
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
            const cartJson = localStorage.getItem('cart');
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
                loadCartFromStorage();
                console.log('סל הקניות עודכן מדומיין אחר');
            } catch (error) {
                console.error('שגיאה בטעינת סל הקניות מ-localStorage:', error);
            }
        }
    });
    
    // האזנה להודעות מ-iframes
    window.addEventListener('message', function(event) {
        // בדיקה שההודעה מגיעה מדומיין מורשה
        if (allowedDomains.includes(event.origin)) {
            const data = event.data;
            
            // בדיקה אם זה אישור לסנכרון סל הקניות
            if (data && data.type === 'syncCartConfirmation') {
                console.log('אישור סנכרון סל הקניות התקבל מ-', event.origin, 'סטטוס:', data.status);
            }
        }
    });
    
    // סנכרון סל הקניות בין דומיינים בעת טעינת הדף
    setTimeout(syncCartAcrossDomains, 1000);
});
