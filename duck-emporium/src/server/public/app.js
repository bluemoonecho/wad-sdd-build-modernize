const state = {
  ducks: [],
  cart: { items: [], runningTotal: 0 },
  quizQuestions: [],
};

const el = {
  globalError: document.querySelector('#global-error'),
  duckDayContent: document.querySelector('#duck-day-content'),
  filtersForm: document.querySelector('#filters-form'),
  queryInput: document.querySelector('#query-input'),
  categoryInput: document.querySelector('#category-input'),
  minPriceInput: document.querySelector('#min-price-input'),
  maxPriceInput: document.querySelector('#max-price-input'),
  catalogGrid: document.querySelector('#catalog-grid'),
  catalogEmpty: document.querySelector('#catalog-empty'),
  detailContent: document.querySelector('#detail-content'),
  cartContent: document.querySelector('#cart-content'),
  checkoutForm: document.querySelector('#checkout-form'),
  checkoutMessage: document.querySelector('#checkout-message'),
  openCheckout: document.querySelector('#open-checkout'),
  quizForm: document.querySelector('#quiz-form'),
  quizSubmit: document.querySelector('#quiz-submit'),
  quizResult: document.querySelector('#quiz-result'),
};

function showGlobalError(message) {
  el.globalError.textContent = message;
  el.globalError.classList.remove('hidden');
}

function clearGlobalError() {
  el.globalError.textContent = '';
  el.globalError.classList.add('hidden');
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || `Request failed (${response.status})`);
  }

  return body;
}

function renderCatalog(ducks, emptyStateMessage) {
  el.catalogGrid.innerHTML = '';

  if (!ducks.length) {
    el.catalogEmpty.textContent = emptyStateMessage || 'No ducks found.';
    el.catalogEmpty.classList.remove('hidden');
    return;
  }

  el.catalogEmpty.classList.add('hidden');

  for (const duck of ducks) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${duck.name}</h3>
      <p class="card-meta">${duck.category} · $${duck.price.toFixed(2)}</p>
      <p>${duck.tagline}</p>
      <div class="card-actions">
        <button class="link-btn" data-detail="${duck.id}">View detail</button>
        <button class="btn" data-add="${duck.id}">Add to cart</button>
      </div>
    `;

    el.catalogGrid.append(card);
  }
}

function renderDuckOfTheDay(payload) {
  if (!payload.duck) {
    el.duckDayContent.innerHTML = `<p class="message muted">${payload.emptyStateMessage}</p>`;
    return;
  }

  el.duckDayContent.innerHTML = `
    <div>
      <h3>${payload.duck.name}</h3>
      <p>${payload.duck.tagline}</p>
      <p class="card-meta">${payload.duck.category} · $${payload.duck.price.toFixed(2)}</p>
    </div>
    <button class="btn" id="duck-day-link">Jump to detail</button>
  `;

  document.querySelector('#duck-day-link')?.addEventListener('click', () => {
    loadDuckDetail(payload.duck.id);
  });
}

function renderDetail(detail) {
  const traits = detail.personalityTraits.map((trait) => `<li>${trait}</li>`).join('');

  el.detailContent.classList.remove('muted');
  el.detailContent.innerHTML = `
    <h3>${detail.name}</h3>
    <p class="card-meta">${detail.category} · $${detail.price.toFixed(2)} · ${detail.stockLevel}</p>
    <p>${detail.longDescription}</p>
    <ul>${traits}</ul>
    <button class="btn" id="add-detail-cart">Add to Cart</button>
  `;

  document.querySelector('#add-detail-cart')?.addEventListener('click', async () => {
    await addToCart(detail.id, 1);
  });
}

function renderCart() {
  el.cartContent.innerHTML = '';

  if (!state.cart.items.length) {
    el.cartContent.innerHTML = '<p class="muted">Your cart is currently empty.</p>';
    return;
  }

  for (const item of state.cart.items) {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <div class="card-meta">$${item.unitPrice.toFixed(2)} each</div>
      </div>
      <input class="qty-input" type="number" min="0" value="${item.quantity}" data-qty="${item.duckId}" />
      <button class="link-btn" data-remove="${item.duckId}">Remove</button>
    `;
    el.cartContent.append(row);
  }

  const total = document.createElement('p');
  total.innerHTML = `<strong>Total: $${state.cart.runningTotal.toFixed(2)}</strong>`;
  el.cartContent.append(total);
}

function renderQuiz(questions) {
  el.quizForm.innerHTML = '';

  for (const question of questions) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'quiz-question';
    fieldset.dataset.questionId = question.id;

    const options = question.options
      .map(
        (option) => `
        <label>
          <input type="radio" name="${question.id}" value="${option.id}" />
          ${option.text}
        </label>
      `,
      )
      .join('');

    fieldset.innerHTML = `<legend>${question.prompt}</legend>${options}`;
    el.quizForm.append(fieldset);
  }
}

function setCheckoutMessage(message, isError = false) {
  el.checkoutMessage.textContent = message;
  el.checkoutMessage.classList.remove('hidden', 'error', 'success');
  el.checkoutMessage.classList.add(isError ? 'error' : 'success');
}

function setQuizResult(message, isError = false) {
  el.quizResult.textContent = message;
  el.quizResult.classList.remove('hidden', 'error', 'success');
  el.quizResult.classList.add(isError ? 'error' : 'success');
}

async function loadCatalog() {
  clearGlobalError();
  const params = new URLSearchParams();

  if (el.queryInput.value.trim()) {
    params.set('query', el.queryInput.value.trim());
  }

  if (el.categoryInput.value) {
    params.append('category', el.categoryInput.value);
  }

  if (el.minPriceInput.value) {
    params.set('minPrice', el.minPriceInput.value);
  }

  if (el.maxPriceInput.value) {
    params.set('maxPrice', el.maxPriceInput.value);
  }

  const query = params.toString();
  const endpoint = query ? `/ducks?${query}` : '/ducks';

  try {
    const data = await fetchJson(endpoint);
    state.ducks = data.ducks;
    renderCatalog(data.ducks, data.emptyStateMessage);

    const categories = [...new Set(data.ducks.map((duck) => duck.category))].sort();
    const currentSelection = el.categoryInput.value;
    el.categoryInput.innerHTML = '<option value="">All categories</option>';

    for (const category of categories) {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      if (category === currentSelection) {
        option.selected = true;
      }
      el.categoryInput.append(option);
    }
  } catch (error) {
    showGlobalError(error instanceof Error ? error.message : 'Failed to load catalog.');
  }
}

async function loadDuckDetail(duckId) {
  clearGlobalError();

  try {
    const data = await fetchJson(`/ducks/${duckId}`);
    renderDetail(data.duck);
    el.detailContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    showGlobalError(error instanceof Error ? error.message : 'Failed to load duck detail.');
  }
}

async function loadDuckOfDay() {
  try {
    const data = await fetchJson('/duck-of-the-day');
    renderDuckOfTheDay(data);
  } catch (error) {
    showGlobalError(error instanceof Error ? error.message : 'Failed to load duck of the day.');
  }
}

async function loadCart() {
  try {
    state.cart = await fetchJson('/cart');
    renderCart();
  } catch (error) {
    showGlobalError(error instanceof Error ? error.message : 'Failed to load cart.');
  }
}

async function addToCart(duckId, quantity) {
  try {
    state.cart = await fetchJson('/cart/items', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ duckId, quantity }),
    });
    renderCart();
  } catch (error) {
    showGlobalError(error instanceof Error ? error.message : 'Failed to add to cart.');
  }
}

async function updateCartQuantity(duckId, quantity) {
  try {
    state.cart = await fetchJson(`/cart/items/${duckId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    renderCart();
  } catch (error) {
    showGlobalError(error instanceof Error ? error.message : 'Failed to update cart.');
    await loadCart();
  }
}

async function removeFromCart(duckId) {
  try {
    state.cart = await fetchJson(`/cart/items/${duckId}`, {
      method: 'DELETE',
    });
    renderCart();
  } catch (error) {
    showGlobalError(error instanceof Error ? error.message : 'Failed to remove item.');
  }
}

async function submitCheckout(event) {
  event.preventDefault();
  const formData = new FormData(el.checkoutForm);

  const payload = {
    shippingName: String(formData.get('shippingName') || ''),
    shippingEmail: String(formData.get('shippingEmail') || ''),
    shippingAddress: String(formData.get('shippingAddress') || ''),
    mockedCardDetails: String(formData.get('mockedCardDetails') || ''),
  };

  try {
    const confirmation = await fetchJson('/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setCheckoutMessage(
      `Order ${confirmation.orderId} confirmed. ${confirmation.summary.items.length} item(s), total $${confirmation.summary.total.toFixed(2)}.`,
    );
    el.checkoutForm.reset();
    await loadCart();
    await loadCatalog();
    await loadDuckOfDay();
  } catch (error) {
    setCheckoutMessage(error instanceof Error ? error.message : 'Checkout failed.', true);
  }
}

async function loadQuiz() {
  try {
    const data = await fetchJson('/quiz/questions');
    state.quizQuestions = data.questions;
    renderQuiz(state.quizQuestions);
  } catch (error) {
    showGlobalError(error instanceof Error ? error.message : 'Failed to load quiz.');
  }
}

async function submitQuiz() {
  const answers = state.quizQuestions.map((question) => {
    const checked = document.querySelector(`input[name="${question.id}"]:checked`);
    return {
      questionId: question.id,
      optionId: checked ? checked.value : '',
    };
  });

  try {
    const result = await fetchJson('/quiz/result', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ answers }),
    });

    setQuizResult(
      `${result.message} Recommended: ${result.duck.name}. Open detail: ${result.detailPath}`,
    );
  } catch (error) {
    setQuizResult(error instanceof Error ? error.message : 'Quiz failed.', true);
  }
}

function bindEvents() {
  el.filtersForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await loadCatalog();
  });

  el.catalogGrid.addEventListener('click', async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const detailId = target.getAttribute('data-detail');
    if (detailId) {
      await loadDuckDetail(detailId);
      return;
    }

    const addId = target.getAttribute('data-add');
    if (addId) {
      await addToCart(addId, 1);
    }
  });

  el.cartContent.addEventListener('change', async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const duckId = target.getAttribute('data-qty');
    if (!duckId) {
      return;
    }

    await updateCartQuantity(duckId, Number(target.value));
  });

  el.cartContent.addEventListener('click', async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const duckId = target.getAttribute('data-remove');
    if (duckId) {
      await removeFromCart(duckId);
    }
  });

  el.checkoutForm.addEventListener('submit', submitCheckout);
  el.openCheckout.addEventListener('click', () => {
    document.querySelector('#checkout-title')?.scrollIntoView({ behavior: 'smooth' });
  });

  el.quizSubmit.addEventListener('click', submitQuiz);
}

async function boot() {
  bindEvents();
  await Promise.all([loadCatalog(), loadDuckOfDay(), loadCart(), loadQuiz()]);
}

boot();
