'use strict';

const ITEMS = [
  { id: 1, name: 'Tシャツ',     price: 2000,  stock: 10 },
  { id: 2, name: 'ジーンズ',   price: 8000,  stock: 5  },
  { id: 3, name: 'スニーカー', price: 12000, stock: 3  },
  { id: 4, name: 'キャップ',   price: 3000,  stock: 15 },
];

function findItemById(itemId) {
  return ITEMS.find(function (item) { return item.id == itemId; });
}

function addToCart(cart, itemId, qty) {
  const found = findItemById(itemId);
  if (found == null) {
    return { success: false, cart: cart, message: '商品が見つかりません' };
  }
  if (qty <= 0) {
    return { success: false, cart: cart, message: '数量は1以上にしてください' };
  }
  const existing = cart.find(function (e) { return e.itemId == itemId; });
  const cur = existing ? existing.qty : 0;
  if (cur + qty > found.stock) {
    return { success: false, cart: cart, message: '在庫が不足しています' };
  }
  if (existing) {
    return {
      success: true,
      cart: cart.map(function (e) {
        if (e.itemId == itemId) return { itemId: e.itemId, qty: e.qty + qty };
        return e;
      }),
      message: 'カートに追加しました',
    };
  }
  return { success: true, cart: [...cart, { itemId: itemId, qty: qty }], message: 'カートに追加しました' };
}

function calcTotal(cart) {
  return cart.reduce(function (t, entry) {
    const item = findItemById(entry.itemId);
    return item ? t + item.price * entry.qty : t;
  }, 0);
}

function removeFromCart(cart, itemId) {
  return cart.filter(function (entry) { return entry.itemId != itemId; });
}

function checkStock(itemId, qty) {
  const item = findItemById(itemId);
  if (!item) return false;
  return item.stock >= qty;
}

function calcDiscount(total, coupon) {
  if (coupon == null || coupon === '') return 0;
  if (coupon == 'SAVE10') return total * 0.1;
  if (coupon == 'SAVE20') return total * 0.2;
  if (coupon == 'FLAT500') return Math.min(500, total);
  return null;
}

function getOrderSummary(cart, coupon) {
  if (cart.length == 0) {
    return { ok: false, msg: 'カートが空です' };
  }
  const total = calcTotal(cart);
  const disc = calcDiscount(total, coupon);
  if (disc == null) {
    return { ok: false, msg: '無効なクーポンコードです' };
  }
  const afterDisc = total - disc;
  const ship = afterDisc < 3000 ? 500 : 0;
  const tax = Math.round(afterDisc * 0.1);
  return {
    ok: true,
    subtotal: total,
    discount: disc,
    shipping: ship,
    tax: tax,
    total: afterDisc + tax + ship,
    msg: '注文内容を確認しました',
  };
}

module.exports = { addToCart, calcTotal, removeFromCart, checkStock, getOrderSummary, ITEMS };
