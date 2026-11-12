
const API_URL = "https://script.google.com/macros/s/AKfycbz2IJrCcKkFx3YFMeWemKAYLeATq2IxYffdBZGE35SqThr_fTYzvoZfK48RKf0mE-ES/exec";

let allProducts = [];

async function getProducts() {
    const container = document.getElementById("products-container");

    if (!container) return;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to load products");

        allProducts = await response.json();

        displayProducts(allProducts);

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Could not load products.</p>";
    }
}

function displayProducts(products) {
    const container = document.getElementById("products-container");

    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = "<p>No products available.</p>";
        return;
    }

    container.innerHTML = products.map(product => {
        const image = product.image_url ||
            "https://placehold.co/600x500?text=Beauty+Product";

        const price = Number(product.price);
        const offer = Number(product.offer_price);

        return `
            <article class="product-card">
                <img src="${image}" alt="Product">

                <div class="product-info">
                    <h3>${escapeHTML(product.name)}</h3>
                    <p>${escapeHTML(product.description || "")}</p>

                    <div class="price">
                        ${offer > 0 && offer < price
                            ? `${offer} <span class="old-price">${price}</span>`
                            : price}
                    </div>

                    <button class="add-cart-btn"
                        data-id="${escapeHTML(product.id)}">
                        Add to Cart +
                    </button>
                </div>
            </article>
        `;
    }).join("");

    container.querySelectorAll(".add-cart-btn").forEach(button => {
        button.addEventListener("click", () => {
            addToCart(button.dataset.id);
        });
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

function addToCart(productId) {
    const product = allProducts.find(
        item => String(item.id) === String(productId)
    );

    if (!product) return;

    const cart = getCart();

    const existing = cart.find(
        item => String(item.id) === String(productId)
    );

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    updateCartCount();

    alert("Product added to cart!");
}

function updateCartCount() {
    const cart = getCart();

    const count = cart.reduce(
        (total, item) => total + item.quantity, 0
    );

    const counter = document.getElementById("cart-count");

    if (counter) {
        counter.textContent = count;
    }
}

getProducts();
updateCartCount();

function renderCart() {
    const container = document.getElementById("cart-items");

    if (!container) return;

    const cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <h2>Your cart is empty</h2>
                <p>Start exploring our products.</p>
                <a href="products.html" class="primary-btn">
                    Explore Products
                </a>
            </div>
        `;

        document.getElementById("cart-total").textContent = "0 EGP";
        return;
    }

    let total = 0;

    container.innerHTML = cart.map(item => {
        const price = Number(item.price);
        const offer = Number(item.offer_price);
        const finalPrice = offer > 0 && offer < price ? offer : price;

        total += finalPrice * item.quantity;

        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h3>${escapeHTML(item.name)}</h3>
                    <p>${finalPrice} EGP</p>
                </div>

                <div class="quantity-controls">
                    <button data-action="decrease" data-id="${escapeHTML(item.id)}">−</button>
                    <span>${item.quantity}</span>
                    <button data-action="increase" data-id="${escapeHTML(item.id)}">+</button>
                </div>

                <button class="remove-btn"
                    data-action="remove"
                    data-id="${escapeHTML(item.id)}">
                    Remove
                </button>
            </div>
        `;
    }).join("");

    document.getElementById("cart-total").textContent =
        total.toLocaleString() + " EGP";

    container.querySelectorAll("[data-action]").forEach(button => {
        button.addEventListener("click", () => {
            changeCart(button.dataset.id, button.dataset.action);
        });
    });
}

function changeCart(productId, action) {
    let cart = getCart();

    const item = cart.find(
        product => String(product.id) === String(productId)
    );

    if (!item) return;

    if (action === "increase") {
        item.quantity++;
    } else if (action === "decrease") {
        item.quantity--;

        if (item.quantity <= 0) {
            cart = cart.filter(
                product => String(product.id) !== String(productId)
            );
        }
    } else if (action === "remove") {
        cart = cart.filter(
            product => String(product.id) !== String(productId)
        );
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    updateCartCount();
    renderCart();
}

renderCart();

// =====================cart============================
const checkoutForm = document.getElementById("checkout-form");

if (checkoutForm) {
    checkoutForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const customerName = document.getElementById("customer-name").value.trim();
        const phone = document.getElementById("customer-phone").value.trim();
        const cart = getCart();

        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        let total = 0;

        const productsMessage = cart.map(item => {
            const price = Number(item.price);
            const offer = Number(item.offer_price);

            const finalPrice =
                offer > 0 && offer < price ? offer : price;

            const itemTotal = finalPrice * item.quantity;
            total += itemTotal;

            return `- ${item.name}
  Quantity: ${item.quantity}
  Price: ${finalPrice} EGP
  Subtotal: ${itemTotal} EGP`;
        }).join("\n\n");

        const message = `
New Order - Glow

Customer Name: ${customerName}
Phone: ${phone}

Products:
${productsMessage}

Total: ${total.toLocaleString()} EGP
        `;

        const whatsappURL =
            "https://wa.me/eng.rota?text=" + encodeURIComponent(message);

        window.open(whatsappURL, "alert");
    });
}
