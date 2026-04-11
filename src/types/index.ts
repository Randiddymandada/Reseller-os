export type ItemStatus = "In Stock" | "Listed" | "Sold" | "Shipped";
export type ItemCondition = "New" | "Like New" | "Good" | "Fair" | "Poor";
export type PaymentMethod = "Cash" | "PayPal" | "Venmo" | "Zelle" | "Card" | "Crypto" | "Other";
export type OrderStatus = "Pending" | "Paid" | "Packed" | "Shipped" | "Delivered" | "Cancelled";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  size: string;
  condition: ItemCondition;
  buyPrice: number;
  expectedSellPrice: number;
  quantity: number;
  source: string;
  dateBought: string;
  status: ItemStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  customerName: string;
  customerEmail?: string;
  itemId?: string;
  itemName: string;
  salePrice: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  date: string;
  sellerName: string;
  sellerEmail?: string;
  sellerPhone?: string;
  notes?: string;
  verified: boolean;
  orderId?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  itemId?: string;
  itemName: string;
  salePrice: number;
  shippingCost: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  date: string;
  trackingNumber?: string;
  receiptId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  businessName: string;
  logo?: string;
}

export interface AppState {
  inventory: InventoryItem[];
  receipts: Receipt[];
  customers: Customer[];
  orders: Order[];
  settings: SellerSettings;
}
