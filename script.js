const PIN_KEY = 'pansod_pin';

async function api(path, data = {}) {
  const pin = sessionStorage.getItem(PIN_KEY);
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(pin ? { 'x-pin': pin } : {})
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
}

let lang = sessionStorage.getItem('olang') || 'en';
let menuItems = [];
let categories = ['Onigiri', 'Sides', 'Drinks'];
let catKeys = { en: ['Onigiri', 'Sides', 'Drinks'], th: ['ข้าวปั้น', 'เครื่องเคียง', 'เครื่องดื่ม'] };
let activeCat = null;
let cart = {};
let editingId = null;
let pendingOrderType = 'dinein';

let promoBrackets = [
  { pcs: 10, discount: 50 },
  { pcs: 5, discount: 20 },
  { pcs: 3, discount: 10 }
];

let i18n = {
  en: {
    tabOrder: 'Take Order', tabSales: 'Daily Sales', tabMenuEdit: 'Menu Edit',
    tabReports: 'Reports', tabDailyReport: 'Daily Report', tabGrabOrder: 'Grab Orders',
    currentOrder: 'Current Order', noItems: 'No items added',
    total: 'Total:', checkout: 'Checkout',
    todaySales: 'Daily Sales', orders: 'Orders', revenue: 'Revenue',
    itemsSold: 'Items Sold', noOrders: 'No orders for this date',
    all: 'All', manageMenu: 'Manage Menu',
    enPlaceholder: 'English name', thPlaceholder: 'Thai name',
    addItem: 'Add Item', saveChanges: 'Save Changes',
    edit: 'Edit', del: 'Delete',
    promoLabel: 'Onigiri Promo: 3=฿10 off, 5=฿20, 10=฿50',
    promoDiscount: 'Discount: -฿',
    onigiriPcs: 'Onigiri', otherPcs: 'Other', totalPcs: 'Total',
    selectOrderType: 'Order Type',
    selectPayment: 'Select Payment Method',
    cash: 'Cash', qrPayment: 'QR Payment',
    cancel: 'Cancel', confirmDeleteOrder: 'Delete this order?',
    dineIn: 'Dine In', takeAway: 'Take Away',
    dailyReport: 'Daily Report', drLoad: 'Load',
    drTotalRevenue: 'Total Revenue', drOrders: 'Orders',
    drAOV: 'AOV', drItemsSold: 'Items Sold',
    drNoData: 'No orders for this date',
    topProducts: 'Top Selling Products',
    categoryBreakdown: 'Category Breakdown',
    salesByHour: 'Sales By Hour',
    insights: 'Daily Insights',
    drRevenue: 'Revenue', drItems: 'Items',
    drOrdersCount: 'Orders', drQuantity: 'Qty',
    drHour: 'Hour', drOther: 'Other',
    insightBestSeller: 'Best selling product',
    insightPeakHour: 'Peak sales hour',
    insightAOV: 'Average customer spend',
    insightProfitMargin: 'Estimated profit margin',
    tabGrabOrder: 'Grab Orders',
    grabOrderTitle: 'Grab Order',
    grabRecord: 'Record Grab Order',
    grabHistory: "Today's Grab Orders",
    grabPcs: 'pcs',
    grabNoOrders: 'No grab orders yet today',
    grabConfirmDelete: 'Delete this grab order?',
    grabRecorded: 'Grab order recorded!',
    grabOrderNr: 'Order No.',
    drGrabOrders: 'Grab Orders',
    drGrabItems: 'Grab Items',
    drDiscount: 'Discount Given',
    drCashReceived: 'Cash Received',
    drQRReceived: 'QR Received',
    statusPending: 'Pending',
    statusPreparing: 'Preparing',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    grabInsights: 'Grab Insights',
    giTotalItems: 'Total Grab Items',
    giAvgOni: 'Avg Onigiri/Order',
    enterPin: 'Enter PIN to unlock',
    unlock: 'Unlock',
    wrongPin: 'Wrong PIN. Try again.',
    loading: 'Loading...',
    saving: 'Saving...',
    changePin: 'Change PIN',
    newPin: 'New PIN',
    pinChanged: 'PIN changed!',
    orderDate: 'Order Date:',
    customerType: 'Customer:',
    custOld: 'Old',
    custNew: 'New',
    custAds: 'Ads',
    drModeDaily: 'Daily',
    drModeCustom: 'Custom',
    drModeWeekly: 'This Week',
    drModeMonth: 'This Month',
    drModeLastMonth: 'Last Month',
    drModePast7: 'Past 7 Days',
    editOrder: 'Edit',
    tabReports: 'Reports',
    drGrabOld: 'Old',
    drGrabNew: 'New',
    drGrabAds: 'Ads',
    drGrabAvgPcs: 'Avg Pcs/Bill',
    drGrabTotalOnigiri: 'Total Onigiri',
    drGrabTopProducts: 'Top Grab Items',
    drGrabLowProducts: 'Low Grab Items',
  },
  th: {
    tabOrder: 'รับออเดอร์', tabSales: 'ยอดขายวันนี้', tabMenuEdit: 'แก้ไขเมนู',
    tabReports: 'รายงาน', tabDailyReport: 'รายงานประจำวัน', tabGrabOrder: 'ออเดอร์ Grab',
    currentOrder: 'ออเดอร์ปัจจุบัน', noItems: 'ยังไม่มีรายการ',
    total: 'รวม:', checkout: 'ชำระเงิน',
    todaySales: 'ยอดขายวันนี้', orders: 'ออเดอร์', revenue: 'รายได้',
    itemsSold: 'จำนวนที่ขาย', noOrders: 'ไม่มีออเดอร์ในวันที่เลือก',
    all: 'ทั้งหมด', manageMenu: 'จัดการเมนู',
    enPlaceholder: 'ชื่ออังกฤษ', thPlaceholder: 'ชื่อไทย',
    addItem: 'เพิ่มเมนู', saveChanges: 'บันทึก',
    edit: 'แก้ไข', del: 'ลบ',
    promoLabel: 'โปรโมชั่นโอนิกิริ: 3=ลด10, 5=ลด20, 10=ลด50',
    promoDiscount: 'ส่วนลด: -฿',
    onigiriPcs: 'ข้าวปั้น', otherPcs: 'อื่นๆ', totalPcs: 'รวม',
    selectOrderType: 'รูปแบบออเดอร์',
    selectPayment: 'เลือกวิธีการชำระเงิน',
    cash: 'เงินสด', qrPayment: 'QR Payment',
    cancel: 'ยกเลิก', confirmDeleteOrder: 'ลบออเดอร์นี้?',
    dineIn: 'นั่งร้าน', takeAway: 'ใส่ห่อ',
    dailyReport: 'รายงานประจำวัน', drLoad: 'ดู',
    drTotalRevenue: 'รายได้รวม', drOrders: 'ออเดอร์',
    drAOV: 'มูลค่าเฉลี่ย', drItemsSold: 'สินค้าที่ขาย',
    drNoData: 'ไม่มีออเดอร์ในวันที่เลือก',
    topProducts: 'สินค้าขายดี',
    categoryBreakdown: 'แยกตามหมวด',
    salesByHour: 'ยอดขายตามชั่วโมง',
    insights: 'ข้อมูลเชิงลึก',
    drRevenue: 'รายได้', drItems: 'ชิ้น',
    drOrdersCount: 'ออเดอร์', drQuantity: 'จำนวน',
    drHour: 'ชั่วโมง', drOther: 'อื่นๆ',
    insightBestSeller: 'สินค้าขายดีที่สุด',
    insightPeakHour: 'ชั่วโมงที่ขายดีที่สุด',
    insightAOV: 'มูลค่าการใช้จ่ายเฉลี่ย',
    insightProfitMargin: 'อัตรากำไรโดยประมาณ',
    tabGrabOrder: 'ออเดอร์ Grab',
    grabOrderTitle: 'ออเดอร์ Grab',
    grabRecord: 'บันทึกออเดอร์ Grab',
    grabHistory: 'ออเดอร์ Grab วันนี้',
    grabPcs: 'ชิ้น',
    grabNoOrders: 'ยังไม่มีออเดอร์ Grab วันนี้',
    grabConfirmDelete: 'ลบออเดอร์ Grab นี้?',
    grabRecorded: 'บันทึกออเดอร์ Grab แล้ว!',
    grabOrderNr: 'เลขที่ออเดอร์',
    drGrabOrders: 'ออเดอร์ Grab',
    drGrabItems: 'ชิ้น Grab',
    drDiscount: 'ส่วนลด',
    drCashReceived: 'รับเงินสด',
    drQRReceived: 'รับ QR',
    statusPending: 'รอปรุง',
    statusPreparing: 'กำลังปรุง',
    statusCompleted: 'เสร็จแล้ว',
    statusCancelled: 'ยกเลิก',
    grabInsights: 'ข้อมูล Grab',
    giTotalItems: 'รวมชิ้น Grab',
    giAvgOni: 'เฉลี่ยข้าวปั้น/ออเดอร์',
    enterPin: 'ใส่ PIN เพื่อปลดล็อค',
    unlock: 'ปลดล็อค',
    wrongPin: 'PIN ผิด ลองอีกครั้ง',
    loading: 'กำลังโหลด...',
    saving: 'กำลังบันทึก...',
    changePin: 'เปลี่ยน PIN',
    newPin: 'PIN ใหม่',
    pinChanged: 'เปลี่ยน PIN แล้ว!',
    orderDate: 'วันที่ออเดอร์:',
    customerType: 'ลูกค้า:',
    custOld: 'ลูกค้าเก่า',
    custNew: 'ลูกค้าใหม่',
    custAds: 'โฆษณา',
    drModeDaily: 'รายวัน',
    drModeCustom: 'กำหนดเอง',
    drModeWeekly: 'สัปดาห์นี้',
    drModeMonth: 'เดือนนี้',
    drModeLastMonth: 'เดือนที่แล้ว',
    drModePast7: '7 วันที่ผ่านมา',
    editOrder: 'แก้ไข',
    tabReports: 'รายงาน',
    drGrabOld: 'ลูกค้าเก่า',
    drGrabNew: 'ลูกค้าใหม่',
    drGrabAds: 'โฆษณา',
    drGrabAvgPcs: 'เฉลี่ยชิ้น/บิล',
    drGrabTotalOnigiri: 'ข้าวปั้นรวม',
    drGrabTopProducts: 'สินค้า Grab ขายดี',
    drGrabLowProducts: 'สินค้า Grab ขายน้อย',
  }
};

function t(k) { return i18n[lang][k] || k; }

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  const toggle = document.getElementById('langToggle');
  if (toggle) toggle.textContent = lang === 'en' ? 'TH' : 'EN';
}

function toggleLang() {
  lang = lang === 'en' ? 'th' : 'en';
  sessionStorage.setItem('olang', lang);
  applyLang();
  const active = document.querySelector('.tab-content.active');
  if (active) {
    const id = active.id;
    if (id === 'tab-order') { rCatBar(); rMenu(); }
    if (id === 'tab-sales') rSales();
    if (id === 'tab-menuedit') { rMeCat(); rMList(); }
    if (id === 'tab-dailyreport') loadReport();
    if (id === 'tab-graborder') rGrabOrder();
  }
}

// ========== PIN SCREEN ==========

document.getElementById('pinSubmit').onclick = handlePinSubmit;
document.getElementById('pinInput').onkeydown = function(e) {
  if (e.key === 'Enter') handlePinSubmit();
};

async function handlePinSubmit() {
  const input = document.getElementById('pinInput');
  const error = document.getElementById('pinError');
  const pin = input.value.trim();
  if (!pin) return;
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const json = await res.json();
    if (json.success) {
      sessionStorage.setItem(PIN_KEY, pin);
      document.getElementById('pinScreen').style.display = 'none';
      document.getElementById('appMain').style.display = 'block';
      initApp();
    } else {
      error.textContent = t('wrongPin');
    }
  } catch (e) {
    error.textContent = t('wrongPin');
  }
}

function showPinScreen() {
  const storedPin = sessionStorage.getItem(PIN_KEY);
  if (storedPin) {
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: storedPin })
    }).then(res => res.json()).then(json => {
      if (json.success) {
        document.getElementById('pinScreen').style.display = 'none';
        document.getElementById('appMain').style.display = 'block';
        initApp();
      } else {
        sessionStorage.removeItem(PIN_KEY);
        document.getElementById('pinScreen').style.display = 'flex';
      }
    }).catch(() => {
      document.getElementById('pinScreen').style.display = 'flex';
    });
  } else {
    document.getElementById('pinScreen').style.display = 'flex';
  }
}

// ========== DATA LOADING ==========

async function loadMenu() {
  try {
    menuItems = await api('/api/menu/list');
  } catch (e) {
    menuItems = [];
  }
}

// ========== CART & MENU FUNCTIONS (from demo) ==========

function countOnigiri() {
  let total = 0;
  for (const id in cart) {
    const it = gi(id);
    if (it && it.cat === 'Onigiri') total += cart[id];
  }
  return total;
}

function cartCountByCat(cat) {
  let total = 0;
  for (const id in cart) {
    const it = gi(id);
    if (it && it.cat === cat) total += cart[id];
  }
  return total;
}

function cartTotalItems() {
  let total = 0;
  for (const id in cart) total += cart[id];
  return total;
}

function calcPromo(count) {
  let total = 0;
  let rem = count;
  for (let i = 0; i < promoBrackets.length; i++) {
    const b = promoBrackets[i];
    const times = Math.floor(rem / b.pcs);
    total += times * b.discount;
    rem -= times * b.pcs;
  }
  return total;
}

function rCatBar() {
  const bar = document.getElementById('categoryBar');
  if (!bar) return;
  bar.innerHTML = '';
  const cats = lang === 'th' ? catKeys.th : catKeys.en;
  const allBtn = document.createElement('button');
  allBtn.className = 'cat-btn' + (activeCat === null ? ' active' : '');
  allBtn.textContent = t('all');
  allBtn.onclick = function() { activeCat = null; rCatBar(); rMenu(); };
  bar.appendChild(allBtn);
  categories.forEach(function(cat, i) {
    const btn = document.createElement('button');
    btn.className = 'cat-btn' + (activeCat === cat ? ' active' : '');
    btn.textContent = cats[i];
    btn.onclick = function() { activeCat = cat; rCatBar(); rMenu(); };
    bar.appendChild(btn);
  });
}

function rMenu() {
  const g = document.getElementById('menuGrid');
  if (!g) return;
  g.innerHTML = '';
  const items = activeCat ? menuItems.filter(function(m) { return m.cat === activeCat; }) : menuItems;
  const catLabels = { en: categories, th: catKeys.th };
  items.forEach(function(m) {
    const c = document.createElement('div');
    c.className = 'menu-card';
    const name = lang === 'th' && m.th ? m.th : m.en;
    const ci = categories.indexOf(m.cat);
    const catName = ci !== -1 ? catLabels[lang][ci] : m.cat;
    c.innerHTML = '<div class=cat-label>' + catName + '</div><h3>' + name + '</h3><div class=price>฿' + m.price + '</div>';
    c.onclick = function() { addC(m.id); };
    g.appendChild(c);
  });
}

function addC(id) { cart[id] = (cart[id] || 0) + 1; rCart(); }

function remC(id) {
  if (cart[id] > 1) cart[id]--;
  else delete cart[id];
  rCart();
}

function gi(id) { return menuItems.find(function(i) { return i.id === id; }); }

function rCart() {
  const ct = document.getElementById('cartItems');
  const cb = document.getElementById('checkoutBtn');
  const te = document.getElementById('cartTotal');
  const ps = document.getElementById('promoSection');
  const pc = document.getElementById('promoCheck');
  const pd = document.getElementById('promoDiscount');
  if (!ct) return;
  const ids = Object.keys(cart);
  ct.innerHTML = '';
  if (pc) pc.checked = false;
  if (!ids.length) {
    ct.innerHTML = '<p class=empty-cart>' + t('noItems') + '</p>';
    cb.disabled = true;
    cb.textContent = t('checkout') + ' (0)';
    te.textContent = '฿0';
    ps.style.display = 'none';
    return;
  }
  cb.disabled = false;
  let total = 0;
  ids.forEach(function(id) {
    const it = gi(id);
    if (!it) { delete cart[id]; return; }
    const q = cart[id];
    const lt = it.price * q;
    total += lt;
    const name = lang === 'th' && it.th ? it.th : it.en;
    const d = document.createElement('div');
    d.className = 'cart-item';
    d.innerHTML = '<div><div class=cart-item-name>' + name + '</div></div><div><button onclick=remC("' + id + '")>−</button><span> ' + q + ' </span><button onclick=addC("' + id + '")>+</button></div><div>฿' + lt + '</div>';
    ct.appendChild(d);
  });
  const oc = countOnigiri();
  if (oc >= 3) {
    ps.style.display = 'block';
    pd.textContent = '';
  } else {
    ps.style.display = 'none';
  }
  rPromo(total);
  rCartSummary();
}

function rCartSummary() {
  const se = document.getElementById('cartSummary');
  if (!se) return;
  const ids = Object.keys(cart);
  if (!ids.length) { se.innerHTML = ''; return; }
  const oni = countOnigiri();
  const other = cartTotalItems() - oni;
  se.innerHTML = '<span>' + t('onigiriPcs') + ': <b>' + oni + '</b></span><span>' + t('otherPcs') + ': <b>' + other + '</b></span><span>' + t('totalPcs') + ': <b>' + (oni + other) + '</b></span>';
}

function rPromo(baseTotal) {
  const pc = document.getElementById('promoCheck');
  const pd = document.getElementById('promoDiscount');
  const te = document.getElementById('cartTotal');
  const cb = document.getElementById('checkoutBtn');
  const oc = countOnigiri();
  if (oc >= 3 && pc.checked) {
    const disc = calcPromo(oc);
    const after = baseTotal - disc;
    pd.textContent = t('promoDiscount') + disc + ' (฿' + after + ')';
    te.textContent = '฿' + after;
  } else {
    pd.textContent = '';
    te.textContent = '฿' + baseTotal;
  }
  cb.textContent = t('checkout') + ' (' + Object.keys(cart).reduce(function(s, id) { return s + cart[id]; }, 0) + ')';
}

document.getElementById('promoCheck').onchange = function() {
  const ids = Object.keys(cart);
  const total = ids.reduce(function(s, id) { return s + gi(id).price * cart[id]; }, 0);
  rPromo(total);
};

function checkout() {
  const ids = Object.keys(cart);
  if (!ids.length) return;
  document.getElementById('orderTypeModal').style.display = 'flex';
}

function selectOrderType(type) {
  pendingOrderType = type;
  document.getElementById('orderTypeModal').style.display = 'none';
  document.getElementById('paymentModal').style.display = 'flex';
}

function closeOrderTypeModal() {
  document.getElementById('orderTypeModal').style.display = 'none';
}

async function processPayment(method) {
  document.getElementById('paymentModal').style.display = 'none';
  const ids = Object.keys(cart);
  let total = ids.reduce(function(s, id) { return s + gi(id).price * cart[id]; }, 0);
  let discount = 0;
  let promoApplied = false;
  if (document.getElementById('promoCheck').checked) {
    discount = calcPromo(countOnigiri());
    promoApplied = true;
  }
  const items = ids.map(function(id) {
    const item = gi(id);
    return { name: item.en, qty: cart[id], price: item.price };
  });
  const orderDateEl = document.getElementById('orderDate');
  const orderDateVal = orderDateEl ? orderDateEl.value : '';
  const now = new Date();
  const gmt7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const pad = function(n) { return n.toString().padStart(2, '0'); };
  const hh = pad(gmt7.getUTCHours());
  const mm = pad(gmt7.getUTCMinutes());
  const ss = pad(gmt7.getUTCSeconds());
  const todayStr = fmtDate(now);
  const createdAt = orderDateVal && orderDateVal !== todayStr
    ? orderDateVal + 'T12:00:00+07:00'
    : todayStr + 'T' + hh + ':' + mm + ':' + ss + '+07:00';
  try {
    await api('/api/orders/create', {
      items: items,
      orderType: pendingOrderType,
      paymentMethod: method,
      promoApplied: promoApplied,
      discount: discount,
      finalTotal: total - discount,
      createdAt: createdAt || undefined
    });
    cart = {};
    rCart();
  } catch (e) {
    alert('Failed to save order');
  }
}

function closePaymentModal() {
  document.getElementById('paymentModal').style.display = 'none';
}

// ========== SALES ==========

async function rSales(startDateStr, endDateStr) {
  try {
    const startDate = startDateStr || document.getElementById('salesDate').value || fmtDate(new Date());
    const endDate = endDateStr || document.getElementById('salesEndDate').value || startDate;
    document.getElementById('salesLoading').style.display = 'block';
    const ords = await api('/api/orders/list', { startDate: startDate, endDate: endDate });
    const se = document.getElementById('salesSummary');
    const le = document.getElementById('salesList');
    const tc = ords.length;
    const tr = ords.reduce(function(s, o) { return s + (o.finalTotal != null ? o.finalTotal : o.total); }, 0);
    const ti = ords.reduce(function(s, o) { return s + o.items.reduce(function(a, i) { return a + i.qty; }, 0); }, 0);
    se.innerHTML = '<div class=sales-stat><div class=label>' + t('orders') + '</div><div class=value>' + tc + '</div></div><div class=sales-stat><div class=label>' + t('revenue') + '</div><div class=value>฿' + tr + '</div></div><div class=sales-stat><div class=label>' + t('itemsSold') + '</div><div class=value>' + ti + '</div></div>';
    le.innerHTML = '';
    if (!ords.length) { le.innerHTML = '<p style="color:#888;text-align:center;padding:2rem 0">' + t('noOrders') + '</p>'; return; }
    for (let i = ords.length - 1; i >= 0; i--) {
      const o = ords[i];
      const d = document.createElement('div');
      d.className = 'sales-order';
      const is = [];
      for (let j = 0; j < o.items.length; j++) is.push(o.items[j].qty + 'x ' + o.items[j].name);
      let badges = "<span class='so-badge " + (o.orderType || 'dinein') + "'>" + ((o.orderType || 'dinein') === 'dinein' ? t('dineIn') : t('takeAway')) + '</span>';
      badges += "<span class='so-badge " + (o.paymentMethod || 'cash') + "'>" + ((o.paymentMethod || 'cash') === 'cash' ? t('cash') : t('qrPayment')) + '</span>';
      if (o.promoApplied) badges += "<span class='so-badge promo'>Promo -฿" + o.discount + '</span>';
      const st = o.status || 'pending';
      badges += "<span class='so-badge " + st + "'>" + t('status' + st.charAt(0).toUpperCase() + st.slice(1)) + '</span>';
      let statusActions = '';
      if (st === 'pending') statusActions = "<button onclick=setOrderStatus(" + o.id + ",'preparing')>" + t('statusPreparing') + "</button><button class=sale-del onclick=setOrderStatus(" + o.id + ",'cancelled')>" + t('statusCancelled') + '</button>';
      else if (st === 'preparing') statusActions = "<button onclick=setOrderStatus(" + o.id + ",'completed')>" + t('statusCompleted') + "</button><button class=sale-del onclick=setOrderStatus(" + o.id + ",'cancelled')>" + t('statusCancelled') + '</button>';
      d.innerHTML = '<span class=so-time>' + o.time + '</span><span class=so-items>' + is.join(', ') + '</span><span class=so-badges>' + badges + '</span><span class=so-rev>฿' + o.finalTotal + '</span><span class=sales-actions>' + statusActions + '<button onclick=editOrder(' + o.id + ')>' + t('edit') + '</button><button class=sale-del onclick=deleteOrder(' + o.id + ')>' + t('del') + '</button></span>';
      le.appendChild(d);
    }
  } catch (e) {
    console.error('Failed to load sales', e);
  }
  document.getElementById('salesLoading').style.display = 'none';
}

async function setOrderStatus(id, status) {
  try {
    await api('/api/orders/update-status', { id, status });
    rSales();
  } catch (e) {
    alert('Failed to update order');
  }
}

function editOrder(id) {
  api('/api/orders/list', { startDate: document.getElementById('salesDate').value, endDate: document.getElementById('salesEndDate').value }).then(ords => {
    const order = ords.find(function(o) { return o.id === id; });
    if (!order) return;
    order.items.forEach(function(item) {
      const menuItem = menuItems.find(function(m) { return m.en === item.name; });
      if (menuItem) cart[menuItem.id] = (cart[menuItem.id] || 0) + item.qty;
    });
    api('/api/orders/delete', { id }).catch(() => {});
    document.querySelectorAll('.tab-btn, .tab-content').forEach(function(x) { x.classList.remove('active'); });
    document.querySelector('[data-tab="order"]').classList.add('active');
    document.getElementById('tab-order').classList.add('active');
    rCatBar();
    rMenu();
    rCart();
  }).catch(() => {});
}

async function deleteOrder(id) {
  if (!confirm(t('confirmDeleteOrder'))) return;
  try {
    await api('/api/orders/delete', { id });
    rSales();
  } catch (e) {
    alert('Failed to delete order');
  }
}

// ========== MENU EDITOR ==========

function rMeCat() {
  const sel = document.getElementById('meCat');
  if (!sel) return;
  sel.innerHTML = '';
  const cats = lang === 'th' ? catKeys.th : catKeys.en;
  categories.forEach(function(cat, i) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cats[i];
    sel.appendChild(opt);
  });
}

function rMList() {
  const list = document.getElementById('menuList');
  if (!list) return;
  list.innerHTML = '';
  const catLabels = { en: categories, th: catKeys.th };
  menuItems.forEach(function(m) {
    const ci = categories.indexOf(m.cat);
    const catName = ci !== -1 ? catLabels[lang][ci] : m.cat;
    const row = document.createElement('div');
    row.className = 'ml-row';
    row.draggable = true;
    row.dataset.id = m.id;
    row.addEventListener('dragstart', onDragStart);
    row.addEventListener('dragover', onDragOver);
    row.addEventListener('dragend', onDragEnd);
    row.addEventListener('drop', onDrop);
    row.innerHTML = '<span class=ml-grip>⠿</span><span class=ml-name>' + m.en + '</span><span class=ml-name-th>' + (m.th || '') + '</span><span class=ml-cat>' + catName + '</span><span class=ml-price>฿' + m.price + '</span><button onclick=editItem("' + m.id + '")>' + t('edit') + '</button><button class=ml-del onclick=delItem("' + m.id + '")>' + t('del') + '</button>';
    list.appendChild(row);
  });
}

let dragSrcId = null;

function onDragStart(e) {
  dragSrcId = this.dataset.id;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.id);
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('drag-over');
}

function onDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.ml-row.drag-over').forEach(function(r) { r.classList.remove('drag-over'); });
}

function onDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  const targetId = this.dataset.id;
  if (dragSrcId && dragSrcId !== targetId) {
    const srcIdx = menuItems.findIndex(function(m) { return m.id === dragSrcId; });
    const tgtIdx = menuItems.findIndex(function(m) { return m.id === targetId; });
    if (srcIdx !== -1 && tgtIdx !== -1) {
      const item = menuItems.splice(srcIdx, 1)[0];
      menuItems.splice(tgtIdx, 0, item);
      saveMenu(menuItems);
      rMList();
      if (document.getElementById('tab-order').classList.contains('active')) rMenu();
    }
  }
  dragSrcId = null;
}

function editItem(id) {
  const item = gi(id);
  if (!item) return;
  editingId = id;
  document.getElementById('meName').value = item.en;
  document.getElementById('meNameTh').value = item.th || '';
  document.getElementById('mePrice').value = item.price;
  document.getElementById('meCat').value = item.cat;
  document.getElementById('meSaveBtn').textContent = t('saveChanges');
}

function delItem(id) {
  if (!confirm('Delete ' + gi(id).en + '?')) return;
  menuItems = menuItems.filter(function(m) { return m.id !== id; });
  saveMenu(menuItems);
  rMList();
  if (document.getElementById('tab-order').classList.contains('active')) rMenu();
  if (cart[id]) { delete cart[id]; rCart(); }
}

document.getElementById('meSaveBtn').onclick = function() {
  const en = document.getElementById('meName').value.trim();
  const th = document.getElementById('meNameTh').value.trim();
  const price = parseInt(document.getElementById('mePrice').value);
  const cat = document.getElementById('meCat').value;
  if (!en || !price) { alert('Name and price required'); return; }
  if (editingId) {
    const item = gi(editingId);
    if (item) {
      item.en = en; item.th = th; item.price = price; item.cat = cat;
      saveMenu(menuItems);
      if (document.getElementById('tab-order').classList.contains('active')) rMenu();
      if (document.getElementById('tab-sales').classList.contains('active')) rSales();
    }
    editingId = null;
  } else {
    const id = 'm' + Date.now() + Math.random().toString(36).slice(2, 6);
    menuItems.push({ id: id, cat: cat, en: en, th: th, price: price });
    saveMenu(menuItems);
    if (document.getElementById('tab-order').classList.contains('active')) rMenu();
  }
  document.getElementById('meName').value = '';
  document.getElementById('meNameTh').value = '';
  document.getElementById('mePrice').value = '';
  document.getElementById('meSaveBtn').textContent = t('addItem');
  rMList();
};

async function saveMenu(items) {
  try {
    document.getElementById('menuEditLoading').style.display = 'block';
    await api('/api/menu/save', { menu: items });
  } catch (e) {
    alert('Failed to save menu');
  }
  document.getElementById('menuEditLoading').style.display = 'none';
}

// ========== DAILY REPORT ==========

function fmtDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function getThaiName(enName) {
  const item = menuItems.find(function(m) { return m.en === enName; });
  return item && item.th ? item.th : enName;
}

function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: fmtDate(mon), end: fmtDate(sun) };
}

function getMonthRange(date) {
  const d = new Date(date);
  const start = fmtDate(new Date(d.getFullYear(), d.getMonth(), 1));
  const end = fmtDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  return { start, end };
}

function getLastMonthRange(date) {
  const d = new Date(date);
  const start = fmtDate(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const end = fmtDate(new Date(d.getFullYear(), d.getMonth(), 0));
  return { start, end };
}

function getPast7Range(date) {
  const d = new Date(date);
  const start = new Date(d);
  start.setDate(d.getDate() - 6);
  return { start: fmtDate(start), end: fmtDate(d) };
}

function fmtShort(d) {
  const parts = d.split('-');
  return parts[2] + '/' + parts[1];
}

function switchReportMode(btn) {
  document.querySelectorAll('.dr-mode-btn').forEach(function(x) {
    x.classList.remove('active');
    if (x.dataset.origLabel) x.textContent = x.dataset.origLabel;
  });
  btn.classList.add('active');
  loadReport();
}

function setupReportModes() {
  const mode = document.querySelector('.dr-mode-btn.active');
  const modeVal = mode ? mode.dataset.mode : 'daily';
  document.getElementById('drDailyPicker').style.display = modeVal === 'daily' ? 'flex' : 'none';
  document.getElementById('drCustomPicker').style.display = modeVal === 'custom' ? 'flex' : 'none';
}

document.getElementById('drRangeLoad').onclick = function() { loadReport(); };

async function loadReport() {
  const mode = document.querySelector('.dr-mode-btn.active');
  const modeVal = mode ? mode.dataset.mode : 'daily';
  setupReportModes();
  document.getElementById('drLoading').style.display = 'block';

  let startDate, endDate;
  if (modeVal === 'daily') {
    startDate = endDate = document.getElementById('drDate').value;
  } else if (modeVal === 'custom') {
    startDate = document.getElementById('drStartDate').value;
    endDate = document.getElementById('drEndDate').value;
    if (!startDate || !endDate) {
      document.getElementById('drLoading').style.display = 'none';
      return;
    }
  } else if (modeVal === 'weekly') {
    const r = getWeekRange(new Date());
    startDate = r.start; endDate = r.end;
  } else if (modeVal === 'month') {
    const r = getMonthRange(new Date());
    startDate = r.start; endDate = r.end;
  } else if (modeVal === 'lastmonth') {
    const r = getLastMonthRange(new Date());
    startDate = r.start; endDate = r.end;
  } else if (modeVal === 'past7') {
    const r = getPast7Range(new Date());
    startDate = r.start; endDate = r.end;
  }

  // Show date range on the active button
  if (mode && startDate && endDate) {
    if (!mode.dataset.origLabel) mode.dataset.origLabel = mode.textContent;
    if (modeVal === 'daily') {
      mode.textContent = mode.dataset.origLabel + ' (' + fmtShort(startDate) + ')';
    } else if (modeVal !== 'custom') {
      mode.textContent = mode.dataset.origLabel + ' (' + fmtShort(startDate) + ' - ' + fmtShort(endDate) + ')';
    }
  }

  try {
    let report;
    if (modeVal === 'daily') {
      report = await api('/api/report/daily', { date: startDate });
    } else {
      report = await api('/api/report/range', { startDate, endDate });
    }
    renderReport(report);
  } catch (e) {
    console.error('Failed to load report', e);
  }
  document.getElementById('drLoading').style.display = 'none';
}

function renderReport(report) {
  const d = report;
  const s = d.summary;
  const g = d.grab;
  const emptyEls = function() {
    document.getElementById('drSummary').innerHTML = '<div class=dr-empty>' + t('drNoData') + '</div>';
    document.getElementById('drTopProducts').innerHTML = '';
    document.getElementById('drCategory').innerHTML = '';
    document.getElementById('drHourly').innerHTML = '';
    document.getElementById('drInsights').innerHTML = '';
  };
  if (!s.totalOrders && !g.totalOrders) { emptyEls(); return; }

  /* 1. Summary Cards */
  const sumHTML = ''
    + '<div class=dr-card><div class=dr-card-label>' + t('drTotalRevenue') + '</div><div class=dr-card-value>฿' + s.totalRevenue + '</div></div>'
    + '<div class=dr-card><div class=dr-card-label>' + t('drOrders') + '</div><div class=dr-card-value>' + s.totalOrders + '</div></div>'
    + '<div class=dr-card><div class=dr-card-label>' + t('drAOV') + '</div><div class=dr-card-value>฿' + s.aov + '</div></div>'
    + '<div class=dr-card><div class=dr-card-label>' + t('drItemsSold') + '</div><div class=dr-card-value>' + s.totalItems + '</div></div>'
    + '<div class=dr-card><div class=dr-card-label>' + t('drDiscount') + '</div><div class=dr-card-value>฿' + s.totalDiscount + '</div></div>'
    + '<div class=dr-card><div class=dr-card-label>' + t('drCashReceived') + '</div><div class=dr-card-value>฿' + s.cashTotal + '</div></div>'
    + '<div class=dr-card><div class=dr-card-label>' + t('drQRReceived') + '</div><div class=dr-card-value>฿' + s.qrTotal + '</div></div>';
  document.getElementById('drSummary').innerHTML = sumHTML;

  /* 2. Top Selling Products */
  const top = d.topProducts;
  const maxQty = top.length ? top[0].qty : 1;
  let tpHTML = '';
  top.forEach(function(p, i) {
    const rc = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
    tpHTML += '<div class=dr-tp-row>'
      + "<span class='dr-tp-rank " + rc + "'>#" + (i + 1) + '</span>'
      + '<span class=dr-tp-name>' + p.name + '</span>'
      + '<span class=dr-tp-qty>' + p.qty + ' ' + t('drItems') + '</span>'
      + '<span class=dr-tp-rev>฿' + p.rev + '</span>'
      + '<div class=dr-tp-bar><div class=dr-tp-bar-fill style=width:' + Math.round(p.qty / maxQty * 100) + '%></div></div>'
      + '</div>';
  });
  document.getElementById('drTopProducts').innerHTML = tpHTML;

  /* 3. Category Breakdown */
  const cd = d.categoryBreakdown;
  const catTotal = cd.total;
  const catLabels = lang === 'th' ? catKeys.th : catKeys.en;
  let catHTML = '';
  [
    { k: 'Onigiri', l: catLabels[0], c: 'onigiri' },
    { k: 'Drinks', l: catLabels[2], c: 'drinks' },
    { k: 'Other', l: t('drOther'), c: 'other' }
  ].forEach(function(cat) {
    const v = cd[cat.k];
    const pct = catTotal > 0 ? Math.round(v / catTotal * 100) : 0;
    catHTML += '<div class=dr-cat-row>'
      + '<span class=dr-cat-label>' + cat.l + '</span>'
      + '<div class=dr-cat-bar><div class="dr-cat-bar-fill ' + cat.c + '" style=width:' + pct + '%></div></div>'
      + '<span class=dr-cat-value>฿' + v + '</span>'
      + '<span class=dr-cat-pct>' + pct + '%</span>'
      + '</div>';
  });
  document.getElementById('drCategory').innerHTML = catHTML;

  /* 4. Sales By Hour */
  const hourly = d.hourly;
  const maxRev = hourly.length ? Math.max.apply(null, hourly.map(function(h) { return h.rev; })) : 0;
  let hrHTML = '';
  hourly.forEach(function(h) {
    const pct = maxRev > 0 ? Math.round(h.rev / maxRev * 100) : 0;
    hrHTML += "<div class='dr-h-row" + (h.rev === maxRev ? ' dr-h-peak' : '') + "'>"
      + '<span class=dr-h-label>' + h.hour + ':00-' + (h.hour + 1) + ':00</span>'
      + '<span class=dr-h-orders>' + h.orders + ' ' + t('drOrdersCount') + '</span>'
      + '<div class=dr-h-bar><div class=dr-h-bar-fill style=width:' + pct + '%></div></div>'
      + '<span class=dr-h-rev>฿' + h.rev + '</span>'
      + '</div>';
  });
  document.getElementById('drHourly').innerHTML = hrHTML;

  /* 5. Insights */
  const bestName = top[0] ? top[0].name : '';
  const bestQty = top[0] ? top[0].qty : 0;
  const totalSold = top.reduce(function(s, p) { return s + p.qty; }, 0);
  const bestPct = totalSold > 0 ? Math.round(bestQty / totalSold * 100) : 0;
  const peakH = hourly.length ? hourly.reduce(function(max, h) { return h.rev > max.rev ? h : max; }, hourly[0]) : null;
  const displayName = lang === 'th' ? getThaiName(bestName) : bestName;
  let insightsHTML = ''
    + '<div class=dr-insight><span class=dr-insight-icon>🏆</span><span class=dr-insight-text>' + t('insightBestSeller') + ': <strong>' + displayName + '</strong> (' + bestQty + ' ' + t('drItems') + ', ' + bestPct + '%)</span></div>'
    + (peakH ? '<div class=dr-insight><span class=dr-insight-icon>⏰</span><span class=dr-insight-text>' + t('insightPeakHour') + ': <strong>' + peakH.hour + ':00-' + (peakH.hour + 1) + ':00</strong> (฿' + peakH.rev + ')</span></div>' : '')
    + '<div class=dr-insight><span class=dr-insight-icon>💰</span><span class=dr-insight-text>' + t('insightAOV') + ': <strong>฿' + s.aov + '</strong></span></div>'
    + (g.totalItems > 0 ? '<div class=dr-insight><span class=dr-insight-icon>🛵</span><span class=dr-insight-text>Grab: <strong>' + g.totalOrders + ' ' + t('drOrders') + '</strong>, <strong>' + g.totalItems + ' ' + t('drItems') + '</strong></span></div>' : '');
  document.getElementById('drInsights').innerHTML = insightsHTML;

function renderGrabProductList(products) {
  if (!products || !products.length) return '<div class=dr-empty>—</div>';
  const maxQty = products[0].qty || 1;
  let html = '';
  products.forEach(function(p) {
    html += '<div class=dr-tp-row>'
      + '<span class=dr-tp-name>' + p.name + '</span>'
      + '<span class=dr-tp-qty>' + p.qty + ' ' + t('drItems') + '</span>'
      + '<div class=dr-tp-bar><div class=dr-tp-bar-fill style=width:' + Math.round(p.qty / maxQty * 100) + '%></div></div>'
      + '</div>';
  });
  return html;
}

  /* 6. Grab Insights */
  const giEl = document.getElementById('drGrabInsights');
  if (giEl) {
    if (!g.totalOrders) {
      giEl.innerHTML = '<div class=dr-empty>' + t('drNoData') + '</div>';
    } else {
      giEl.innerHTML = '<div class=dr-gi-summary>'
        + '<div class=dr-gi-card><div class=dr-gi-label>' + t('drGrabOrders') + '</div><div class=dr-gi-value>' + g.totalOrders + '</div></div>'
        + '<div class=dr-gi-card><div class=dr-gi-label>' + t('drGrabOld') + '</div><div class=dr-gi-value>' + (g.oldOrders || 0) + '</div></div>'
        + '<div class=dr-gi-card><div class=dr-gi-label>' + t('drGrabNew') + '</div><div class=dr-gi-value>' + (g.newOrders || 0) + '</div></div>'
        + '<div class=dr-gi-card><div class=dr-gi-label>' + t('drGrabAds') + '</div><div class=dr-gi-value>' + (g.adsOrders || 0) + '</div></div>'
        + '<div class=dr-gi-card><div class=dr-gi-label>' + t('drGrabTotalOnigiri') + '</div><div class=dr-gi-value>' + (g.totalOnigiri || 0) + '</div></div>'
        + '<div class=dr-gi-card><div class=dr-gi-label>' + t('drGrabAvgPcs') + '</div><div class=dr-gi-value>' + (g.avgPcsPerBill || 0) + '</div></div>'
        + '</div>'
        + '<div class=dr-two-col style=margin-top:1rem>'
        + '<div class=dr-col><h3>' + t('drGrabTopProducts') + '</h3><div class=dr-top-products>' + renderGrabProductList(g.grabTopProducts) + '</div></div>'
        + '<div class=dr-col><h3>' + t('drGrabLowProducts') + '</h3><div class=dr-top-products>' + renderGrabProductList(g.grabLowProducts) + '</div></div>'
        + '</div>';
    }
  }
}

document.getElementById('drLoad').onclick = function() { loadReport(); };
document.getElementById('drRangeLoad').onclick = function() { loadReport(); };
document.getElementById('salesLoad').onclick = function() { rSales(); };

// ========== GRAB ORDERS ==========
let grabCart = {};
let grabActiveCat = null;

function rGrabOrder() {
  const dt = document.getElementById('grabDate');
  if (dt) dt.textContent = new Date().toLocaleDateString();
  const dp = document.getElementById('grabDatePicker');
  const dpVal = dp ? dp.value : '';
  rGrabCatBar();
  rGrabMenu();
  rGrabCart();
  rGrabHistory(dpVal || fmtDate(new Date()));
}

function rGrabCatBar() {
  const bar = document.getElementById('grabCatBar');
  if (!bar) return;
  bar.innerHTML = '';
  const cats = lang === 'th' ? catKeys.th : catKeys.en;
  const allBtn = document.createElement('button');
  allBtn.className = 'cat-btn' + (grabActiveCat === null ? ' active' : '');
  allBtn.textContent = t('all');
  allBtn.onclick = function() { grabActiveCat = null; rGrabCatBar(); rGrabMenu(); };
  bar.appendChild(allBtn);
  categories.forEach(function(cat, i) {
    const btn = document.createElement('button');
    btn.className = 'cat-btn' + (grabActiveCat === cat ? ' active' : '');
    btn.textContent = cats[i];
    btn.onclick = function() { grabActiveCat = cat; rGrabCatBar(); rGrabMenu(); };
    bar.appendChild(btn);
  });
}

function rGrabMenu() {
  const g = document.getElementById('grabMenuGrid');
  if (!g) return;
  g.innerHTML = '';
  const items = grabActiveCat ? menuItems.filter(function(m) { return m.cat === grabActiveCat; }) : menuItems;
  const catLabels = { en: categories, th: catKeys.th };
  items.forEach(function(m) {
    const c = document.createElement('div');
    c.className = 'menu-card';
    const name = lang === 'th' && m.th ? m.th : m.en;
    const ci = categories.indexOf(m.cat);
    const catName = ci !== -1 ? catLabels[lang][ci] : m.cat;
    c.innerHTML = '<div class=cat-label>' + catName + '</div><h3>' + name + '</h3>';
    c.onclick = function() { grabAddC(m.id); };
    g.appendChild(c);
  });
}

function grabAddC(id) { grabCart[id] = (grabCart[id] || 0) + 1; rGrabCart(); }
function grabRemC(id) { if (grabCart[id] > 1) grabCart[id]--; else delete grabCart[id]; rGrabCart(); }

function rGrabCart() {
  const ct = document.getElementById('grabCartItems');
  const sb = document.getElementById('grabSubmit');
  if (!ct) return;
  const ids = Object.keys(grabCart);
  ct.innerHTML = '';
  if (!ids.length) {
    ct.innerHTML = '<p class=empty-cart>' + t('noItems') + '</p>';
    sb.textContent = t('grabRecord') + ' (0)';
    return;
  }
  let totalQty = 0;
  ids.forEach(function(id) {
    const it = gi(id);
    if (!it) { delete grabCart[id]; return; }
    const q = grabCart[id];
    totalQty += q;
    const name = lang === 'th' && it.th ? it.th : it.en;
    const d = document.createElement('div');
    d.className = 'cart-item';
    d.innerHTML = '<div><div class=cart-item-name>' + name + '</div></div><div><button onclick=grabRemC("' + id + '")>−</button><span> ' + q + ' </span><button onclick=grabAddC("' + id + '")>+</button></div>';
    ct.appendChild(d);
  });
  sb.textContent = t('grabRecord') + ' (' + totalQty + ')';
}

async function rGrabHistory(dateStr) {
  const el = document.getElementById('grabHistory');
  if (!el) return;
  const targetDate = dateStr || fmtDate(new Date());
  try {
    const ords = await api('/api/grab/list', { date: targetDate });
    el.innerHTML = '';
    if (!ords.length) { el.innerHTML = '<p style="color:#888;text-align:center;padding:1rem 0">' + t('grabNoOrders') + '</p>'; return; }
    for (let i = ords.length - 1; i >= 0; i--) {
      const o = ords[i];
      const d = document.createElement('div');
      d.className = 'go-h-row';
      const is = [];
      for (let j = 0; j < o.items.length; j++) if (o.items[j].qty > 0) is.push(o.items[j].qty + 'x ' + o.items[j].name);
      const nr = o.orderNr ? ' #' + o.orderNr : '';
      const ct = o.customerType ? ' [' + o.customerType + ']' : '';
      d.innerHTML = '<span class=go-h-time>' + o.time + nr + ct + '</span><span class=go-h-items>' + (is.length ? is.join(', ') : '-') + '</span><button class=go-h-edit onclick=editGrabOrder(' + o.id + ')>' + t('editOrder') + '</button><button class=go-h-del onclick=deleteGrabOrder(' + o.id + ')>' + t('del') + '</button>';
      el.appendChild(d);
    }
  } catch (e) {
    el.innerHTML = '<p style="color:#888;text-align:center;padding:1rem 0">' + t('grabNoOrders') + '</p>';
  }
}

async function editGrabOrder(id) {
  try {
    const dp = document.getElementById('grabDatePicker');
    const date = dp ? dp.value : fmtDate(new Date());
    const ords = await api('/api/grab/list', { date: date });
    const found = ords.find(function(o) { return o.id === id; });
    if (!found) { alert('Order not found'); return; }
    grabCart = {};
    found.items.forEach(function(item) {
      const menuItem = menuItems.find(function(m) { return m.en === item.name; });
      if (menuItem) grabCart[menuItem.id] = (grabCart[menuItem.id] || 0) + item.qty;
    });
    document.getElementById('grabOrderNr').value = found.orderNr || '';
    const ctTypes = (found.customerType || '').split(',').filter(Boolean);
    const ctChecks = document.querySelectorAll('input[name="custType"]');
    ctChecks.forEach(function(c) { c.checked = ctTypes.indexOf(c.value) !== -1; });
    await api('/api/grab/delete', { id }).catch(function() {});
    rGrabCart();
  } catch (e) {
    alert('Failed to edit grab order');
  }
}

async function deleteGrabOrder(id) {
  if (!confirm(t('grabConfirmDelete'))) return;
  try {
    await api('/api/grab/delete', { id });
    rGrabHistory();
  } catch (e) {
    alert('Failed to delete grab order');
  }
}

document.getElementById('grabSubmit').onclick = async function() {
  const ids = Object.keys(grabCart);
  if (!ids.length) return;
  const items = [];
  ids.forEach(function(id) {
    const it = gi(id);
    if (it) items.push({ name: it.en, qty: grabCart[id] });
  });
  const orderNr = document.getElementById('grabOrderNr').value.trim();
  const custChecks = document.querySelectorAll('input[name="custType"]:checked');
  if (!orderNr) { alert('Please enter an order number'); return; }
  if (!custChecks.length) { alert('Please select at least one customer type'); return; }
  const customerType = Array.from(custChecks).map(function(c) { return c.value; }).join(',');
  try {
    await api('/api/grab/create', { items: items, orderNr: orderNr, customerType: customerType });
    grabCart = {};
    document.getElementById('grabOrderNr').value = '';
    document.querySelectorAll('input[name="custType"]').forEach(function(c) { c.checked = false; });
    rGrabCart();
    rGrabHistory();
  } catch (e) {
    alert('Failed to record grab order');
  }
};

// ========== TAB SWITCHING ==========

document.querySelectorAll('.tab-btn').forEach(function(b) {
  b.onclick = function() {
    document.querySelectorAll('.tab-btn').forEach(function(x) { x.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(x) { x.classList.remove('active'); });
    b.classList.add('active');
    document.getElementById('tab-' + b.dataset.tab).classList.add('active');
    if (b.dataset.tab === 'order') { rCatBar(); rMenu(); }
    if (b.dataset.tab === 'sales') rSales();
    if (b.dataset.tab === 'dailyreport') loadReport();
    if (b.dataset.tab === 'graborder') rGrabOrder();
    if (b.dataset.tab === 'menuedit') { rMeCat(); rMList(); }
  };
});

document.getElementById('checkoutBtn').onclick = checkout;

// ========== INIT ==========

async function initApp() {
  applyLang();
  document.getElementById('langToggle').onclick = toggleLang;
  await loadMenu();
  rCatBar();
  rMenu();
  const today = fmtDate(new Date());
  document.getElementById('orderDate').value = today;
  document.getElementById('drDate').value = today;
  document.getElementById('salesDate').value = today;
  document.getElementById('salesEndDate').value = today;
  document.getElementById('grabDatePicker').value = today;
  document.getElementById('grabDatePicker').onchange = function() {
    rGrabHistory(this.value);
  };
  document.getElementById('drStartDate').value = today;
  document.getElementById('drEndDate').value = today;
  setupReportModes();
  document.querySelectorAll('.dr-mode-btn').forEach(function(b) {
    b.dataset.origLabel = b.textContent;
  });
  rGrabOrder();
}

showPinScreen();
