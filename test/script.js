// Données des produits (généré automatiquement)
const products = [
  {
    id: 1,
    name: "Tomates",
    price: 3.5,
    icon: "🍅",
    unit: "boite",
    available: true,
  },
  {
    id: 2,
    name: "Carottes",
    price: 2.2,
    icon: "🥕",
    unit: "kg",
    available: true,
  },
  {
    id: 3,
    name: "Courgettes",
    price: 2.8,
    icon: "🥒",
    unit: "kg",
    available: true,
  },
  {
    id: 4,
    name: "Salade",
    price: 1.5,
    icon: "🥬",
    unit: "pièce",
    available: true,
  },
  {
    id: 5,
    name: "Pommes de terre",
    price: 1.8,
    icon: "🥔",
    unit: "kg",
    available: true,
  },
  {
    id: 6,
    name: "Aubergines",
    price: 1.2,
    icon: "🍆",
    unit: "kg",
    available: false,
  },
  {
    id: 7,
    name: "Épinards",
    price: 3,
    icon: "🌿",
    unit: "kg",
    available: false,
  },
  {
    id: 8,
    name: "Brocolis",
    price: 3.2,
    icon: "🥦",
    unit: "kg",
    available: true,
  },
  {
    id: 9,
    name: "Oeuf",
    price: 2,
    icon: "🥚",
    unit: "barquette",
    available: true,
  },
];

let cart = [];

// Affichage des produits
function displayProducts() {
  const grid = document.getElementById("productsGrid");
  grid.innerHTML = "";

  products.forEach((product) => {
    if (product.available) {
      const productCard = document.createElement("div");
      productCard.className = "product-card fade-in";
      productCard.innerHTML = `
                        <span class="product-icon">${product.icon}</span>
                        <div class="product-name">${product.name}</div>
                        <div class="product-price">${product.price.toFixed(
                          2
                        )}€ / ${product.unit}</div>
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="decreaseQuantity(${
                              product.id
                            })">-</button>
                            <input type="number" class="quantity-input" id="qty-${
                              product.id
                            }" value="1" min="1">
                            <button class="quantity-btn" onclick="increaseQuantity(${
                              product.id
                            })">+</button>
                        </div>
                        <button class="add-to-cart" onclick="addToCart(${
                          product.id
                        })">
                            Ajouter au panier
                        </button>
                    `;
      grid.appendChild(productCard);
    }
  });
}

// Gestion des quantités
function increaseQuantity(productId) {
  const input = document.getElementById(`qty-${productId}`);
  input.value = parseInt(input.value) + 1;
}

function decreaseQuantity(productId) {
  const input = document.getElementById(`qty-${productId}`);
  if (parseInt(input.value) > 1) {
    input.value = parseInt(input.value) - 1;
  }
}

// Ajout au panier
function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  const quantity = parseInt(document.getElementById(`qty-${productId}`).value);

  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: productId,
      name: product.name,
      price: product.price,
      icon: product.icon,
      unit: product.unit,
      quantity: quantity,
    });
  }

  updateCartDisplay();
  showToast(`${product.name} ajouté au panier !`);
}

// Mise à jour de l'affichage du panier
function updateCartDisplay() {
  const cartCount = document.getElementById("cartCount");
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  cartCount.textContent = totalItems;

  cartItems.innerHTML = "";
  cart.forEach((item) => {
    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    cartItem.innerHTML = `
                    <div>
                        <span>${item.icon} ${item.name}</span><br>
                        <small>${item.price.toFixed(2)}€ / ${item.unit}</small>
                    </div>
                    <div>
                        <span>${item.quantity} × ${item.price.toFixed(
      2
    )}€</span>
                        <button onclick="removeFromCart(${
                          item.id
                        })" style="margin-left: 10px; background: #e53e3e; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">×</button>
                    </div>
                `;
    cartItems.appendChild(cartItem);
  });

  cartTotal.textContent = `Total: ${totalPrice.toFixed(2)}€`;
}

// Suppression du panier
function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  updateCartDisplay();
}

// Affichage/masquage du panier
function toggleCart() {
  const sidebar = document.getElementById("cartSidebar");
  sidebar.classList.toggle("open");
}

// Commande
function checkout() {
  if (cart.length === 0) {
    showToast("Votre panier est vide !");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderSummary = cart
    .map((item) => `${item.name}: ${item.quantity} ${item.unit}`)
    .join("\n");

  alert(
    `Commande confirmée !\n\n${orderSummary}\n\nTotal: ${total.toFixed(
      2
    )}€\n\nNous vous contacterons bientôt pour la livraison.`
  );

  cart = [];
  updateCartDisplay();
  toggleCart();
}

// Toast notification
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Animations au scroll
function handleScroll() {
  const elements = document.querySelectorAll(".fade-in");
  elements.forEach((element) => {
    const elementTop = element.getBoundingClientRect().top;
    const elementVisible = 150;

    if (elementTop < window.innerHeight - elementVisible) {
      element.classList.add("visible");
    }
  });
}

// Scroll fluide
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Initialisation
document.addEventListener("DOMContentLoaded", function () {
  displayProducts();
  updateCartDisplay();
  handleScroll();

  // Ajouter les animations au scroll
  window.addEventListener("scroll", handleScroll);

  // Animation d'entrée pour les éléments
  setTimeout(() => {
    document.querySelectorAll(".fade-in").forEach((el, index) => {
      setTimeout(() => {
        el.classList.add("visible");
      }, index * 200);
    });
  }, 500);
});
