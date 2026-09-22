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

function fridayOfWeek(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const diff = ((5 - day) % 7 + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

const todayStr = new Date().toISOString().slice(0, 10);

const state = {
  invoiceNumber: "300625",
  date: todayStr,
  dueDate: fridayOfWeek(todayStr),
  currency: "USD",
  taxRate: 0,
  invoiceDiscountType: "percentage",
  invoiceDiscountValue: 0,
  applyDiscountToDiscounted: true,
  companyName: "Kanaste OÜ",
  companyLogo: "",
  registrationNo: "12121424",
  vatNo: "EE101467474",
  bankAccount: "",
  companyPhone: "5010310",
  issuedBy: "Andres Põld",
  fromEmail: "anpold@gmail.com",
  fromAddress: "Suve 19\n74613, Saue vald, Harjumaa",
  toName: "Kanaste OÜ",
  toEmail: "",
  toAddress:
    "Suve 19\n76413 , Aila küla, Saue vald\nHarjumaa, Eesti\n\nReg.nr 12121424\nKMKR nr:EE101467474\nCoop Pank: EE21 4204 2786 1080 4602",
  notes: "",
  footer: "",
  items: [
    { description: "Software Development", unit: "", quantity: 1, price: 1000, currency: "USD", discountType: "percentage", discountValue: 0 },
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
        <label>Unit</label>
        <input type="text" class="item-unit" data-idx="${idx}" placeholder="pcs, hrs..." value="${escapeAttr(item.unit)}" />
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
  document.querySelectorAll(".item-unit").forEach((input) => {
    input.addEventListener("input", (e) => {
      state.items[Number(e.target.dataset.idx)].unit = e.target.value;
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
  const taxRate = state.taxRate || 0;

  const companyName = state.companyName || "Company Name";
  el("previewCompanyNameHead").textContent = companyName;
  el("previewCompanyName").textContent = companyName;
  el("previewInvoiceNumber").textContent = state.invoiceNumber || "-";
  el("previewDateValue").textContent = formatDate(state.date);
  el("previewDueValue").textContent = formatDate(state.dueDate);
  el("previewIssuedBy").textContent = state.issuedBy && state.issuedBy.trim() ? state.issuedBy : "-";

  const logo = el("previewLogo");
  if (state.companyLogo) {
    logo.src = state.companyLogo;
    logo.classList.remove("hidden");
  } else {
    logo.classList.add("hidden");
  }

  el("previewTo").innerHTML = renderParty(state.toName, state.toEmail, state.toAddress);
  el("previewCompanyMeta").textContent = "YOUR COMPANY DETAILS";

  const body = el("previewItemsBody");
  body.innerHTML = state.items
    .map((it) => {
      return `<tr>
        <td>${escapeAttr(it.description) || "-"}</td>
        <td>${escapeAttr(it.unit) || "-"}</td>
        <td>${it.quantity}</td>
        <td>${fmtMoney(it.price, it.currency)}</td>
        <td class="vat-cell">${taxRate}%</td>
        <td>${fmtMoney(itemLineAmount(it), it.currency)}</td>
      </tr>`;
    })
    .join("");

  el("previewSubtotalLabel").textContent = `Subtotal (excl. VAT) (${taxRate}%):`;
  el("previewSubtotal").textContent = fmtMoney(subtotal, cur);
  el("previewTaxLabel").textContent = `VAT (${taxRate}%):`;
  el("previewTaxOut").textContent = fmtMoney(tax, cur);
  el("previewTotalOut").textContent = fmtMoney(total, cur);
  el("previewToPay").textContent = fmtMoney(total, cur);

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

  el("footAddress").textContent = [state.fromAddress, state.companyPhone && "Tel: " + state.companyPhone, state.fromEmail && "Email: " + state.fromEmail]
    .filter(Boolean)
    .join("\n");
  el("footReg").textContent = state.registrationNo && state.registrationNo.trim() ? "Registration No: " + state.registrationNo : "";
  el("footVat").textContent = state.vatNo && state.vatNo.trim() ? "VAT No: " + state.vatNo : "";
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
  el(id).value = state[key];
  el(id).addEventListener("input", (e) => {
    state[key] = transform ? transform(e.target.value) : e.target.value;
    renderTotalsOnly();
  });
}

function initFields() {
  bindField("invoiceNumber", "invoiceNumber");
  bindField("invoiceDate", "date");
  bindField("dueDate", "dueDate");
  bindField("taxRate", "taxRate");
  bindField("invoiceDiscountValue", "invoiceDiscountValue");
  bindField("companyName", "companyName");
  bindField("registrationNo", "registrationNo");
  bindField("vatNo", "vatNo");
  bindField("bankAccount", "bankAccount");
  bindField("companyPhone", "companyPhone");
  bindField("issuedBy", "issuedBy");
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
    state.items.push({ description: "", unit: "", quantity: 1, price: 0, currency: state.currency, discountType: "percentage", discountValue: 0 });
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
