'use strict';

/* Small shared cart stored in localStorage. Items are { id, qty } only;
   prices and stock always come from the server when the cart is displayed. */

(() => {
  const KEY = 'atelier-cart-v1';

  function clean(items) {
    if (!Array.isArray(items)) return [];
    return items
      .filter((item) => item && typeof item.id === 'string' && Number.isFinite(Number(item.qty)) && Number(item.qty) > 0)
      .map((item) => ({ id: item.id, qty: Math.min(999, Math.floor(Number(item.qty))) }));
  }

  function read() {
    try {
      return clean(JSON.parse(localStorage.getItem(KEY) || '[]'));
    } catch {
      return [];
    }
  }

  function emit(items) {
    window.dispatchEvent(new CustomEvent('cart:change', { detail: items }));
  }

  function write(items) {
    const next = clean(items);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage might be disabled; the page still works for this session */
    }
    emit(next);
    return next;
  }

  function add(id, qty, max) {
    const limit = Math.max(0, Math.floor(Number(max)));
    if (!id || limit <= 0) return 0;
    const items = read();
    const existing = items.find((item) => item.id === id);
    const requested = (existing ? existing.qty : 0) + Math.max(1, Math.floor(Number(qty) || 1));
    const nextQty = Math.min(requested, limit);
    if (existing) existing.qty = nextQty;
    else items.push({ id, qty: nextQty });
    write(items);
    return nextQty;
  }

  function setQty(id, qty, max) {
    const limit = Math.max(0, Math.floor(Number(max)));
    let items = read();
    const existing = items.find((item) => item.id === id);
    if (!existing) return;
    if (limit <= 0) {
      items = items.filter((item) => item.id !== id);
    } else {
      existing.qty = Math.max(1, Math.min(Math.floor(Number(qty) || 1), limit));
    }
    write(items);
  }

  function remove(id) {
    write(read().filter((item) => item.id !== id));
  }

  function clear() {
    write([]);
  }

  function count() {
    return read().reduce((sum, item) => sum + item.qty, 0);
  }

  window.ShopCart = { KEY, read, write, add, setQty, remove, clear, count };
})();
