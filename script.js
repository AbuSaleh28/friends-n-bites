const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector(".main-nav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isExpanded));
    navToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
    mainNav.classList.toggle("is-open", !isExpanded);
  });

  mainNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
      mainNav.classList.remove("is-open");
    }
  });
}

const currentPage = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".main-nav a[href]").forEach((link) => {
  if (link.getAttribute("href") === currentPage) {
    link.setAttribute("aria-current", "page");
  }
});

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const filterButtons = document.querySelectorAll(".filter-button");
const menuGroups = document.querySelectorAll("[data-menu-category]");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedCategory = button.dataset.filter;

    filterButtons.forEach((filterButton) => {
      const isSelected = filterButton === button;
      filterButton.classList.toggle("is-active", isSelected);
      filterButton.setAttribute("aria-pressed", String(isSelected));
    });

    menuGroups.forEach((group) => {
      const shouldShow = selectedCategory === "all" || group.dataset.menuCategory === selectedCategory;
      group.hidden = !shouldShow;
    });
  });

  const cartDialog = document.querySelector(".cart-dialog");
  const checkoutForm = document.querySelector("#checkout-form");

  if (cartDialog && checkoutForm) {
    const cart = new Map();
    const cartCount = document.querySelector("[data-cart-count]");
    const cartTotal = document.querySelector("[data-cart-total]");
    const checkoutTotal = document.querySelector("[data-checkout-total]");
    const cartItems = document.querySelector("[data-cart-items]");
    const cartEmpty = document.querySelector("[data-cart-empty]");
    const fulfilmentSelect = checkoutForm.elements.fulfilment;
    const addressField = checkoutForm.querySelector(".delivery-address");
    const addressInput = checkoutForm.elements.address;

    const formatPrice = (amount) =>
      `Rs. ${new Intl.NumberFormat("en-PK").format(amount)}`;

    const updateCart = () => {
      const entries = Array.from(cart.values());
      const itemCount = entries.reduce((total, item) => total + item.quantity, 0);
      const total = entries.reduce((sum, item) => sum + item.price * item.quantity, 0);

      cartCount.textContent = String(itemCount);
      cartTotal.textContent = formatPrice(total);
      checkoutTotal.textContent = formatPrice(total);
      cartEmpty.hidden = entries.length > 0;
      cartItems.replaceChildren();

      entries.forEach((item) => {
        const row = document.createElement("li");
        row.className = "cart-item";

        const details = document.createElement("span");
        details.textContent = `${item.name} × ${item.quantity}`;

        const price = document.createElement("strong");
        price.textContent = formatPrice(item.price * item.quantity);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "cart-remove";
        removeButton.textContent = "Remove";
        removeButton.setAttribute("aria-label", `Remove ${item.name} from cart`);
        removeButton.addEventListener("click", () => {
          cart.delete(item.name);
          updateCart();
        });

        row.append(details, price, removeButton);
        cartItems.append(row);
      });

      checkoutForm.querySelector(".checkout-submit").disabled = itemCount === 0;
    };

    document.querySelectorAll(".add-to-cart").forEach((button) => {
      button.addEventListener("click", () => {
        const product = button.closest("[data-product-name]");

        if (!product) {
          return;
        }

        const { productName, productPrice } = product.dataset;
        const existingItem = cart.get(productName);
        cart.set(productName, {
          name: productName,
          price: Number(productPrice),
          quantity: existingItem ? existingItem.quantity + 1 : 1,
        });
        updateCart();

        const previousText = button.textContent;
        button.textContent = "Added ✓";
        window.setTimeout(() => {
          button.textContent = previousText;
        }, 1000);
      });
    });

    document.querySelector("[data-open-cart]").addEventListener("click", () => {
      cartDialog.showModal();
    });

    document.querySelector("[data-close-cart]").addEventListener("click", () => {
      cartDialog.close();
    });

    cartDialog.addEventListener("click", (event) => {
      if (event.target === cartDialog) {
        cartDialog.close();
      }
    });

    fulfilmentSelect.addEventListener("change", () => {
      const needsAddress = fulfilmentSelect.value === "Delivery";
      addressField.hidden = !needsAddress;
      addressInput.required = needsAddress;
    });

    checkoutForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (cart.size === 0 || !checkoutForm.reportValidity()) {
        return;
      }

      const formData = new FormData(checkoutForm);
      const orderLines = Array.from(cart.values()).map(
        (item) => `• ${item.name} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`,
      );
      const orderTotal = Array.from(cart.values()).reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const fulfilment = formData.get("fulfilment");
      const message = [
        "*New order request — Friends N Bites*",
        "",
        ...orderLines,
        "",
        `*Total: ${formatPrice(orderTotal)}*`,
        `Name: ${formData.get("customerName")}`,
        `Mobile: ${formData.get("customerPhone")}`,
        `Order type: ${fulfilment}`,
        ...(fulfilment === "Delivery" ? [`Address: ${formData.get("address")}`] : []),
        `Preferred payment: ${formData.get("payment")}`,
        "",
        "Please confirm the order and share the correct payment account details. I have not paid yet.",
      ].join("\n");

      window.open(
        `https://wa.me/923165336343?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer",
      );
    });

    updateCart();
  }
});
