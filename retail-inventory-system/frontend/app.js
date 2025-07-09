const API_URL = 'http://localhost:8080/api/products';

// DOM Elements
const productTable = document.getElementById('product-table-body');
const lowStockTable = document.getElementById('low-stock-table-body');
const addProductForm = document.getElementById('add-product-form');
const editProductModal = document.getElementById('edit-product-modal');
const editProductForm = document.getElementById('edit-product-form');
const manageStockModal = document.getElementById('manage-stock-modal');
const manageStockForm = document.getElementById('manage-stock-form');
const dashboardStats = {
    totalProducts: document.getElementById('total-products'),
    lowStockItems: document.getElementById('low-stock-items'),
    totalValue: document.getElementById('total-value'),
    totalItems: document.getElementById('total-items'),
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    fetchLowStock();
    fetchDashboardStats();
    setupEventListeners();
});

// Fetch all products
async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        showError('Failed to load products');
    }
}

// Fetch low stock products
async function fetchLowStock() {
    try {
        const response = await fetch(`${API_URL}/low-stock`);
        if (!response.ok) throw new Error('Failed to fetch low stock');
        const products = await response.json();
        renderLowStockProducts(products);
    } catch (error) {
        console.error('Error fetching low stock:', error);
        showError('Failed to load low stock products');
    }
}

// Fetch dashboard stats
async function fetchDashboardStats() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch stats');
        const products = await response.json();
        dashboardStats.totalProducts.textContent = products.length;
        dashboardStats.lowStockItems.textContent = products.filter(p => p.quantity < p.lowStockThreshold).length;
        dashboardStats.totalValue.textContent = `$${products.reduce((sum, p) => sum + p.quantity * p.price, 0).toFixed(2)}`;
        dashboardStats.totalItems.textContent = products.reduce((sum, p) => sum + p.quantity, 0);
    } catch (error) {
        console.error('Error fetching stats:', error);
        showError('Failed to load dashboard stats');
    }
}

// Render products in table
function renderProducts(products) {
    productTable.innerHTML = '';
    products.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4">${product.name}</td>
            <td class="px-6 py-4">${product.code}</td>
            <td class="px-6 py-4">${product.quantity}</td>
            <td class="px-6 py-4">$${product.price.toFixed(2)}</td>
            <td class="px-6 py-4">${product.lowStockThreshold}</td>
            <td class="px-6 py-4">
                <button onclick="openEditModal(${product.id})" class="text-blue-600 hover:underline">Edit</button>
                <button onclick="openManageStockModal(${product.id})" class="text-green-600 hover:underline ml-2">Stock</button>
                <button onclick="deleteProduct(${product.id})" class="text-red-600 hover:underline ml-2">Delete</button>
            </td>
        `;
        productTable.appendChild(tr);
    });
}

// Render low stock products
function renderLowStockProducts(products) {
    lowStockTable.innerHTML = '';
    products.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4">${product.name}</td>
            <td class="px-6 py-4">${product.code}</td>
            <td class="px-6 py-4">${product.quantity}</td>
            <td class="px-6 py-4">${product.lowStockThreshold}</td>
            <td class="px-6 py-4">
                <button onclick="openManageStockModal(${product.id})" class="text-green-600 hover:underline">Restock</button>
            </td>
        `;
        lowStockTable.appendChild(tr);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Add product form
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const product = {
            name: addProductForm.querySelector('#add-name').value,
            code: addProductForm.querySelector('#add-code').value,
            quantity: parseInt(addProductForm.querySelector('#add-quantity').value),
            price: parseFloat(addProductForm.querySelector('#add-price').value),
            lowStockThreshold: parseInt(addProductForm.querySelector('#add-threshold').value) || 10,
        };
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product),
            });
            if (!response.ok) throw new Error('Failed to add product');
            addProductForm.reset();
            fetchProducts();
            fetchLowStock();
            fetchDashboardStats();
        } catch (error) {
            console.error('Error adding product:', error);
            showError('Failed to add product. Product code may already exist.');
        }
    });

    // Edit product form
    editProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = editProductForm.dataset.productId;
        const product = {
            name: editProductForm.querySelector('#edit-name').value,
            code: editProductForm.querySelector('#edit-code').value,
            quantity: parseInt(editProductForm.querySelector('#edit-quantity').value),
            price: parseFloat(editProductForm.querySelector('#edit-price').value),
            lowStockThreshold: parseInt(editProductForm.querySelector('#edit-threshold').value) || 10,
        };
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product),
            });
            if (!response.ok) throw new Error('Failed to update product');
            editProductModal.classList.add('hidden');
            fetchProducts();
            fetchLowStock();
            fetchDashboardStats();
        } catch (error) {
            console.error('Error updating product:', error);
            showError('Failed to update product');
        }
    });

    // Manage stock form
    manageStockForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = manageStockForm.dataset.productId;
        const quantity = parseInt(manageStockForm.querySelector('#stock-quantity').value);
        const action = e.submitter.id === 'increase-stock' ? 'increase' : 'decrease';
        try {
            const response = await fetch(`${API_URL}/${id}/${action}-stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity }),
            });
            if (!response.ok) throw new Error(`Failed to ${action} stock`);
            manageStockModal.classList.add('hidden');
            fetchProducts();
            fetchLowStock();
            fetchDashboardStats();
        } catch (error) {
            console.error(`Error updating stock:`, error);
            showError(`Failed to ${action} stock. ${error.message}`);
        }
    });

    // Search
    document.getElementById('search-input').addEventListener('input', async (e) => {
        try {
            const response = await fetch(`${API_URL}/search?query=${e.target.value}`);
            if (!response.ok) throw new Error('Failed to search products');
            const products = await response.json();
            renderProducts(products);
        } catch (error) {
            console.error('Error searching products:', error);
            showError('Failed to search products');
        }
    });

    // Refresh buttons
    document.getElementById('refresh-data').addEventListener('click', () => {
        fetchProducts();
        fetchLowStock();
        fetchDashboardStats();
    });
    document.getElementById('refresh-products').addEventListener('click', fetchProducts);
    document.getElementById('refresh-low-stock').addEventListener('click', fetchLowStock);

    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.add('hidden');
        });
    });
}

// Open edit modal
async function openEditModal(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        const product = await response.json();
        editProductForm.querySelector('#edit-name').value = product.name;
        editProductForm.querySelector('#edit-code').value = product.code;
        editProductForm.querySelector('#edit-quantity').value = product.quantity;
        editProductForm.querySelector('#edit-price').value = product.price;
        editProductForm.querySelector('#edit-threshold').value = product.lowStockThreshold;
        editProductForm.dataset.productId = id;
        editProductModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error fetching product for edit:', error);
        showError('Failed to load product details');
    }
}

// Open manage stock modal
function openManageStockModal(id) {
    manageStockForm.dataset.productId = id;
    manageStockForm.querySelector('#stock-quantity').value = '';
    manageStockModal.classList.remove('hidden');
}

// Delete product
async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete product');
            fetchProducts();
            fetchLowStock();
            fetchDashboardStats();
        } catch (error) {
            console.error('Error deleting product:', error);
            showError('Failed to delete product');
        }
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded shadow-md';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}