"use client";
/**
 * useAppData — unified data hook for all pages
 *
 * - Authenticated users: reads/writes to per-user localStorage key (no demo data ever)
 * - Demo mode (no Supabase): reads/writes the demo localStorage key with seed data
 *
 * Returns the same AppState shape and CRUD functions regardless of auth mode,
 * so pages don't need to know which storage backend is being used.
 */
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  loadState, loadUserState,
  saveUserState,
  addInventoryItem, updateInventoryItem, deleteInventoryItem,
  addUserInventoryItem, updateUserInventoryItem, deleteUserInventoryItem,
  addReceipt, addUserReceipt,
  getReceiptById, getUserReceiptById,
  addCustomer, updateCustomer, deleteCustomer,
  addUserCustomer, updateUserCustomer, deleteUserCustomer,
  addOrder, updateOrder, deleteOrder,
  addUserOrder, updateUserOrder, deleteUserOrder,
  updateSettings, updateUserSettings,
  exportInventoryCSV,
} from "@/lib/store";
import type { AppState, InventoryItem, Receipt, Customer, Order, SellerSettings } from "@/types";

export function useAppData() {
  const { user, isDemo } = useAuth();
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine if we're using user-isolated storage or demo storage
  const isUserMode = !isDemo && !!user;
  const userId = user?.id ?? "";
  const userEmail = user?.email ?? "";
  const userName = user?.user_metadata?.full_name ?? "";

  const refresh = useCallback(() => {
    if (isUserMode) {
      setState(loadUserState(userId, userEmail, userName));
    } else {
      setState(loadState());
    }
    setLoading(false);
  }, [isUserMode, userId, userEmail, userName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Inventory ──────────────────────────────────────────────────────────────
  function doAddInventoryItem(item: Omit<InventoryItem, "id"|"createdAt"|"updatedAt">): InventoryItem {
    const result = isUserMode
      ? addUserInventoryItem(userId, item)
      : addInventoryItem(item);
    refresh();
    return result;
  }

  function doUpdateInventoryItem(id: string, updates: Partial<InventoryItem>): void {
    if (isUserMode) updateUserInventoryItem(userId, id, updates);
    else            updateInventoryItem(id, updates);
    refresh();
  }

  function doDeleteInventoryItem(id: string): void {
    if (isUserMode) deleteUserInventoryItem(userId, id);
    else            deleteInventoryItem(id);
    refresh();
  }

  // ── Receipts ───────────────────────────────────────────────────────────────
  function doAddReceipt(receipt: Omit<Receipt, "id"|"createdAt"|"receiptNumber">): Receipt {
    const result = isUserMode
      ? addUserReceipt(userId, receipt)
      : addReceipt(receipt);
    refresh();
    return result;
  }

  function doGetReceiptById(id: string): Receipt | undefined {
    return isUserMode
      ? getUserReceiptById(userId, id)
      : getReceiptById(id);
  }

  // ── Customers ──────────────────────────────────────────────────────────────
  function doAddCustomer(customer: Omit<Customer, "id"|"createdAt"|"updatedAt">): Customer {
    const result = isUserMode
      ? addUserCustomer(userId, customer)
      : addCustomer(customer);
    refresh();
    return result;
  }

  function doUpdateCustomer(id: string, updates: Partial<Customer>): void {
    if (isUserMode) updateUserCustomer(userId, id, updates);
    else            updateCustomer(id, updates);
    refresh();
  }

  function doDeleteCustomer(id: string): void {
    if (isUserMode) deleteUserCustomer(userId, id);
    else            deleteCustomer(id);
    refresh();
  }

  // ── Orders ─────────────────────────────────────────────────────────────────
  function doAddOrder(order: Omit<Order, "id"|"createdAt"|"updatedAt"|"orderNumber">): Order {
    const result = isUserMode
      ? addUserOrder(userId, order)
      : addOrder(order);
    refresh();
    return result;
  }

  function doUpdateOrder(id: string, updates: Partial<Order>): void {
    if (isUserMode) updateUserOrder(userId, id, updates);
    else            updateOrder(id, updates);
    refresh();
  }

  function doDeleteOrder(id: string): void {
    if (isUserMode) deleteUserOrder(userId, id);
    else            deleteOrder(id);
    refresh();
  }

  // ── Settings ───────────────────────────────────────────────────────────────
  function doUpdateSettings(updates: Partial<SellerSettings>): void {
    if (isUserMode) updateUserSettings(userId, updates);
    else            updateSettings(updates);
    refresh();
  }

  // ── CSV export ─────────────────────────────────────────────────────────────
  function doExportCSV(): string {
    return exportInventoryCSV(state?.inventory);
  }

  // ── Reset (context-aware) ──────────────────────────────────────────────────
  function doReset(): void {
    if (isUserMode) {
      const { clearUserState } = require("@/lib/store");
      clearUserState(userId);
    } else {
      localStorage.removeItem("reseller_os_demo_data");
    }
    refresh();
  }

  return {
    state,
    loading,
    refresh,
    isUserMode,
    // CRUD
    addInventoryItem:  doAddInventoryItem,
    updateInventoryItem: doUpdateInventoryItem,
    deleteInventoryItem: doDeleteInventoryItem,
    addReceipt:        doAddReceipt,
    getReceiptById:    doGetReceiptById,
    addCustomer:       doAddCustomer,
    updateCustomer:    doUpdateCustomer,
    deleteCustomer:    doDeleteCustomer,
    addOrder:          doAddOrder,
    updateOrder:       doUpdateOrder,
    deleteOrder:       doDeleteOrder,
    updateSettings:    doUpdateSettings,
    exportCSV:         doExportCSV,
    reset:             doReset,
  };
}
