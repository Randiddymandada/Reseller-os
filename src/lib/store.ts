import { v4 as uuidv4 } from "uuid";
import type { AppState, InventoryItem, Receipt, SellerSettings, Customer, Order } from "@/types";

// ─── Demo seed data (shown ONLY in demo/unauthenticated mode) ─────────────────
const DEMO_STORAGE_KEY = "reseller_os_demo_data";

const demoSettings: SellerSettings = {
  name: "Jordan Reeves",
  email: "jordan@resellerOS.io",
  phone: "(619) 555-0142",
  address: "San Diego, CA",
  businessName: "ResellerOS Demo Store",
};

const inv1 = uuidv4(), inv2 = uuidv4(), inv3 = uuidv4(), inv4 = uuidv4();
const inv5 = uuidv4(), inv6 = uuidv4(), inv7 = uuidv4(), inv8 = uuidv4();
const cust1 = uuidv4(), cust2 = uuidv4(), cust3 = uuidv4();
const rec1 = uuidv4(), rec2 = uuidv4();
const ord1 = uuidv4(), ord2 = uuidv4(), ord3 = uuidv4();

function buildDemoState(): AppState {
  return {
    settings: demoSettings,
    inventory: [
      { id: inv1, name: "Nike Air Jordan 4 Retro 'Military Blue'", category: "Sneakers", size: "10.5", condition: "New", buyPrice: 210, expectedSellPrice: 385, quantity: 1, source: "SNKRS App", dateBought: "2024-11-15", status: "Listed", notes: "DS, original box, receipt included", createdAt: new Date("2024-11-15").toISOString(), updatedAt: new Date("2024-11-15").toISOString() },
      { id: inv2, name: "Supreme Box Logo Hoodie FW24", category: "Streetwear", size: "L", condition: "New", buyPrice: 168, expectedSellPrice: 420, quantity: 1, source: "Supreme Drop", dateBought: "2024-11-08", status: "In Stock", createdAt: new Date("2024-11-08").toISOString(), updatedAt: new Date("2024-11-08").toISOString() },
      { id: inv3, name: "PlayStation 5 Slim Bundle", category: "Electronics", size: "N/A", condition: "New", buyPrice: 499, expectedSellPrice: 580, quantity: 2, source: "Best Buy", dateBought: "2024-11-20", status: "Listed", createdAt: new Date("2024-11-20").toISOString(), updatedAt: new Date("2024-11-20").toISOString() },
      { id: inv4, name: "Yeezy Boost 350 V2 'Zebra'", category: "Sneakers", size: "9", condition: "Like New", buyPrice: 175, expectedSellPrice: 310, quantity: 1, source: "StockX", dateBought: "2024-10-30", status: "Sold", createdAt: new Date("2024-10-30").toISOString(), updatedAt: new Date("2024-11-12").toISOString() },
      { id: inv5, name: "Louis Vuitton Neverfull MM", category: "Luxury Bags", size: "One Size", condition: "Good", buyPrice: 890, expectedSellPrice: 1350, quantity: 1, source: "eBay", dateBought: "2024-11-01", status: "Listed", notes: "Dust bag included, minor wear on handles", createdAt: new Date("2024-11-01").toISOString(), updatedAt: new Date("2024-11-01").toISOString() },
      { id: inv6, name: "Apple AirPods Pro 2nd Gen", category: "Electronics", size: "N/A", condition: "New", buyPrice: 189, expectedSellPrice: 230, quantity: 3, source: "Costco", dateBought: "2024-11-18", status: "In Stock", createdAt: new Date("2024-11-18").toISOString(), updatedAt: new Date("2024-11-18").toISOString() },
      { id: inv7, name: "New Balance 550 'White Green'", category: "Sneakers", size: "11", condition: "New", buyPrice: 110, expectedSellPrice: 190, quantity: 1, source: "New Balance Website", dateBought: "2024-11-05", status: "Shipped", createdAt: new Date("2024-11-05").toISOString(), updatedAt: new Date("2024-11-22").toISOString() },
      { id: inv8, name: "Bape A Bathing Ape Shark Hoodie", category: "Streetwear", size: "M", condition: "Like New", buyPrice: 260, expectedSellPrice: 480, quantity: 1, source: "Grailed", dateBought: "2024-10-25", status: "Sold", createdAt: new Date("2024-10-25").toISOString(), updatedAt: new Date("2024-11-10").toISOString() },
    ],
    customers: [
      { id: cust1, name: "Marcus T.", email: "marcus@email.com", phone: "(310) 555-0198", notes: "Repeat buyer, prefers PayPal.", createdAt: new Date("2024-10-01").toISOString(), updatedAt: new Date("2024-11-12").toISOString() },
      { id: cust2, name: "Aisha K.",  email: "aisha.k@gmail.com", phone: "(415) 555-0234", notes: "Streetwear collector.", createdAt: new Date("2024-10-15").toISOString(), updatedAt: new Date("2024-11-10").toISOString() },
      { id: cust3, name: "Devon R.",  email: "devon.r@outlook.com", phone: "(619) 555-0311", notes: "Local pickup preferred.", createdAt: new Date("2024-11-01").toISOString(), updatedAt: new Date("2024-11-20").toISOString() },
    ],
    receipts: [
      { id: rec1, receiptNumber: "ROS-2024-0001", customerName: "Marcus T.", customerEmail: "marcus@email.com", itemId: inv4, itemName: "Yeezy Boost 350 V2 'Zebra'", salePrice: 310, shippingCost: 12, tax: 0, total: 322, paymentMethod: "PayPal", date: "2024-11-12", sellerName: "Jordan Reeves", sellerEmail: "jordan@resellerOS.io", sellerPhone: "(619) 555-0142", verified: true, orderId: ord1, createdAt: new Date("2024-11-12").toISOString() },
      { id: rec2, receiptNumber: "ROS-2024-0002", customerName: "Aisha K.", customerEmail: "aisha.k@gmail.com", itemId: inv8, itemName: "Bape A Bathing Ape Shark Hoodie", salePrice: 480, shippingCost: 18, tax: 0, total: 498, paymentMethod: "Venmo", date: "2024-11-10", sellerName: "Jordan Reeves", sellerEmail: "jordan@resellerOS.io", verified: true, orderId: ord2, createdAt: new Date("2024-11-10").toISOString() },
    ],
    orders: [
      { id: ord1, orderNumber: "ORD-2024-0001", customerId: cust1, customerName: "Marcus T.", itemId: inv4, itemName: "Yeezy Boost 350 V2 'Zebra'", salePrice: 310, shippingCost: 12, paymentMethod: "PayPal", status: "Delivered", date: "2024-11-12", trackingNumber: "9400111899223456789012", receiptId: rec1, createdAt: new Date("2024-11-12").toISOString(), updatedAt: new Date("2024-11-15").toISOString() },
      { id: ord2, orderNumber: "ORD-2024-0002", customerId: cust2, customerName: "Aisha K.", itemId: inv8, itemName: "Bape A Bathing Ape Shark Hoodie", salePrice: 480, shippingCost: 18, paymentMethod: "Venmo", status: "Delivered", date: "2024-11-10", receiptId: rec2, createdAt: new Date("2024-11-10").toISOString(), updatedAt: new Date("2024-11-14").toISOString() },
      { id: ord3, orderNumber: "ORD-2024-0003", customerId: cust3, customerName: "Devon R.", itemId: inv7, itemName: "New Balance 550 'White Green'", salePrice: 190, shippingCost: 10, paymentMethod: "Zelle", status: "Shipped", date: "2024-11-22", trackingNumber: "9400111899223456789055", createdAt: new Date("2024-11-22").toISOString(), updatedAt: new Date("2024-11-22").toISOString() },
    ],
  };
}

// ─── Per-user localStorage key (never shares data between users) ──────────────
function getUserStorageKey(userId: string): string {
  return `reseller_os_user_${userId}`;
}

/** Empty state for a brand-new real user — no demo data, no Jordan */
function buildEmptyState(userEmail?: string, userName?: string): AppState {
  return {
    inventory: [],
    receipts: [],
    customers: [],
    orders: [],
    settings: {
      name: userName || "",
      email: userEmail || "",
      phone: "",
      address: "",
      businessName: "",
    },
  };
}

// ─── Demo (unauthenticated) storage ───────────────────────────────────────────
export function loadState(): AppState {
  if (typeof window === "undefined") return buildDemoState();
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      const s = buildDemoState();
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.customers) parsed.customers = buildDemoState().customers;
    if (!parsed.orders)    parsed.orders    = buildDemoState().orders;
    return parsed;
  } catch {
    return buildDemoState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
}

export function getState(): AppState { return loadState(); }

export function updateState(updater: (state: AppState) => AppState): AppState {
  const next = updater(loadState());
  saveState(next);
  return next;
}

// ─── Authenticated user storage (isolated per userId) ─────────────────────────
export function loadUserState(userId: string, userEmail?: string, userName?: string): AppState {
  if (typeof window === "undefined") return buildEmptyState(userEmail, userName);
  try {
    const key = getUserStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      // First login for this user: start with empty state, not demo data
      const s = buildEmptyState(userEmail, userName);
      localStorage.setItem(key, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.customers) parsed.customers = [];
    if (!parsed.orders)    parsed.orders    = [];
    return parsed;
  } catch {
    return buildEmptyState(userEmail, userName);
  }
}

export function saveUserState(userId: string, state: AppState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getUserStorageKey(userId), JSON.stringify(state));
}

export function clearUserState(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getUserStorageKey(userId));
}

function updateUserState(userId: string, updater: (state: AppState) => AppState, userEmail?: string): AppState {
  const next = updater(loadUserState(userId, userEmail));
  saveUserState(userId, next);
  return next;
}

// ─── Inventory (demo) ─────────────────────────────────────────────────────────
export function addInventoryItem(item: Omit<InventoryItem, "id"|"createdAt"|"updatedAt">): InventoryItem {
  const now = new Date().toISOString();
  const newItem: InventoryItem = { ...item, id: uuidv4(), createdAt: now, updatedAt: now };
  updateState(s => ({ ...s, inventory: [newItem, ...s.inventory] }));
  return newItem;
}
export function updateInventoryItem(id: string, updates: Partial<InventoryItem>): void {
  updateState(s => ({ ...s, inventory: s.inventory.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i) }));
}
export function deleteInventoryItem(id: string): void {
  updateState(s => ({ ...s, inventory: s.inventory.filter(i => i.id !== id) }));
}

// ─── Inventory (authenticated user) ──────────────────────────────────────────
export function addUserInventoryItem(userId: string, item: Omit<InventoryItem, "id"|"createdAt"|"updatedAt">): InventoryItem {
  const now = new Date().toISOString();
  const newItem: InventoryItem = { ...item, id: uuidv4(), createdAt: now, updatedAt: now };
  updateUserState(userId, s => ({ ...s, inventory: [newItem, ...s.inventory] }));
  return newItem;
}
export function updateUserInventoryItem(userId: string, id: string, updates: Partial<InventoryItem>): void {
  updateUserState(userId, s => ({ ...s, inventory: s.inventory.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i) }));
}
export function deleteUserInventoryItem(userId: string, id: string): void {
  updateUserState(userId, s => ({ ...s, inventory: s.inventory.filter(i => i.id !== id) }));
}

// ─── Receipts (demo) ──────────────────────────────────────────────────────────
export function addReceipt(receipt: Omit<Receipt, "id"|"createdAt"|"receiptNumber">): Receipt {
  const state = loadState();
  const count = state.receipts.length + 1;
  const newReceipt: Receipt = { ...receipt, id: uuidv4(), receiptNumber: `ROS-${new Date().getFullYear()}-${String(count).padStart(4,"0")}`, createdAt: new Date().toISOString() };
  updateState(s => ({ ...s, receipts: [newReceipt, ...s.receipts] }));
  return newReceipt;
}
export function getReceiptById(id: string): Receipt | undefined {
  return loadState().receipts.find(r => r.id === id || r.receiptNumber === id);
}

// ─── Receipts (authenticated user) ───────────────────────────────────────────
export function addUserReceipt(userId: string, receipt: Omit<Receipt, "id"|"createdAt"|"receiptNumber">): Receipt {
  const state = loadUserState(userId);
  const count = state.receipts.length + 1;
  const newReceipt: Receipt = { ...receipt, id: uuidv4(), receiptNumber: `ROS-${new Date().getFullYear()}-${String(count).padStart(4,"0")}`, createdAt: new Date().toISOString() };
  updateUserState(userId, s => ({ ...s, receipts: [newReceipt, ...s.receipts] }));
  return newReceipt;
}
export function getUserReceiptById(userId: string, id: string): Receipt | undefined {
  return loadUserState(userId).receipts.find(r => r.id === id || r.receiptNumber === id);
}

// ─── Customers (demo) ─────────────────────────────────────────────────────────
export function addCustomer(customer: Omit<Customer, "id"|"createdAt"|"updatedAt">): Customer {
  const now = new Date().toISOString();
  const c: Customer = { ...customer, id: uuidv4(), createdAt: now, updatedAt: now };
  updateState(s => ({ ...s, customers: [c, ...s.customers] }));
  return c;
}
export function updateCustomer(id: string, updates: Partial<Customer>): void {
  updateState(s => ({ ...s, customers: s.customers.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c) }));
}
export function deleteCustomer(id: string): void {
  updateState(s => ({ ...s, customers: s.customers.filter(c => c.id !== id) }));
}

// ─── Customers (authenticated user) ──────────────────────────────────────────
export function addUserCustomer(userId: string, customer: Omit<Customer, "id"|"createdAt"|"updatedAt">): Customer {
  const now = new Date().toISOString();
  const c: Customer = { ...customer, id: uuidv4(), createdAt: now, updatedAt: now };
  updateUserState(userId, s => ({ ...s, customers: [c, ...s.customers] }));
  return c;
}
export function updateUserCustomer(userId: string, id: string, updates: Partial<Customer>): void {
  updateUserState(userId, s => ({ ...s, customers: s.customers.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c) }));
}
export function deleteUserCustomer(userId: string, id: string): void {
  updateUserState(userId, s => ({ ...s, customers: s.customers.filter(c => c.id !== id) }));
}

// ─── Orders (demo) ────────────────────────────────────────────────────────────
export function addOrder(order: Omit<Order, "id"|"createdAt"|"updatedAt"|"orderNumber">): Order {
  const state = loadState();
  const count = state.orders.length + 1;
  const now = new Date().toISOString();
  const o: Order = { ...order, id: uuidv4(), orderNumber: `ORD-${new Date().getFullYear()}-${String(count).padStart(4,"0")}`, createdAt: now, updatedAt: now };
  updateState(s => ({ ...s, orders: [o, ...s.orders] }));
  return o;
}
export function updateOrder(id: string, updates: Partial<Order>): void {
  updateState(s => ({ ...s, orders: s.orders.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o) }));
}
export function deleteOrder(id: string): void {
  updateState(s => ({ ...s, orders: s.orders.filter(o => o.id !== id) }));
}

// ─── Orders (authenticated user) ─────────────────────────────────────────────
export function addUserOrder(userId: string, order: Omit<Order, "id"|"createdAt"|"updatedAt"|"orderNumber">): Order {
  const state = loadUserState(userId);
  const count = state.orders.length + 1;
  const now = new Date().toISOString();
  const o: Order = { ...order, id: uuidv4(), orderNumber: `ORD-${new Date().getFullYear()}-${String(count).padStart(4,"0")}`, createdAt: now, updatedAt: now };
  updateUserState(userId, s => ({ ...s, orders: [o, ...s.orders] }));
  return o;
}
export function updateUserOrder(userId: string, id: string, updates: Partial<Order>): void {
  updateUserState(userId, s => ({ ...s, orders: s.orders.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o) }));
}
export function deleteUserOrder(userId: string, id: string): void {
  updateUserState(userId, s => ({ ...s, orders: s.orders.filter(o => o.id !== id) }));
}

// ─── Settings (authenticated user) ───────────────────────────────────────────
export function updateSettings(updates: Partial<SellerSettings>): void {
  updateState(s => ({ ...s, settings: { ...s.settings, ...updates } }));
}
export function updateUserSettings(userId: string, updates: Partial<SellerSettings>): void {
  updateUserState(userId, s => ({ ...s, settings: { ...s.settings, ...updates } }));
}

// ─── CSV export ───────────────────────────────────────────────────────────────
export function exportInventoryCSV(inventory?: InventoryItem[]): string {
  const items = inventory || loadState().inventory;
  const headers = ["Name","Category","Size","Condition","Buy Price","Expected Sell","Quantity","Source","Date Bought","Status"];
  const rows = items.map(i => [i.name,i.category,i.size,i.condition,i.buyPrice,i.expectedSellPrice,i.quantity,i.source,i.dateBought,i.status]);
  return [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
}
