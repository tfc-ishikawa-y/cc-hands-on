'use strict';

const {
  addToCart,
  calcTotal,
  removeFromCart,
  checkStock,
  getOrderSummary,
  ITEMS,
} = require('../src/shop');

describe('addToCart', () => {
  test('存在しない商品を指定すると失敗する', () => {
    const cart = [];
    const result = addToCart(cart, 999, 1);
    expect(result).toEqual({
      success: false,
      cart: cart,
      message: '商品が見つかりません',
    });
  });

  test('qty が 0 以下だと失敗する', () => {
    const cart = [];
    const result = addToCart(cart, 1, 0);
    expect(result).toEqual({
      success: false,
      cart: cart,
      message: '数量は1以上にしてください',
    });
  });

  test('qty が負の値でも失敗する', () => {
    const cart = [];
    const result = addToCart(cart, 1, -1);
    expect(result).toEqual({
      success: false,
      cart: cart,
      message: '数量は1以上にしてください',
    });
  });

  test('在庫を超える数量だと失敗する（商品ID 3: 在庫3）', () => {
    const cart = [];
    const result = addToCart(cart, 3, 4);
    expect(result).toEqual({
      success: false,
      cart: cart,
      message: '在庫が不足しています',
    });
  });

  test('境界値: 在庫ちょうどの数量は成功する（商品ID 3: 在庫3）', () => {
    const cart = [];
    const result = addToCart(cart, 3, 3);
    expect(result).toEqual({
      success: true,
      cart: [{ itemId: 3, qty: 3 }],
      message: 'カートに追加しました',
    });
  });

  test('カートに存在しない商品を新規追加すると末尾に追加される', () => {
    const cart = [{ itemId: 1, qty: 1 }];
    const result = addToCart(cart, 2, 2);
    expect(result).toEqual({
      success: true,
      cart: [
        { itemId: 1, qty: 1 },
        { itemId: 2, qty: 2 },
      ],
      message: 'カートに追加しました',
    });
  });

  test('カートに既に存在する商品は数量が加算される', () => {
    const cart = [{ itemId: 1, qty: 2 }];
    const result = addToCart(cart, 1, 3);
    expect(result).toEqual({
      success: true,
      cart: [{ itemId: 1, qty: 5 }],
      message: 'カートに追加しました',
    });
  });

  test('既存数量と追加数量の合計が在庫を超えると失敗する', () => {
    const cart = [{ itemId: 2, qty: 4 }];
    const result = addToCart(cart, 2, 2); // 商品ID2の在庫は5
    expect(result).toEqual({
      success: false,
      cart: cart,
      message: '在庫が不足しています',
    });
  });

  test('itemId はゆるい等価比較(==)のため文字列でも一致する', () => {
    const cart = [];
    const result = addToCart(cart, '1', 1);
    expect(result).toEqual({
      success: true,
      cart: [{ itemId: '1', qty: 1 }],
      message: 'カートに追加しました',
    });
  });

  test('失敗時、元の cart はオブジェクトとして同一参照を返す', () => {
    const cart = [{ itemId: 1, qty: 1 }];
    const result = addToCart(cart, 999, 1);
    expect(result.cart).toBe(cart);
  });
});

describe('calcTotal', () => {
  test('空のカートは合計0を返す', () => {
    expect(calcTotal([])).toBe(0);
  });

  test('単一商品の合計を計算する', () => {
    // 商品ID1: Tシャツ 2000円
    expect(calcTotal([{ itemId: 1, qty: 2 }])).toBe(4000);
  });

  test('複数商品の合計を計算する', () => {
    // 商品ID1: 2000円 x1 = 2000, 商品ID2: 8000円 x1 = 8000
    expect(calcTotal([{ itemId: 1, qty: 1 }, { itemId: 2, qty: 1 }])).toBe(10000);
  });

  test('ITEMS に存在しない itemId は無視される', () => {
    expect(calcTotal([{ itemId: 999, qty: 5 }])).toBe(0);
    expect(
      calcTotal([{ itemId: 1, qty: 1 }, { itemId: 999, qty: 5 }])
    ).toBe(2000);
  });
});

describe('removeFromCart', () => {
  test('指定した itemId の商品を除去する', () => {
    const cart = [
      { itemId: 1, qty: 1 },
      { itemId: 2, qty: 2 },
    ];
    const result = removeFromCart(cart, 1);
    expect(result).toEqual([{ itemId: 2, qty: 2 }]);
  });

  test('存在しない id を指定すると元と同じ内容の配列を返す', () => {
    const cart = [{ itemId: 1, qty: 1 }];
    const result = removeFromCart(cart, 999);
    expect(result).toEqual(cart);
    expect(result).not.toBe(cart);
  });

  test('空配列を渡すと空配列を返す', () => {
    expect(removeFromCart([], 1)).toEqual([]);
  });

  test('同じ itemId が複数あれば全て除去される', () => {
    const cart = [
      { itemId: 1, qty: 1 },
      { itemId: 1, qty: 2 },
      { itemId: 2, qty: 3 },
    ];
    const result = removeFromCart(cart, 1);
    expect(result).toEqual([{ itemId: 2, qty: 3 }]);
  });
});

describe('checkStock', () => {
  test('存在しない商品は false を返す', () => {
    expect(checkStock(999, 1)).toBe(false);
  });

  test('在庫が十分な場合は true を返す', () => {
    // 商品ID1: 在庫10
    expect(checkStock(1, 5)).toBe(true);
  });

  test('在庫が不足している場合は false を返す', () => {
    // 商品ID3: 在庫3
    expect(checkStock(3, 4)).toBe(false);
  });

  test('境界値: 要求数量が在庫と同数なら true を返す', () => {
    // 商品ID3: 在庫3
    expect(checkStock(3, 3)).toBe(true);
  });
});

describe('getOrderSummary', () => {
  test('空のカートは失敗レスポンスを返す', () => {
    expect(getOrderSummary([], null)).toEqual({
      ok: false,
      msg: 'カートが空です',
    });
  });

  test('クーポンなし(undefined)の場合、割引なしで計算する', () => {
    // 商品ID1: 2000円 x1 = 2000 → 送料500(3000円未満) tax=round(2000*0.1)=200
    const result = getOrderSummary([{ itemId: 1, qty: 1 }], undefined);
    expect(result).toEqual({
      ok: true,
      subtotal: 2000,
      discount: 0,
      shipping: 500,
      tax: 200,
      total: 2700,
      msg: '注文内容を確認しました',
    });
  });

  test('クーポンなし(null)の場合、割引なしで計算する', () => {
    const result = getOrderSummary([{ itemId: 1, qty: 1 }], null);
    expect(result.discount).toBe(0);
  });

  test('クーポンなし(空文字)の場合、割引なしで計算する', () => {
    const result = getOrderSummary([{ itemId: 1, qty: 1 }], '');
    expect(result.discount).toBe(0);
  });

  test('無効なクーポンコードはエラーを返す', () => {
    const result = getOrderSummary([{ itemId: 1, qty: 1 }], 'INVALID');
    expect(result).toEqual({
      ok: false,
      msg: '無効なクーポンコードです',
    });
  });

  test('SAVE10クーポンで10%割引される', () => {
    // 商品ID2: 8000円 x1 = 8000 → discount=800 → afterDisc=7200
    // shipping=0(3000円以上) tax=round(7200*0.1)=720 total=7920
    const result = getOrderSummary([{ itemId: 2, qty: 1 }], 'SAVE10');
    expect(result).toEqual({
      ok: true,
      subtotal: 8000,
      discount: 800,
      shipping: 0,
      tax: 720,
      total: 7920,
      msg: '注文内容を確認しました',
    });
  });

  test('SAVE20クーポンで20%割引される', () => {
    // 商品ID2: 8000円 x1 = 8000 → discount=1600 → afterDisc=6400
    // shipping=0 tax=round(6400*0.1)=640 total=7040
    const result = getOrderSummary([{ itemId: 2, qty: 1 }], 'SAVE20');
    expect(result).toEqual({
      ok: true,
      subtotal: 8000,
      discount: 1600,
      shipping: 0,
      tax: 640,
      total: 7040,
      msg: '注文内容を確認しました',
    });
  });

  test('FLAT500クーポンで500円引きされる', () => {
    // 商品ID2: 8000円 x1 = 8000 → discount=500 → afterDisc=7500
    // shipping=0 tax=round(7500*0.1)=750 total=8250
    const result = getOrderSummary([{ itemId: 2, qty: 1 }], 'FLAT500');
    expect(result).toEqual({
      ok: true,
      subtotal: 8000,
      discount: 500,
      shipping: 0,
      tax: 750,
      total: 8250,
      msg: '注文内容を確認しました',
    });
  });

  test('FLAT500クーポンは合計が500円未満の場合、合計額を上限に割引される', () => {
    // 商品ID1: 2000円 x なし → 合計が500円未満になるカートを作れないため
    // ITEMSに存在しない商品のみのカートで合計0円のケースを使う
    const cart = [{ itemId: 999, qty: 1 }]; // calcTotalで無視され合計0
    const result = getOrderSummary(cart, 'FLAT500');
    // subtotal=0, discount は total(0)を超えないよう0にキャップされる
    expect(result).toEqual({
      ok: true,
      subtotal: 0,
      discount: 0,
      shipping: 500,
      tax: 0,
      total: 500,
      msg: '注文内容を確認しました',
    });
  });

  test('境界値: 割引後合計が3000円未満なら送料500円がかかる', () => {
    // 商品ID1: 2000円 x1 = 2000 (3000円未満)
    const result = getOrderSummary([{ itemId: 1, qty: 1 }], null);
    expect(result.shipping).toBe(500);
  });

  test('境界値: 割引後合計がちょうど3000円なら送料は0円', () => {
    // 商品ID4: 3000円 x1 = 3000
    const result = getOrderSummary([{ itemId: 4, qty: 1 }], null);
    expect(result.shipping).toBe(0);
  });

  test('境界値: 割引後合計が3000円を超えれば送料は0円', () => {
    // 商品ID2: 8000円 x1 = 8000
    const result = getOrderSummary([{ itemId: 2, qty: 1 }], null);
    expect(result.shipping).toBe(0);
  });

  test('税額は四捨五入(Math.round)で計算される', () => {
    // 商品ID1: 2000円 x1 → afterDisc=2000 → tax=round(200)=200
    const result = getOrderSummary([{ itemId: 1, qty: 1 }], null);
    expect(result.tax).toBe(200);
  });
});

describe('ITEMS', () => {
  test('4件の商品マスタが定義されている', () => {
    expect(ITEMS).toHaveLength(4);
  });

  test('各商品は id, name, price, stock を持つ', () => {
    ITEMS.forEach((item) => {
      expect(item).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          price: expect.any(Number),
          stock: expect.any(Number),
        })
      );
    });
  });
});
