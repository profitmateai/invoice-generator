const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "$" },
  { code: "AUD", name: "Australian Dollar", symbol: "$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF " },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs " },
  { code: "SGD", name: "Singapore Dollar", symbol: "$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "$" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "AED", name: "UAE Dirham", symbol: "AED " },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
];

const state = {
  invoiceNumber: "INV-" + Math.floor(1000 + Math.random() * 9000),
  date: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  currency: "USD",
  taxRate: 0,
  invoiceDiscountType: "percentage",
  invoiceDiscountValue: 0,
  applyDiscountToDiscounted: true,
  companyName: "",
  companyLogo: "",
  companyDetails: "",
  fromName: "",
  fromEmail: "",
  fromAddress: "",
  toName: "",
  toEmail: "",
  toAddress: "",
  notes: "",
  footer: "",
  items: [
    { description: "", quantity: 1, price: 0, currency: "USD", discountType: "percentage", discountValue: 0 },
  ],
};

function el(id) { return document.getElementById(id); }

function currencySymbol(code) {
  const c = CURRENCIES.find((c) => c.code === code);
  return c ? c.symbol : code + " ";
}

function fmtMoney(amount, code) {
  const symbol = currencySymbol(code);
  const n = isFinite(amount) ? amount : 0;
  return symbol + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function populateCurrencySelects() {
  document.querySelectorAll(".currency-select").forEach((sel) => {
    sel.innerHTML = CURRENCIES.map((c) => `<option value="${c.code}">${c.code} - ${c.name}</option>`).join("");
  });
  el("invoiceCurrency").innerHTML = CURRENCIES.map((c) => `<option value="${c.code}">${c.code} - ${c.name}</option>`).join("");
}

function itemLineAmount(item) {
  const base = (Number(item.quantity) || 0) * (Number(item.price) || 0);
  let discount = 0;
  if (item.discountType === "percentage") {
    discount = base * ((Number(item.discountValue) || 0) / 100);
  } else {
    discount = Number(item.discountValue) || 0;
  }
  return Math.max(0, base - discount);
}

function computeTotals() {
  const subtotal = state.items.reduce((sum, it) => sum + itemLineAmount(it), 0);

  let invoiceDiscount = 0;
  if (state.invoiceDiscountType === "percentage") {
    invoiceDiscount = subtotal * ((Number(state.invoiceDiscountValue) || 0) / 100);
  } else {
    invoiceDiscount = Number(state.invoiceDiscountValue) || 0;
  }
  invoiceDiscount = Math.min(invoiceDiscount, subtotal);

  const afterDiscount = subtotal - invoiceDiscount;
  const tax = afterDiscount * ((Number(state.taxRate) || 0) / 100);
  const total = afterDiscount + tax;

  return { subtotal, invoiceDiscount, afterDiscount, tax, total };
}

function renderItems() {
  const list = el("itemsList");
  list.innerHTML = "";
  state.items.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `
      ${state.items.length > 1 ? `<button type="button" class="remove-item" data-idx="${idx}" title="Remove item">×</button>` : ""}
      <div class="field-inline">
        <label>Description</label>
        <input type="text" class="item-description" data-idx="${idx}" value="${escapeAttr(item.description)}" />
      </div>
      <div class="field-inline">
        <label>Quantity</label>
        <input type="number" class="item-quantity" data-idx="${idx}" min="0" step="1" value="${item.quantity}" />
      </div>
      <div class="field-inline">
        <label>Price</label>
        <input type="number" class="item-price" data-idx="${idx}" min="0" step="0.01" value="${item.price}" />
      </div>
      <div class="field-inline">
        <label>Currency</label>
        <select class="currency-select item-currency" data-idx="${idx}"></select>
      </div>
      <div class="field-inline" style="grid-column: 1 / span 2;">
        <label>Item Discount</label>
        <div class="item-discount-row">
          <label class="radio"><input type="radio" name="itemDiscountType${idx}" class="item-discount-type" data-idx="${idx}" value="percentage" ${item.discountType === "percentage" ? "checked" : ""}/> Percentage (%)</label>
          <label class="radio"><input type="radio" name="itemDiscountType${idx}" class="item-discount-type" data-idx="${idx}" value="amount" ${item.discountType === "amount" ? "checked" : ""}/> Amount</label>
        </div>
        <input type="number" class="item-discount-value" data-idx="${idx}" min="0" step="0.01" value="${item.discountValue}" />
      </div>
      <div class="item-summary">
        <span>${item.quantity} × ${fmtMoney(item.price, item.currency)} = ${fmtMoney((Number(item.quantity)||0) * (Number(item.price)||0), item.currency)}</span>
        <span>${fmtMoney(itemLineAmount(item), item.currency)}</span>
      </div>
    `;
    list.appendChild(row);
    row.querySelector(".item-currency").value = item.currency;
  });

  list.querySelectorAll(".currency-select").forEach((sel) => {
    sel.innerHTML = CURRENCIES.map((c) => `<option value="${c.code}">${c.code} - ${c.name}</option>`).join("");
    const idx = Number(sel.dataset.idx);
    sel.value = state.items[idx].currency;
  });

  attachItemListeners();
}

function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function attachItemListeners() {
  document.querySelectorAll(".item-description").forEach((input) => {
    input.addEventListener("input", (e) => {
      state.items[Number(e.target.dataset.idx)].description = e.target.value;
      renderTotalsOnly();
    });
  });
  document.querySelectorAll(".item-quantity").forEach((input) => {
    input.addEventListener("input", (e) => {
      state.items[Number(e.target.dataset.idx)].quantity = e.target.value;
      renderItems();
      renderTotalsOnly();
    });
  });
  document.querySelectorAll(".item-price").forEach((input) => {
    input.addEventListener("input", (e) => {
      state.items[Number(e.target.dataset.idx)].price = e.target.value;
      renderItems();
      renderTotalsOnly();
    });
  });
  document.querySelectorAll(".item-currency").forEach((sel) => {
    sel.addEventListener("change", (e) => {
      state.items[Number(e.target.dataset.idx)].currency = e.target.value;
      renderItems();
      renderTotalsOnly();
    });
  });
  document.querySelectorAll(".item-discount-type").forEach((input) => {
    input.addEventListener("change", (e) => {
      state.items[Number(e.target.dataset.idx)].discountType = e.target.value;
      renderItems();
      renderTotalsOnly();
    });
  });
  document.querySelectorAll(".item-discount-value").forEach((input) => {
    input.addEventListener("input", (e) => {
      state.items[Number(e.target.dataset.idx)].discountValue = e.target.value;
      renderItems();
      renderTotalsOnly();
    });
  });
  document.querySelectorAll(".remove-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = Number(e.currentTarget.dataset.idx);
      state.items.splice(idx, 1);
      renderItems();
      renderTotalsOnly();
    });
  });
}

function renderTotalsOnly() {
  const { subtotal, invoiceDiscount, tax, total } = computeTotals();
  const primaryCurrency = state.currency;
  el("subtotalOut").textContent = fmtMoney(subtotal, primaryCurrency);
  el("taxLabel").textContent = `Tax (${state.taxRate || 0}%):`;
  el("taxOut").textContent = fmtMoney(tax, primaryCurrency);
  el("totalOut").textContent = fmtMoney(total, primaryCurrency);

  const discRow = el("invoiceDiscountRow");
  if (invoiceDiscount > 0) {
    discRow.style.display = "flex";
    el("invoiceDiscountLabel").textContent =
      state.invoiceDiscountType === "percentage" ? `Discount (${state.invoiceDiscountValue || 0}%):` : "Discount:";
    el("invoiceDiscountOut").textContent = "-" + fmtMoney(invoiceDiscount, primaryCurrency);
  } else {
    discRow.style.display = "none";
  }

  renderPreview();
}

function renderPreview() {
  const { subtotal, invoiceDiscount, tax, total } = computeTotals();
  const cur = state.currency;

  el("previewCompanyName").textContent = state.companyName || "";
  el("previewInvoiceNumber").textContent = "#" + (state.invoiceNumber || "");
  el("previewDateLabel").textContent = "Date: " + formatDate(state.date);
  el("previewDueDateLabel").textContent = "Due Date: " + formatDate(state.dueDate);

  const logo = el("previewLogo");
  if (state.companyLogo) {
    logo.src = state.companyLogo;
    logo.classList.remove("hidden");
  } else {
    logo.classList.add("hidden");
  }

  el("previewFrom").innerHTML = renderParty(state.fromName, state.fromEmail, state.fromAddress);
  el("previewTo").innerHTML = renderParty(state.toName, state.toEmail, state.toAddress);

  const body = el("previewItemsBody");
  body.innerHTML = state.items
    .map((it) => {
      const discountLabel =
        Number(it.discountValue) > 0
          ? it.discountType === "percentage"
            ? `${it.discountValue}%`
            : fmtMoney(it.discountValue, it.currency)
          : "-";
      return `<tr>
        <td>${escapeAttr(it.description) || "-"}</td>
        <td>${it.quantity}</td>
        <td>${fmtMoney(it.price, it.currency)}</td>
        <td>${discountLabel}</td>
        <td>${fmtMoney(itemLineAmount(it), it.currency)}</td>
      </tr>`;
    })
    .join("");

  el("previewSubtotal").textContent = fmtMoney(subtotal, cur);
  el("previewTaxLabel").textContent = `Tax (${state.taxRate || 0}%):`;
  el("previewTaxOut").textContent = fmtMoney(tax, cur);
  el("previewTotalOut").textContent = fmtMoney(total, cur);

  const pDiscRow = el("previewDiscountRow");
  if (invoiceDiscount > 0) {
    pDiscRow.style.display = "flex";
    el("previewDiscountLabel").textContent =
      state.invoiceDiscountType === "percentage" ? `Discount (${state.invoiceDiscountValue || 0}%):` : "Discount:";
    el("previewDiscountOut").textContent = "-" + fmtMoney(invoiceDiscount, cur);
  } else {
    pDiscRow.style.display = "none";
  }

  const notesBlock = el("previewNotesBlock");
  if (state.notes && state.notes.trim()) {
    notesBlock.classList.remove("hidden");
    el("previewNotes").textContent = state.notes;
  } else {
    notesBlock.classList.add("hidden");
  }

  el("previewFooterBlock").textContent = state.footer && state.footer.trim() ? state.footer : "Thank you for your business!";
}

function renderParty(name, email, address) {
  const lines = [name, email, address].filter((v) => v && v.trim());
  if (!lines.length) return `<div class="muted">-</div>`;
  return lines.map((l) => `<div>${escapeAttr(l)}</div>`).join("");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function bindField(id, key, transform) {
  el(id).addEventListener("input", (e) => {
    state[key] = transform ? transform(e.target.value) : e.target.value;
    renderTotalsOnly();
  });
}

function initFields() {
  el("invoiceNumber").value = state.invoiceNumber;
  el("invoiceDate").value = state.date;
  el("dueDate").value = state.dueDate;
  el("taxRate").value = state.taxRate;
  el("invoiceDiscountValue").value = state.invoiceDiscountValue;

  bindField("invoiceNumber", "invoiceNumber");
  bindField("invoiceDate", "date");
  bindField("dueDate", "dueDate");
  bindField("taxRate", "taxRate");
  bindField("invoiceDiscountValue", "invoiceDiscountValue");
  bindField("companyName", "companyName");
  bindField("companyDetails", "companyDetails");
  bindField("fromName", "fromName");
  bindField("fromEmail", "fromEmail");
  bindField("fromAddress", "fromAddress");
  bindField("toName", "toName");
  bindField("toEmail", "toEmail");
  bindField("toAddress", "toAddress");
  bindField("notes", "notes");
  bindField("footer", "footer");

  el("invoiceCurrency").addEventListener("change", (e) => {
    state.currency = e.target.value;
    renderTotalsOnly();
  });

  document.querySelectorAll('input[name="invoiceDiscountType"]').forEach((r) => {
    r.addEventListener("change", (e) => {
      if (e.target.checked) {
        state.invoiceDiscountType = e.target.value;
        renderTotalsOnly();
      }
    });
  });

  el("applyDiscountToDiscounted").addEventListener("change", (e) => {
    state.applyDiscountToDiscounted = e.target.checked;
  });

  el("companyLogo").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.companyLogo = reader.result;
      renderPreview();
    };
    reader.readAsDataURL(file);
  });

  el("addItemBtn").addEventListener("click", () => {
    state.items.push({ description: "", quantity: 1, price: 0, currency: state.currency, discountType: "percentage", discountValue: 0 });
    renderItems();
    renderTotalsOnly();
  });

  el("downloadPdfBtn").addEventListener("click", () => {
    window.print();
  });
}

function initTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      el("editPanel").classList.toggle("hidden", target !== "edit");
      el("previewPanel").classList.toggle("hidden", target !== "preview");
      if (target === "preview") renderPreview();
    });
  });
}

function applyTheme(theme) {
  const root = document.documentElement;
  let resolved = theme;
  if (theme === "system") {
    resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  root.setAttribute("data-theme", resolved);
  localStorage.setItem("theme", theme);
}

function initTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  applyTheme(saved);

  el("themeBtn").addEventListener("click", () => {
    el("themeDropdown").classList.toggle("hidden");
  });

  document.querySelectorAll("#themeDropdown button").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyTheme(btn.dataset.theme);
      el("themeDropdown").classList.add("hidden");
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".theme-menu")) {
      el("themeDropdown").classList.add("hidden");
    }
  });
}

function init() {
  populateCurrencySelects();
  el("invoiceCurrency").value = state.currency;
  initFields();
  initTabs();
  initTheme();
  renderItems();
  renderTotalsOnly();
}

document.addEventListener("DOMContentLoaded", init);
