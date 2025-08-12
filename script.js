// Espera a que todo el contenido del DOM esté completamente cargado y parseado
document.addEventListener('DOMContentLoaded', () => {

    // URL del archivo JSON con los datos de los vehículos
    const JSON_URL = 'https://raw.githubusercontent.com/Fernandojoseee/carros/refs/heads/main/data.json';

    // Referencias a elementos del DOM
    const productsContainer = document.getElementById('productsContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const searchInput = document.getElementById('searchInput');
    const cartCountSpan = document.getElementById('cartCount');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const processPaymentBtn = document.getElementById('processPaymentBtn');
    const confirmAddToCartBtn = document.getElementById('confirmAddToCartBtn');
    const quantityInput = document.getElementById('quantityInput');
    const customerNameInput = document.getElementById('customerName');

    // Instancias de los Modales de Bootstrap
    const quantityModal = new bootstrap.Modal(document.getElementById('quantityModal'));
    const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
    const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));

    // Almacenamiento de datos
    let vehiclesData = [];
    let cart = [];
    let selectedVehicle = null;

    /**
     * Carga los datos de los vehículos desde el JSON usando Fetch API y async/await.
     */
    const loadVehicles = async () => {
        showSpinner();
        try {
            const response = await fetch(JSON_URL);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            vehiclesData = await response.json();
            displayVehicles(vehiclesData);
        } catch (error) {
            console.error('No se pudieron cargar los datos de los vehículos:', error);
            productsContainer.innerHTML = `<p class="text-danger text-center">Error al cargar los productos. Por favor, intente de nuevo más tarde.</p>`;
        } finally {
            hideSpinner();
        }
    };

    /**
     * Muestra el spinner de carga.
     */
    const showSpinner = () => {
        loadingSpinner.style.display = 'block';
        productsContainer.style.display = 'none';
    };

    /**
     * Oculta el spinner de carga.
     */
    const hideSpinner = () => {
        loadingSpinner.style.display = 'none';
        productsContainer.style.display = 'flex'; // 'flex' porque es un .row
    };

    /**
     * Muestra los vehículos en la página, creando una tarjeta para cada uno.
     * @param {Array} vehicles - El array de vehículos a mostrar.
     */
    const displayVehicles = (vehicles) => {
        productsContainer.innerHTML = '';
        if (vehicles.length === 0) {
            productsContainer.innerHTML = `<p class="text-light text-center">No se encontraron vehículos que coincidan con la búsqueda.</p>`;
            return;
        }

        vehicles.forEach(vehicle => {
            const card = document.createElement('div');
            card.className = 'col-lg-4 col-md-6 mb-4';
            card.innerHTML = `
                <div class="card h-100">
                    <img src="${vehicle.imagen}" class="card-img-top" alt="Imagen de ${vehicle.marca} ${vehicle.modelo}" loading="lazy">
                    <div class="card-body">
                        <h5 class="card-title">${vehicle.marca} ${vehicle.modelo}</h5>
                        <p class="card-text description">${vehicle.categoria} | ${vehicle.tipo.replace(/[\u{1F600}-\u{1F64F}]/gu, '').trim()}</p>
                        <p class="card-text"><span class="price-text">${formatPrice(vehicle.precio_venta)}</span></p>
                        <button class="btn btn-primary w-100 addToCartBtn" data-codigo="${vehicle.codigo}" aria-label="Añadir ${vehicle.marca} ${vehicle.modelo} al carrito">
                           <i class="fas fa-cart-plus me-2"></i>Añadir al Carrito
                        </button>
                    </div>
                </div>
            `;
            productsContainer.appendChild(card);
        });
        addAddToCartListeners();
    };

    /**
     * Formatea un número como una cadena de moneda en USD.
     * @param {number} price - El precio a formatear.
     * @returns {string} El precio formateado.
     */
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
    };

    /**
     * Filtra los vehículos según el texto de búsqueda y los muestra.
     */
    const filterVehicles = () => {
        const query = searchInput.value.toLowerCase();
        const filteredVehicles = vehiclesData.filter(vehicle =>
            vehicle.marca.toLowerCase().includes(query) ||
            vehicle.modelo.toLowerCase().includes(query) ||
            vehicle.categoria.toLowerCase().includes(query)
        );
        displayVehicles(filteredVehicles);
    };

    /**
     * Añade listeners a todos los botones "Añadir al Carrito".
     */
    const addAddToCartListeners = () => {
        const buttons = document.querySelectorAll('.addToCartBtn');
        buttons.forEach(button => {
            button.addEventListener('click', (event) => {
                const codigo = parseInt(event.currentTarget.dataset.codigo);
                selectedVehicle = vehiclesData.find(v => v.codigo === codigo);
                showQuantityModal();
            });
        });
    };

    /**
     * Muestra el modal para que el usuario seleccione la cantidad.
     */
    const showQuantityModal = () => {
        quantityInput.value = '1';
        quantityModal.show();
    };

    /**
     * Añade un ítem al carrito o actualiza su cantidad si ya existe.
     * @param {Object} vehicle - El objeto del vehículo a añadir.
     * @param {number} quantity - La cantidad de unidades a añadir.
     */
    const addItemToCart = (vehicle, quantity) => {
        if (quantity <= 0) return;

        const existingItem = cart.find(item => item.codigo === vehicle.codigo);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ ...vehicle, quantity: quantity });
        }
        updateCartUI();
        quantityModal.hide();
    };

    /**
     * Actualiza la interfaz del carrito (contador, contenido del modal y total).
     */
    const updateCartUI = () => {
        // Actualizar contador del ícono del carrito
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountSpan.textContent = totalItems;
        cartCountSpan.classList.remove('pulse');
        void cartCountSpan.offsetWidth; // Truco para reiniciar la animación
        cartCountSpan.classList.add('pulse');

        // Actualizar contenido del modal del carrito
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center text-muted">Tu carrito está vacío.</p>';
            checkoutBtn.disabled = true;
        } else {
            cartItemsContainer.innerHTML = cart.map(item => {
                const subtotal = item.precio_venta * item.quantity;
                return `
                    <div class="cart-item">
                        <img src="${item.imagen}" alt="${item.marca} ${item.modelo}">
                        <div class="cart-item-info">
                            <strong>${item.marca} ${item.modelo}</strong>
                            <p class="mb-0">Cantidad: ${item.quantity}</p>
                        </div>
                        <strong class="price-text">${formatPrice(subtotal)}</strong>
                    </div>
                `;
            }).join('');
            checkoutBtn.disabled = false;
        }

        // Actualizar total
        const total = cart.reduce((sum, item) => sum + (item.precio_venta * item.quantity), 0);
        cartTotalSpan.textContent = formatPrice(total);
    };

    /**
     * Genera una factura en formato PDF con los detalles de la compra.
     */
    const generateInvoice = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const customerName = customerNameInput.value || 'Cliente';
        const date = new Date().toLocaleDateString('es-ES');
        let y = 20; // Posición vertical inicial

        // Título
        doc.setFontSize(22);
        doc.text("Factura de Compra - GarageOnline", 105, y, { align: 'center' });
        y += 15;

        // Información del cliente
        doc.setFontSize(12);
        doc.text(`Cliente: ${customerName}`, 14, y);
        doc.text(`Fecha: ${date}`, 196, y, { align: 'right' });
        y += 15;

        // Cabecera de la tabla
        doc.setFontSize(10);
        doc.text("Marca/Modelo", 14, y);
        doc.text("Cantidad", 120, y);
        doc.text("Subtotal", 196, y, { align: 'right' });
        y += 7;
        doc.line(14, y, 196, y); // Línea separadora
        y += 5;

        // Items del carrito
        cart.forEach(item => {
            const subtotal = item.precio_venta * item.quantity;
            doc.text(`${item.marca} ${item.modelo}`, 14, y);
            doc.text(`${item.quantity}`, 120, y);
            doc.text(formatPrice(subtotal), 196, y, { align: 'right' });
            y += 7;
        });

        // Línea separadora final y total
        doc.line(14, y, 196, y);
        y += 10;
        const total = cart.reduce((sum, item) => sum + (item.precio_venta * item.quantity), 0);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("Total:", 14, y);
        doc.text(formatPrice(total), 196, y, { align: 'right' });
        y += 20;

        // Pie de página
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text("¡Gracias por su compra!", 105, y, { align: 'center' });

        // Guardar el PDF
        doc.save(`Factura-GarageOnline-${customerName.replace(/\s/g, '_')}.pdf`);
    };
    
    // --- Event Listeners ---

    // Listener para la barra de búsqueda (filtra en tiempo real)
    searchInput.addEventListener('input', filterVehicles);
    
    // Listener para el botón "Añadir al carrito" DENTRO del modal de cantidad
    confirmAddToCartBtn.addEventListener('click', () => {
        const quantity = parseInt(quantityInput.value);
        addItemToCart(selectedVehicle, quantity);
    });

    // Listener para el botón "Pagar" que abre el modal de pago
    checkoutBtn.addEventListener('click', () => {
        cartModal.hide();
        paymentModal.show();
    });
    
    // Listener para el botón "Procesar Pago"
    processPaymentBtn.addEventListener('click', () => {
        // Simple validación del formulario de pago
        const form = document.getElementById('paymentForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        alert('¡Pago procesado con éxito! Generando su factura...');

        generateInvoice();

        // Limpiar y resetear
        cart = [];
        updateCartUI();
        paymentModal.hide();
        form.reset();
    });

    // Carga inicial de datos
    loadVehicles();
});