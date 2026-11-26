
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const products = [
    {
        id: 1,
        name: "Autumn Ember",
        brand: "Emberleaf Signature",
        category: "tea",
        price: 18,
        size: "100g",
        tag: "BESTSELLER",
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=85",
        description: "A warming tea blend inspired by autumn. Rounded tea notes meet aromatic spices to make every cup feel comforting.",
        ingredients: "Black tea, cassia, cardamom and natural flavour notes."
    },
    {
        id: 2,
        name: "Rosewood Chai",
        brand: "Emberleaf Signature",
        category: "tea",
        price: 21,
        size: "100g",
        tag: "FLORAL FAVOURITE",
        image: "https://images.unsplash.com/photo-1563911892437-1feda0179e1b?auto=format&fit=crop&w=900&q=85",
        description: "A delicate blend with soft floral notes and a warm, rounded tea character.",
        ingredients: "Black tea, rose petals and botanical ingredients."
    },
    {
        id: 3,
        name: "Golden Orchard",
        brand: "Emberleaf Signature",
        category: "tea",
        price: 19,
        size: "100g",
        tag: "CITRUS NOTES",
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=85",
        description: "A bright and lively combination inspired by citrus groves and the colour of golden autumn afternoons.",
        ingredients: "Tea leaves, orange peel and aromatic botanicals."
    },
    {
        id: 4,
        name: "Sunday Reserve",
        brand: "Emberleaf Classics",
        category: "loose",
        price: 24,
        size: "150g",
        tag: "CLASSIC",
        image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=900&q=85",
        description: "A simple and satisfying loose-leaf tea inspired by traditional tea rituals.",
        ingredients: "Selected black tea leaves."
    },
    {
        id: 5,
        name: "Evening Hush",
        brand: "Emberleaf Botanicals",
        category: "loose",
        price: 20,
        size: "100g",
        tag: "BOTANICAL",
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=85",
        description: "A gentle herbal-inspired infusion for quiet moments and relaxing tea rituals.",
        ingredients: "A selection of herbs and botanical ingredients."
    },
    {
        id: 6,
        name: "Autumn Gift Box",
        brand: "Emberleaf Gifts",
        category: "gifts",
        price: 45,
        size: "Gift set",
        tag: "GIFT FAVOURITE",
        image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=85",
        description: "A thoughtfully arranged gift concept inspired by the colours and comfort of autumn.",
        ingredients: "A selection of sample tea blends."
    },
    {
        id: 7,
        name: "The Tea Ritual Set",
        brand: "Emberleaf Gifts",
        category: "gifts",
        price: 58,
        size: "Gift set",
        tag: "THOUGHTFUL GIFT",
        image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85",
        description: "A tea-time gift concept for making a little more room for everyday rituals.",
        ingredients: "Tea selection and demonstration gift accessories."
    },
    {
        id: 8,
        name: "Everyday Tea Cup",
        brand: "Emberleaf Living",
        category: "accessories",
        price: 16,
        size: "One cup",
        tag: "DAILY RITUAL",
        image: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&w=900&q=85",
        description: "A simple tea cup inspired by warm natural tones and understated everyday design.",
        ingredients: "Material and finish details to be confirmed."
    },
    {
        id: 9,
        name: "Tea Infuser",
        brand: "Emberleaf Living",
        category: "accessories",
        price: 12,
        size: "One infuser",
        tag: "TEA ESSENTIAL",
        image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=900&q=85",
        description: "An everyday accessory concept for preparing a cup of loose-leaf tea.",
        ingredients: "Product material details to be confirmed."
    }
];

const CART_KEY = "emberleaf_cart";
const $money = value => "$" + Number(value).toFixed(2);

function readCart() {
    try {
        const value = JSON.parse(localStorage.getItem(CART_KEY));
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

let cart = readCart();
let selectedShopCategory = "all";
let toastTimeout;

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    const counter = $("#shopCartCount");

    if (counter) counter.textContent = total;
}

function showToast(message) {
    let toast = $("#pageToast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "pageToast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

function addToCart(id) {
    const product = products.find(item => item.id === Number(id));
    if (!product) return;

    const existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            quantity: 1
        });
    }

    saveCart();
    renderCart();
    renderShopProducts();
    showToast(`${product.name} added to your bag.`);
}

function removeCartItem(id) {
    cart = cart.filter(item => item.id !== Number(id));
    saveCart();
    renderCart();
    renderShopProducts();
    showToast("Item removed from your bag.");
}

function renderShopProducts() {
    const grid = $("#shopPageGrid");
    if (!grid) return;

    const search = $("#shopPageSearch").value.trim().toLowerCase();

    const filtered = products.filter(product => {
        const matchesCategory =
            selectedShopCategory === "all" ||
            product.category === selectedShopCategory;

        const matchesSearch =
            `${product.name} ${product.brand} ${product.category}`
                .toLowerCase()
                .includes(search);

        return matchesCategory && matchesSearch;
    });

    $("#shopResultCount").textContent = String(filtered.length).padStart(2, "0");

    $("#shopEmpty").classList.toggle("show", filtered.length === 0);
    grid.style.display = filtered.length ? "grid" : "none";

    grid.innerHTML = filtered.map((product, index) => `
        <article class="shop-product" style="animation-delay:${index * .04}s">
            <div class="shop-product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <span>${product.tag}</span>
            </div>
            <div class="shop-product-info">
                <span>${product.brand}</span>
                <h3>${product.name}</h3>
                <p>${product.size}</p>
                <div class="shop-product-bottom">
                    <strong>${$money(product.price)}</strong>
                    <button class="shop-add-button" data-page-action="add" data-id="${product.id}">
                        ADD TO BAG +
                    </button>
                </div>
                <button class="text-link" data-page-action="product-details" data-id="${product.id}">
                    VIEW DETAILS <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </article>
    `).join("");
}

function openShopDrawer() {
    renderCart();
    $("#shopDrawer").classList.add("open");
    $("#shopDrawerShade").classList.add("open");
    document.body.classList.add("locked");
}

function closeShopDrawer() {
    const drawer = $("#shopDrawer");
    const shade = $("#shopDrawerShade");

    if (!drawer || !shade) return;

    drawer.classList.remove("open");
    shade.classList.remove("open");
    document.body.classList.remove("locked");
}

function renderCart() {
    const content = $("#shopDrawerContent");
    const footer = $("#shopDrawerFooter");

    if (!content || !footer) return;

    if (!cart.length) {
        content.innerHTML = `
            <div class="shop-drawer-empty">
                <i class="fa-solid fa-mug-hot"></i>
                Your bag is waiting for something lovely.<br>
                Explore the collection and find your favourites.
            </div>
        `;

        footer.innerHTML = "";
        return;
    }

    content.innerHTML = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return "";

        return `
            <div class="shop-drawer-item">
                <img src="${product.image}" alt="${product.name}">
                <div>
                    <h4>${product.name}</h4>
                    <p>${$money(product.price)} × ${item.quantity}</p>
                </div>
                <button data-page-action="remove-cart" data-id="${product.id}" aria-label="Remove product">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
    }).join("");

    const subtotal = cart.reduce((total, item) => {
        const product = products.find(p => p.id === item.id);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);

    footer.innerHTML = `
        <div class="shop-drawer-total">
            <span>SUBTOTAL</span>
            <strong>${$money(subtotal)}</strong>
        </div>
        <button class="btn btn-dark" id="demoCheckout">CONTINUE TO CHECKOUT <i class="fa-solid fa-arrow-right"></i></button>
        <small>This is a frontend demonstration. No payment or order is being processed.</small>
    `;

    $("#demoCheckout").addEventListener("click", () => {
        showToast("A real checkout requires a connected payment and order system.");
    });
}

function openProductModal(id) {
    const product = products.find(item => item.id === Number(id));
    if (!product) return;

    $("#shopProductDetail").innerHTML = `
        <div class="shop-product-detail">
            <img src="${product.image}" alt="${product.name}">
            <div>
                <span>${product.brand.toUpperCase()}</span>
                <h2>${product.name}</h2>
                <p>${product.description}</p>
                <p><strong>Category:</strong> ${product.category}</p>
                <p><strong>Size:</strong> ${product.size}</p>
                <p><strong>Ingredients / details:</strong> ${product.ingredients}</p>
                <strong>${$money(product.price)}</strong>
                <button class="btn btn-dark" style="margin-top:20px;width:100%" data-page-action="add" data-id="${product.id}">
                    ADD TO BAG <i class="fa-solid fa-bag-shopping"></i>
                </button>
            </div>
        </div>
    `;

    $("#shopProductShade").classList.add("open");
    document.body.classList.add("locked");
}

function closeProductModal() {
    const shade = $("#shopProductShade");
    if (!shade) return;

    shade.classList.remove("open");
    document.body.classList.remove("locked");
}

function closeMobileNav() {
    const nav = $("#pageNav");
    const button = $("#pageMenuToggle");

    if (!nav || !button) return;

    nav.classList.remove("open");
    button.classList.remove("active");
}

function initNavigation() {
    const toggle = $("#pageMenuToggle");
    const nav = $("#pageNav");

    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
        toggle.classList.toggle("active");
        nav.classList.toggle("open");
    });

    nav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeMobileNav);
    });
}

function initShopping() {
    if (!$("#shopPageGrid")) return;

    renderShopProducts();
    renderCart();
    updateCartCount();

    $("#shopPageTabs").addEventListener("click", event => {
        const button = event.target.closest("[data-shop-category]");
        if (!button) return;

        selectedShopCategory = button.dataset.shopCategory;

        $$("#shopPageTabs button").forEach(tab => {
            tab.classList.toggle("active", tab === button);
        });

        renderShopProducts();
    });

    $("#shopPageSearch").addEventListener("input", renderShopProducts);

    $("#shopReset").addEventListener("click", () => {
        $("#shopPageSearch").value = "";
        selectedShopCategory = "all";

        $$("#shopPageTabs button").forEach(tab => {
            tab.classList.toggle("active", tab.dataset.shopCategory === "all");
        });

        renderShopProducts();
    });

    $("#giftFilter").addEventListener("click", () => {
        selectedShopCategory = "gifts";

        $$("#shopPageTabs button").forEach(tab => {
            tab.classList.toggle("active", tab.dataset.shopCategory === "gifts");
        });

        $("#shopPageSearch").value = "";
        renderShopProducts();

        $("#shopCollection").scrollIntoView({ behavior: "smooth" });
    });

    $("#shopCartButton").addEventListener("click", openShopDrawer);
    $("#shopDrawerClose").addEventListener("click", closeShopDrawer);
    $("#shopDrawerShade").addEventListener("click", closeShopDrawer);
    $("#shopProductClose").addEventListener("click", closeProductModal);

    $("#shopProductShade").addEventListener("click", event => {
        if (event.target.id === "shopProductShade") closeProductModal();
    });
}

function initStoreFinder() {
    const form = $("#storeFinderForm");
    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        const city = $("#storeCity").value.trim();

        $("#storeFinderStatus").textContent =
            `Thanks for your interest in ${city}. Live store locations are not connected yet. Please contact us for stockist availability.`;
    });
}

function initFAQ() {
    $$(".faq-question").forEach(question => {
        question.addEventListener("click", () => {
            const item = question.closest(".faq-item");
            const wasActive = item.classList.contains("active");

            $$(".faq-item").forEach(other => other.classList.remove("active"));

            if (!wasActive) item.classList.add("active");
        });
    });
}

function initPageActions() {
    document.addEventListener("click", event => {
        const button = event.target.closest("[data-page-action]");
        if (!button) return;

        const id = button.dataset.id;
        const action = button.dataset.pageAction;

        if (action === "add") addToCart(id);
        if (action === "remove-cart") removeCartItem(id);
        if (action === "product-details") openProductModal(id);
    });
}

function initRevealAnimations() {
    const elements = $$(".blend-card, .harvest-card, .feature-card, .store-option, .process-grid > div");

    if (!("IntersectionObserver" in window)) {
        elements.forEach(element => element.style.opacity = "1");
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            entry.target.animate(
                [
                    { opacity: 0, transform: "translateY(20px)" },
                    { opacity: 1, transform: "translateY(0)" }
                ],
                { duration: 650, easing: "ease-out", fill: "both" }
            );

            observer.unobserve(entry.target);
        });
    }, { threshold: .12 });

    elements.forEach(element => observer.observe(element));
}

function initializePage() {
    initNavigation();
    initShopping();
    initStoreFinder();
    initFAQ();
    initPageActions();
    initRevealAnimations();
}

initializePage();

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    closeMobileNav();
    closeShopDrawer();
    closeProductModal();
});
