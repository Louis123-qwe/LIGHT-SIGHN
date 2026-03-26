/* ═══════════════════════════════════════════════════════════════
   Light Sighn Medical Equipments — Storefront Logic (app.js)
   UPDATED: Auto Cart + Bulk WhatsApp Checkout
   ═══════════════════════════════════════════════════════════════
   :
*/
const SUPABASE_URL    = 'https://tmjmzqoicckulkbdawdl.supabase.co';
const SUPABASE_ANON   = 'sb_publishable_Ula74NBJV5GnVTwvdbF6zQ_kN_miVt4';
const WHATSAPP_NUMBER = '2348130522019'; // no '+'

/* ═══════════════════════════════════════════════════════════════ */

let allProducts    = [];
let activeCategory = 'all';
let searchQuery    = '';
let cart           = JSON.parse(localStorage.getItem('cart') || '[]');

/* ── DOM references ───────────────────────────────────────────── */
const grid         = document.getElementById('productGrid');
const emptyState   = document.getElementById('emptyState');
const resultsMeta  = document.getElementById('resultsMeta');
const searchInput  = document.getElementById('searchInput');
const searchClear  = document.getElementById('searchClear');
const filterBar    = document.getElementById('filterBar');
const modalOverlay = document.getElementById('modalOverlay');
const modalBody    = document.getElementById('modalBody');
const modalClose   = document.getElementById('modalClose');
const navbar       = document.getElementById('navbar');
const hamburger    = document.getElementById('hamburger');
const mobileMenu   = document.getElementById('mobileMenu');

/* ── Init ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('yr').textContent = new Date().getFullYear();
  fetchProducts();
  attachEvents();
  updateCartCount();
});

/* ── Supabase fetch ───────────────────────────────────────────── */
async function fetchProducts() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc`,
      {
        headers: {
          'apikey':        SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`,
        },
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allProducts = await res.json();
    renderProducts();
  } catch (err) {
    console.error('Fetch error:', err);
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Could not load products</h3>
        <p>Please refresh and try again.</p>
        <button class="btn-primary" onclick="fetchProducts()">Retry</button>
      </div>`;
  }
}

/* ── Render ───────────────────────────────────────────────────── */
function renderProducts() {
  let filtered = allProducts;

  if (activeCategory !== 'all') filtered = filtered.filter(p => p.category === activeCategory);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }

  grid.innerHTML = '';
  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    resultsMeta.textContent = '';
    return;
  }

  emptyState.style.display = 'none';
  resultsMeta.textContent = `Showing ${filtered.length} product${filtered.length !== 1 ? 's' : ''}${activeCategory !== 'all' ? ' in ' + categoryLabel(activeCategory) : ''}`;

  filtered.forEach((p, i) => {
    const card = buildCard(p, i);
    grid.appendChild(card);
  });
}

/* ── Card builder ─────────────────────────────────────────────── */
function buildCard(p, index) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.style.animationDelay = `${index * 0.05}s`;

  const stockClass = stockCls(p.stock);
  const stockLabel = stockText(p.stock);
  const imgSrc     = p.image || 'https://via.placeholder.com/300';
  const price      = parseFloat(p.price || 0).toFixed(2);

  card.innerHTML = `
    <div class="card-image">
      <img src="${escHtml(imgSrc)}" alt="${escHtml(p.name)}" loading="lazy"
           onerror="this.src='https://via.placeholder.com/300?text=No+Image'" />
      ${p.badge ? `<span class="card-badge">${escHtml(p.badge)}</span>` : ''}
      <span class="stock-dot ${stockClass}">${stockLabel}</span>
    </div>
    <div class="card-body">
      <span class="card-cat">${escHtml(categoryLabel(p.category))}</span>
      <h3 class="card-name">${escHtml(p.name)}</h3>
      <p class="card-desc">${escHtml(p.description || '')}</p>
      <div class="card-price">
        ₦${Number(price).toLocaleString('en-NG', {minimumFractionDigits:2})}
        ${p.unit ? `<small>/ ${escHtml(p.unit)}</small>` : ''}
      </div>
    </div>
    <div class="card-footer">
      <button class="btn-whatsapp" data-id="${p.id}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Add to Cart
      </button>
    </div>`;

  card.addEventListener('click', e => {
    if (!e.target.closest('.btn-whatsapp')) openModal(p);
  });

  card.querySelector('.btn-whatsapp').addEventListener('click', e => {
    e.stopPropagation();
    addToCart(p);
  });

  return card;
}

/* ── CART LOGIC ──────────────────────────────────────────────── */
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(p) {
  const existing = cart.find(item => item.id === p.id);
  if (existing) existing.quantity += 1;
  else cart.push({ id: p.id, name: p.name, price: parseFloat(p.price||0), category: p.category, unit: p.unit||'', quantity: 1 });

  saveCart();
  updateCartCount();
  showToast('🛒 Added to cart');
}

function updateCartCount() {
  const el = document.getElementById('cartCount');
  if (!el) return;
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  el.textContent = count;
}

/* ── BULK WHATSAPP CHECKOUT ─────────────────────────────────── */
function checkoutCart() {
  if (!cart.length) { showToast('⚠️ Cart is empty'); return; }

  let total = 0;
  let message = `Hello Light Sighn Medical Equipments! 👋\n\nI would like to order:\n\n`;

  cart.forEach((item, i) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    message += `${i+1}. ${item.name} (${categoryLabel(item.category)})\nQty: ${item.quantity}\nPrice: ₦${itemTotal.toLocaleString('en-NG')}\n\n`;
  });

  message += `Total: ₦${total.toLocaleString('en-NG')}\n\nPlease confirm availability.`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');

  cart = [];
  saveCart();
  updateCartCount();
}

/* ── Modal ────────────────────────────────────────────────────── */
function openModal(p) {
  const price  = parseFloat(p.price || 0).toFixed(2);
  const specs  = p.specs && typeof p.specs==='object'?p.specs:{};
  const hasSpecs = Object.keys(specs).length>0;

  const specsHtml = hasSpecs
    ? `<dl class="modal-specs">${Object.entries(specs).map(([k,v]) =>
        `<div class="spec-chip"><dt>${escHtml(k.replace(/_/g,' '))}</dt><dd>${escHtml(String(v))}</dd></div>`).join('')}</dl>`
    : '';

  modalBody.innerHTML = `
    <img class="modal-img" src="${escHtml(p.image||'https://via.placeholder.com/600x300')}" alt="${escHtml(p.name)}"
         onerror="this.src='https://via.placeholder.com/600x300?text=No+Image'" />
    <p class="modal-cat">${escHtml(categoryLabel(p.category))}</p>
    <h2 class="modal-name">${escHtml(p.name)}</h2>
    <p class="modal-desc">${escHtml(p.description||'No description available.')}</p>
    <div class="modal-price">₦${Number(price).toLocaleString('en-NG',{minimumFractionDigits:2})}${p.unit?` / ${escHtml(p.unit)}`:''}</div>
    ${specsHtml}
    <button class="btn-whatsapp" id="modalWA" style="margin-top:8px">Add to Cart</button>`;

  document.getElementById('modalWA').addEventListener('click', ()=>addToCart(p));
  modalOverlay.style.display='flex';
  document.body.style.overflow='hidden';
}

function closeModal(){ modalOverlay.style.display='none'; document.body.style.overflow=''; }

/* ── EVENTS ───────────────────────────────────────────────────── */
function attachEvents() {
  // filters
  filterBar.addEventListener('click', e=>{
    const btn=e.target.closest('.filter-btn'); if(!btn) return;
    filterBar.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory=btn.dataset.cat;
    renderProducts();
  });

  // search
  searchInput.addEventListener('input',()=>{ searchQuery=searchInput.value.trim(); searchClear.classList.toggle('visible',searchQuery.length>0); renderProducts(); });
  searchInput.addEventListener('keydown', e=>{ if(e.key==='Escape') resetFilters(); });
  searchClear.addEventListener('click',()=>{ searchInput.value=''; searchQuery=''; searchClear.classList.remove('visible'); renderProducts(); searchInput.focus(); });

  // modal
  modalClose.addEventListener('click',closeModal);
  modalOverlay.addEventListener('click', e=>{ if(e.target===modalOverlay) closeModal(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

  // navbar scroll
  window.addEventListener('scroll',()=>{ navbar.classList.toggle('scrolled',window.scrollY>10); }, {passive:true});

  // hamburger
  hamburger.addEventListener('click',()=>{ mobileMenu.classList.toggle('open'); });

  // bulk cart checkout
  document.getElementById('checkoutBtn')?.addEventListener('click', checkoutCart);
}

/* ── Helpers ──────────────────────────────────────────────────── */
function resetFilters(){ searchInput.value=''; searchQuery=''; activeCategory='all'; searchClear.classList.remove('visible'); filterBar.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active')); filterBar.querySelector('[data-cat="all"]').classList.add('active'); renderProducts(); }
function setFilter(cat){ activeCategory=cat; filterBar.querySelectorAll('.filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.cat===cat)); renderProducts(); document.getElementById('products').scrollIntoView({behavior:'smooth'}); }
function closeMobileMenu(){ mobileMenu.classList.remove('open'); }
function categoryLabel(cat){ const map={drugs:'Drugs',beds:'Hospital Beds',accessories:'Accessories',consumables:'Consumables'}; return map[cat]||cat; }
function stockCls(s){ if(s==='instock') return 'stock-instock'; if(s==='low') return 'stock-low'; return 'stock-outstock'; }
function stockText(s){ if(s==='instock') return '● In Stock'; if(s==='low') return '● Low Stock'; return '● Out of Stock'; }
function escHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function showToast(msg){ console.log(msg); }
/* ── MINI CART DISPLAY ────────────────────────────────────────── */
function renderMiniCart() {
  const container = document.getElementById('miniCartItems');
  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#666;">Cart is empty</p>';
    return;
  }

  cart.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'mini-item';
    div.innerHTML = `
      <span>${item.name} x ${item.quantity}</span>
      <button data-id="${item.id}">&times;</button>
    `;
    container.appendChild(div);

    div.querySelector('button').addEventListener('click', () => {
      removeFromCart(item.id);
    });
  });
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartCount();
  renderMiniCart();
}

/* ── HOOK MINI-CART INTO EXISTING FUNCTIONS ─────────────────── */
function addToCart(p) {
  const existing = cart.find(item => item.id === p.id);
  if (existing) existing.quantity += 1;
  else cart.push({ id: p.id, name: p.name, price: parseFloat(p.price||0), category: p.category, unit: p.unit||'', quantity: 1 });

  saveCart();
  updateCartCount();
  renderMiniCart();
  showToast('🛒 Added to cart');
}

/* render on page load */
document.addEventListener('DOMContentLoaded', renderMiniCart);

/* attach checkout from mini-cart button */
document.getElementById('checkoutBtnMini')?.addEventListener('click', checkoutCart);