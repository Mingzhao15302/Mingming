const STORAGE_KEY = 'huicloud-cart';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export function getCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch (error) {
    console.warn('读取购物车失败', error);
    return [];
  }
}

export function setCart(items: CartItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addToCart(item: CartItem) {
  const cart = getCart();
  const existing = cart.find((entry) => entry.productId === item.productId);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  setCart(cart);
  return cart;
}

export function updateCart(productId: string, quantity: number) {
  const cart = getCart().map((item) => (item.productId === productId ? { ...item, quantity } : item));
  setCart(cart);
  return cart;
}

export function removeFromCart(productId: string) {
  const cart = getCart().filter((item) => item.productId !== productId);
  setCart(cart);
  return cart;
}

export function clearCart() {
  setCart([]);
}
