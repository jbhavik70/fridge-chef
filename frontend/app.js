const cookBtn = document.getElementById('cook-btn');
const inputSection = document.getElementById('input-section');
const resultSection = document.getElementById('result-section');
const ingredientsInput = document.getElementById('ingredients-input');
const loadingState = document.getElementById('loading-state');
const loadingText = document.getElementById('loading-text');
const errorToast = document.getElementById('error-toast');
const resetBtn = document.getElementById('reset-btn');
const shareBtn = document.getElementById('share-btn');
const bookBtn = document.getElementById('book-btn');
const saveRecipeBtn = document.getElementById('save-recipe-btn');

// Tab Navigation Elements
const tabKitchen = document.getElementById('tab-kitchen');
const tabRecipeBox = document.getElementById('tab-recipe-box');
const tabReservations = document.getElementById('tab-reservations');
const kitchenView = document.getElementById('kitchen-view');
const recipeBoxView = document.getElementById('recipe-box-view');
const reservationsView = document.getElementById('reservations-view');
const reservationsList = document.getElementById('reservations-list');
const savedRecipesList = document.getElementById('saved-recipes-list');

// Booking Modal Elements
const bookingModal = document.getElementById('booking-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalFormContent = document.getElementById('modal-form-content');
const bookingForm = document.getElementById('booking-form');
const bookingName = document.getElementById('booking-name');
const bookingEmail = document.getElementById('booking-email');
const bookingPhone = document.getElementById('booking-phone');
const bookingLeftovers = document.getElementById('booking-leftovers');
const bookingRecipe = document.getElementById('booking-recipe');
const bookingGuests = document.getElementById('booking-guests');
const guestCountVal = document.getElementById('guest-count-val');
const bookingDate = document.getElementById('booking-date');
const bookingTime = document.getElementById('booking-time');
const bookingNotes = document.getElementById('booking-notes');

// Success State Elements
const bookingSuccessCard = document.getElementById('booking-success-card');
const receiptSummaryContent = document.getElementById('receipt-summary-content');
const successDoneBtn = document.getElementById('success-done-btn');

// Warning Card elements
const warningCard = document.getElementById('warning-card');
const warningMessageText = document.getElementById('warning-message-text');
const warningRetryBtn = document.getElementById('warning-retry-btn');

// Result Card elements
const recipeImgContainer = document.getElementById('recipe-img-container');
const recipeImage = document.getElementById('recipe-image');
const steamOverlay = document.getElementById('steam-overlay');
const recipeTitle = document.getElementById('recipe-title');
const recipeTags = document.getElementById('recipe-tags');
const recipeMeta = document.getElementById('recipe-meta');
const recipeIntro = document.getElementById('recipe-intro');
const recipeMixedNotice = document.getElementById('recipe-mixed-notice');
const recipeMixedNoticeText = document.getElementById('recipe-mixed-notice-text');
const ingredientsUl = document.getElementById('recipe-ingredients');
const recipeInstructions = document.getElementById('recipe-instructions');
const recipePantryStaples = document.getElementById('recipe-pantry-staples');
const grandmaSecretTipText = document.getElementById('grandma-secret-tip-text');
const portionScaler = document.querySelector('.portion-scaler');
const servingCount = document.getElementById('serving-count');
const scaleDownBtn = document.getElementById('scale-down-btn');
const scaleUpBtn = document.getElementById('scale-up-btn');

const loadingMessages = [
  "Grandma is putting on her apron...",
  "Searching the wooden recipe box...",
  "Preheating the cast iron skillet...",
  "Sifting the flour and checking the spice rack...",
  "Whipping up something special with a pinch of love..."
];

let loadingInterval;
let currentRecipeIngredients = [];
let currentServings = 2;

// Scoped selectors for Chef's Console
const mealTypeBtns = document.querySelectorAll('.meal-type-selector .segment-btn');
let selectedMealType = '';
mealTypeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    mealTypeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMealType = btn.getAttribute('data-meal') || '';
  });
});

const cookingStyleBtns = document.querySelectorAll('.cooking-style-selector .segment-btn');
let selectedCookingStyle = '';
cookingStyleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    cookingStyleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedCookingStyle = btn.getAttribute('data-style') || '';
  });
});

const timeLimitBtns = document.querySelectorAll('.time-limit-selector .segment-btn');
let selectedTimeLimit = '';
timeLimitBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    timeLimitBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedTimeLimit = btn.getAttribute('data-time') || '';
  });
});

const dietaryChipBtns = document.querySelectorAll('.dietary-chips .chip-btn');
let selectedDietary = [];
dietaryChipBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    const diet = btn.getAttribute('data-diet');
    if (btn.classList.contains('active')) {
      selectedDietary.push(diet);
    } else {
      selectedDietary = selectedDietary.filter(item => item !== diet);
    }
  });
});

const equipChipBtns = document.querySelectorAll('.equipment-chips .chip-btn');
let selectedEquipment = [];
equipChipBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    const equip = btn.getAttribute('data-equip');
    if (btn.classList.contains('active')) {
      selectedEquipment.push(equip);
    } else {
      selectedEquipment = selectedEquipment.filter(item => item !== equip);
    }
  });
});

let currentRecipeData = null; // store globally for saving to Wooden Recipe Box

// Main Action: Click "Cook!"
cookBtn.addEventListener('click', async () => {
  const ingredients = ingredientsInput.value.trim();
  if (!ingredients) {
    showToast("A blank plate is just an empty canvas, dear! Tell me what's in your fridge so we can fill it up.");
    return;
  }

  // UI changes for loading
  cookBtn.disabled = true;
  ingredientsInput.disabled = true;
  
  mealTypeBtns.forEach(btn => btn.disabled = true);
  cookingStyleBtns.forEach(btn => btn.disabled = true);
  timeLimitBtns.forEach(btn => btn.disabled = true);
  dietaryChipBtns.forEach(btn => btn.disabled = true);
  equipChipBtns.forEach(btn => btn.disabled = true);
  
  loadingState.classList.remove('hidden');
  errorToast.classList.add('hidden');
  
  let msgIndex = 0;
  loadingText.textContent = loadingMessages[msgIndex];
  loadingInterval = setInterval(() => {
    msgIndex = (msgIndex + 1) % loadingMessages.length;
    loadingText.textContent = loadingMessages[msgIndex];
  }, 2500);

  try {
    const response = await fetch('/api/recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ingredients,
        dietary_preferences: selectedDietary,
        meal_type: selectedMealType,
        cooking_style: selectedCookingStyle,
        equipment: selectedEquipment,
        time_limit: selectedTimeLimit
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || "Something went wrong.");
    }

    currentRecipeData = data; // store globally
    handleServerResponse(data);

  } catch (err) {
    showToast(err.message);
    resetFormState();
  } finally {
    clearInterval(loadingInterval);
  }
});

// Reset Form Controls to defaults
function resetFormState() {
  cookBtn.disabled = false;
  ingredientsInput.disabled = false;
  
  mealTypeBtns.forEach(btn => btn.disabled = false);
  cookingStyleBtns.forEach(btn => btn.disabled = false);
  timeLimitBtns.forEach(btn => btn.disabled = false);
  dietaryChipBtns.forEach(btn => btn.disabled = false);
  equipChipBtns.forEach(btn => btn.disabled = false);
  
  loadingState.classList.add('hidden');
}

// Handle data from endpoint
function handleServerResponse(data) {
  resetFormState();
  
  const status = data.input_status || "pure_food";
  
  if (status === "non_food" || status === "gibberish") {
    // Show warning card
    inputSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    
    warningMessageText.textContent = data.warning_message || "Oh dear, my spectacles must be dusty today! Let's write that again, sweetie.";
    warningCard.classList.remove('hidden');
    
    // accessibility focus on warning title
    warningCard.querySelector('.warning-title').focus();
  } else {
    // Show recipe results
    inputSection.classList.add('hidden');
    warningCard.classList.add('hidden');
    
    renderRecipe(data);
    resultSection.classList.remove('hidden');
    
    // accessibility focus on recipe title
    recipeTitle.focus();
  }
}

// Render recipe details on result card
function renderRecipe(data) {
  // Title
  recipeTitle.textContent = data.recipe_title || data.title || "Grandma's Comfort Dish";
  
  // Flavor Profile Tags
  recipeTags.innerHTML = '';
  const tags = data.flavor_tags || ["Cozy Classic"];
  tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'flavor-tag';
    span.textContent = tag;
    recipeTags.appendChild(span);
  });

  // Meta (prep time, cook time, difficulty)
  const prep = data.prep_time_minutes || 0;
  const cook = data.cook_time_minutes || 0;
  const diff = data.difficulty_level || "Cozy Classic";
  let metaParts = [];
  
  if (prep && cook) {
    metaParts.push(`Prep: ${prep} mins • Cook: ${cook} mins`);
  } else if (prep) {
    metaParts.push(`Prep: ${prep} mins`);
  } else if (cook) {
    metaParts.push(`Cook: ${cook} mins`);
  }
  
  metaParts.push(diff);
  recipeMeta.textContent = metaParts.join(' • ');

  // Grandma's Intro
  recipeIntro.textContent = data.grandma_intro || "Oh honey, you've got the makings of a wonderful meal! Let's get cooking...";

  // Mixed Notice
  if (data.input_status === "mixed" && data.warning_message) {
    recipeMixedNoticeText.textContent = data.warning_message;
    recipeMixedNotice.classList.remove('hidden');
  } else {
    recipeMixedNotice.classList.add('hidden');
  }

  // Portions scaling setup
  currentRecipeIngredients = data.ingredients || [];
  currentServings = data.servings_default || 2;
  servingCount.textContent = currentServings;

  if (currentRecipeIngredients.length > 0) {
    portionScaler.classList.remove('hidden');
    renderScaledIngredients();
  } else {
    // Fallback to legacy ingredientsList if ingredients array is missing
    portionScaler.classList.add('hidden');
    ingredientsUl.innerHTML = '';
    const legacyList = data.ingredientsList || [];
    legacyList.forEach((ing, index) => {
      const li = document.createElement('li');
      li.className = 'ingredient-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `ing-legacy-${index}`;
      
      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.textContent = ing;
      
      li.appendChild(checkbox);
      li.appendChild(label);
      ingredientsUl.appendChild(li);
    });
  }

  // Grandma's Secret Callout Box
  if (data.grandma_secret_tip) {
    grandmaSecretTipText.textContent = data.grandma_secret_tip;
    grandmaSecretTipText.parentElement.classList.remove('hidden');
  } else {
    grandmaSecretTipText.parentElement.classList.add('hidden');
  }

  // Clear any active timers when rendering a new recipe
  clearActiveTimer();

  // Steps Instructions List
  recipeInstructions.innerHTML = '';
  const steps = data.steps || data.instructions || [];
  steps.forEach((step, index) => {
    // Detect duration using regex
    const timeMatch = step.match(/(\d+)\s*(min|minute)/i);
    const durationMins = timeMatch ? parseInt(timeMatch[1], 10) : 5;

    const li = document.createElement('li');
    li.className = 'instruction-step';
    li.setAttribute('data-step-id', index);
    
    const num = document.createElement('div');
    num.className = 'step-number';
    num.textContent = index + 1;
    
    const stepContent = document.createElement('div');
    stepContent.className = 'step-content';
    
    const text = document.createElement('div');
    text.className = 'step-text';
    text.textContent = step;
    
    const timerWrapper = document.createElement('div');
    timerWrapper.className = 'step-timer-wrapper';
    timerWrapper.innerHTML = `
      <button type="button" class="step-timer-btn" data-duration="${durationMins}" aria-label="Start timer for ${durationMins} minutes">
        ⏱️ <span class="timer-duration-label">${durationMins}m</span>
      </button>
      <div class="step-timer-widget hidden">
        <span class="timer-display">05:00</span>
        <button type="button" class="timer-control-btn play-pause-btn" aria-label="Play/Pause">▶️</button>
        <button type="button" class="timer-control-btn reset-btn" aria-label="Reset">🔄</button>
        <button type="button" class="timer-control-btn cancel-btn" aria-label="Cancel">❌</button>
      </div>
    `;
    
    stepContent.appendChild(text);
    stepContent.appendChild(timerWrapper);
    
    li.appendChild(num);
    li.appendChild(stepContent);
    recipeInstructions.appendChild(li);
  });

  // Pantry Staples Accordion
  const staplesUl = document.getElementById('recipe-pantry-staples');
  staplesUl.innerHTML = '';
  const staples = data.pantry_staples || [];
  if (staples.length > 0) {
    staples.forEach(staple => {
      const li = document.createElement('li');
      li.textContent = staple;
      staplesUl.appendChild(li);
    });
    staplesUl.closest('.pantry-staples-accordion').classList.remove('hidden');
  } else {
    staplesUl.closest('.pantry-staples-accordion').classList.add('hidden');
  }

  // Image load & steam-clearing photo reveal reveal
  recipeImgContainer.classList.remove('clear-steam');
  if (data.imageUrl) {
    recipeImage.src = data.imageUrl;
    recipeImage.classList.remove('hidden');
    recipeImgContainer.classList.remove('hidden');
    
    // Fade out steam overlay when image fully loads
    recipeImage.onload = () => {
      setTimeout(() => {
        recipeImgContainer.classList.add('clear-steam');
      }, 500); // minor delay for sensory transition
    };
  } else {
    // If no image url returned (e.g. error or vertex timeout), show placeholder
    recipeImage.classList.add('hidden');
    recipeImgContainer.classList.add('clear-steam'); // immediately clear steam
    recipeImgContainer.classList.add('hidden'); // hide container
  }
}

// Render dynamic scaled ingredients
function renderScaledIngredients() {
  ingredientsUl.innerHTML = '';
  currentRecipeIngredients.forEach((item, index) => {
    const totalQty = item.quantity_per_serving * currentServings;
    // Clean up float formatting (e.g. 1.50 -> 1.5, 4.00 -> 4)
    const formattedQty = Number(totalQty.toFixed(2)).toString();
    const unit = (item.unit || '').trim();
    const name = (item.name || '').trim();
    
    const text = unit ? `${formattedQty} ${unit} ${name}` : `${formattedQty} ${name}`;
    
    const li = document.createElement('li');
    li.className = 'ingredient-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `ing-${index}`;
    
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = text;
    
    li.appendChild(checkbox);
    li.appendChild(label);
    ingredientsUl.appendChild(li);
  });
}

// Serving size increment / decrement
scaleDownBtn.addEventListener('click', () => {
  if (currentServings > 1) {
    currentServings--;
    servingCount.textContent = currentServings;
    if (currentRecipeIngredients.length > 0) {
      renderScaledIngredients();
    }
  }
});

scaleUpBtn.addEventListener('click', () => {
  currentServings++;
  servingCount.textContent = currentServings;
  if (currentRecipeIngredients.length > 0) {
    renderScaledIngredients();
  }
});

// Start Over action
function resetPage() {
  resultSection.classList.add('hidden');
  warningCard.classList.add('hidden');
  inputSection.classList.remove('hidden');
  
  ingredientsInput.value = '';
  selectedDietary = [];
  selectedMealType = '';
  
  // reset selector classes
  segmentBtns.forEach(btn => {
    btn.classList.remove('active');
    btn.disabled = false;
    if (btn.getAttribute('data-meal') === '') {
      btn.classList.add('active'); // reset to 'Any'
    }
  });
  
  chipBtns.forEach(btn => {
    btn.classList.remove('active');
    btn.disabled = false;
  });
  
  ingredientsInput.disabled = false;
  cookBtn.disabled = false;
  loadingState.classList.add('hidden');
}

resetBtn.addEventListener('click', resetPage);
warningRetryBtn.addEventListener('click', resetPage);

// Copy recipe clipboard exporter
shareBtn.addEventListener('click', () => {
  let text = `🍳 ${recipeTitle.textContent}\n`;
  if (recipeMeta.textContent) {
    text += `${recipeMeta.textContent}\n`;
  }
  text += `\n"${recipeIntro.textContent}"\n\n`;
  
  text += `Servings: ${currentServings}\n\n`;
  text += `Ingredients:\n`;
  
  const items = ingredientsUl.querySelectorAll('.ingredient-item');
  items.forEach(item => {
    const cb = item.querySelector('input[type="checkbox"]');
    const lbl = item.querySelector('label');
    const checkedSymbol = cb && cb.checked ? '✓ ' : '- ';
    text += `${checkedSymbol}${lbl.textContent}\n`;
  });
  
  const staples = Array.from(recipePantryStaples.children).map(li => li.textContent);
  if (staples.length > 0) {
    text += `\nPantry Staples Used:\n- ${staples.join('\n- ')}\n`;
  }
  
  text += `\nInstructions:\n`;
  const steps = recipeInstructions.querySelectorAll('.instruction-step');
  steps.forEach((step, idx) => {
    const stepText = step.querySelector('.step-text').textContent;
    text += `${idx + 1}. ${stepText}\n`;
  });
  
  if (grandmaSecretTipText.textContent) {
    text += `\nGrandma's Secret Tip: "${grandmaSecretTipText.textContent}"\n`;
  }
  
  text += `\nMade with love by Fridge Chef ❤️`;

  navigator.clipboard.writeText(text).then(() => {
    showToast("Recipe copied to your clipboard, dear! 📋");
  }).catch(err => {
    showToast("Oh honey, I couldn't copy it. Try taking a screenshot!");
  });
});

// Toast notification trigger
function showToast(msg) {
  errorToast.textContent = msg;
  errorToast.classList.remove('hidden');
  
  if (window.toastTimeout) {
    clearTimeout(window.toastTimeout);
  }
  
  window.toastTimeout = setTimeout(() => {
    errorToast.classList.add('hidden');
  }, 4000);
}

// ==========================================
// Tab Switching
// ==========================================
tabKitchen.addEventListener('click', () => {
  tabKitchen.classList.add('active');
  tabRecipeBox.classList.remove('active');
  tabReservations.classList.remove('active');
  
  kitchenView.classList.remove('hidden');
  recipeBoxView.classList.add('hidden');
  reservationsView.classList.add('hidden');
});

tabRecipeBox.addEventListener('click', () => {
  tabKitchen.classList.remove('active');
  tabRecipeBox.classList.add('active');
  tabReservations.classList.remove('active');
  
  kitchenView.classList.add('hidden');
  recipeBoxView.classList.remove('hidden');
  reservationsView.classList.add('hidden');
  
  loadSavedRecipes();
});

tabReservations.addEventListener('click', () => {
  tabKitchen.classList.remove('active');
  tabRecipeBox.classList.remove('active');
  tabReservations.classList.add('active');
  
  kitchenView.classList.add('hidden');
  recipeBoxView.classList.add('hidden');
  reservationsView.classList.remove('hidden');
  loadReservations();
});

// ==========================================
// Booking Modal Interactions
// ==========================================
bookingGuests.addEventListener('input', () => {
  guestCountVal.textContent = bookingGuests.value;
});

bookBtn.addEventListener('click', () => {
  // Pre-fill leftovers from fridge input, and recipe title
  bookingLeftovers.value = ingredientsInput.value.trim();
  bookingRecipe.value = recipeTitle.textContent.trim();
  
  // Set guests count based on servings count scaler
  bookingGuests.value = currentServings;
  guestCountVal.textContent = currentServings;
  
  // Reset notes, name, email, phone
  bookingNotes.value = '';
  
  // Set default date to tomorrow and default time to 18:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  bookingDate.value = tomorrow.toISOString().split('T')[0];
  bookingTime.value = "18:00";
  
  // Show modal, show form, hide success state
  bookingModal.classList.remove('hidden');
  modalFormContent.classList.remove('hidden');
  bookingSuccessCard.classList.add('hidden');
});

closeModalBtn.addEventListener('click', () => {
  bookingModal.classList.add('hidden');
});

bookingModal.addEventListener('click', (e) => {
  if (e.target === bookingModal) {
    bookingModal.classList.add('hidden');
  }
});

// Confirm booking form submission
bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const payload = {
    name: bookingName.value.trim(),
    email: bookingEmail.value.trim(),
    phone: bookingPhone.value.trim() || null,
    leftovers: bookingLeftovers.value.trim(),
    recipe_title: bookingRecipe.value.trim(),
    guests: parseInt(bookingGuests.value, 10),
    date: bookingDate.value,
    time: bookingTime.value,
    notes: bookingNotes.value.trim() || null
  };
  
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Could not save your reservation, dear.");
    }
    
    // Transition to success checkmark screen
    modalFormContent.classList.add('hidden');
    
    // Insert ticket summary
    receiptSummaryContent.innerHTML = `
      <div class="receipt-ticket">
        <div class="receipt-header-row">
          <span class="receipt-title-text">${data.recipe_title}</span>
          <span class="countdown-badge" data-datetime="${data.date}T${data.time}">Calculating...</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Guest Name</span>
          <span class="receipt-value">${data.name}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Date & Time</span>
          <span class="receipt-value">${data.date} at ${data.time}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Guests Count</span>
          <span class="receipt-value">${data.guests} guests</span>
        </div>
      </div>
    `;
    bookingSuccessCard.classList.remove('hidden');
    
    // Update success countdown immediately
    updateCountdowns();
    
    // Refresh dashboard list
    loadReservations();
    
  } catch (err) {
    showToast(err.message);
  }
});

successDoneBtn.addEventListener('click', () => {
  bookingModal.classList.add('hidden');
});

// ==========================================
// Dashboard Load & Countdown Logic
// ==========================================
async function loadReservations() {
  try {
    const res = await fetch('/api/bookings');
    if (!res.ok) {
      throw new Error("Could not load your reservations, dear.");
    }
    const bookings = await res.json();
    renderReservationsList(bookings);
  } catch (err) {
    showToast(err.message);
  }
}

function renderReservationsList(bookings) {
  reservationsList.innerHTML = '';
  if (bookings.length === 0) {
    reservationsList.innerHTML = `
      <div class="empty-reservations">
        <p>No reservations booked yet, dear. Generate a recipe to book your preparation!</p>
      </div>
    `;
    return;
  }
  
  bookings.forEach(booking => {
    const card = document.createElement('div');
    card.className = 'receipt-ticket';
    
    card.innerHTML = `
      <div class="receipt-header-row">
        <span class="receipt-title-text">${booking.recipe_title || "Comfort Meal"}</span>
        <span class="countdown-badge" data-datetime="${booking.date}T${booking.time}">Calculating...</span>
      </div>
      <div class="receipt-meta-info">
        Reservation #${booking.id}
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Guest Name</span>
        <span class="receipt-value">${booking.name}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Email</span>
        <span class="receipt-value">${booking.email}</span>
      </div>
      ${booking.phone ? `
      <div class="receipt-row">
        <span class="receipt-label">Phone</span>
        <span class="receipt-value">${booking.phone}</span>
      </div>` : ''}
      <div class="receipt-row">
        <span class="receipt-label">Date & Time</span>
        <span class="receipt-value">${booking.date} at ${booking.time}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Guests Count</span>
        <span class="receipt-value">${booking.guests} guest${booking.guests !== 1 ? 's' : ''}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Leftovers to Bring</span>
        <span class="receipt-value">${booking.leftovers}</span>
      </div>
      ${booking.notes ? `
      <div class="receipt-row">
        <span class="receipt-label">Notes for Grandma</span>
        <span class="receipt-value">${booking.notes}</span>
      </div>` : ''}
      
      <div class="cancel-btn-container">
        <span></span>
        <button type="button" class="cancel-booking-btn" data-id="${booking.id}">Cancel Reservation</button>
      </div>
    `;
    
    reservationsList.appendChild(card);
  });
  
  // Update countdowns immediately
  updateCountdowns();
}

function updateCountdowns() {
  document.querySelectorAll('.countdown-badge').forEach(badge => {
    const dtStr = badge.getAttribute('data-datetime');
    if (!dtStr) return;
    
    const targetDate = new Date(dtStr);
    const now = new Date();
    const diffMs = targetDate - now;
    
    if (diffMs < -3600000) {
      badge.textContent = "Passed";
      badge.style.backgroundColor = "rgba(44, 34, 30, 0.05)";
      badge.style.color = "var(--color-text-muted)";
    } else if (diffMs < 0) {
      badge.textContent = "Happening now! 🍳";
      badge.style.backgroundColor = "var(--color-warning-bg)";
      badge.style.color = "var(--color-primary)";
    } else {
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      const remainingHours = diffHours % 24;
      const remainingMins = diffMins % 60;
      
      if (diffDays > 0) {
        badge.textContent = `In ${diffDays} day${diffDays !== 1 ? 's' : ''}, ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
      } else if (remainingHours > 0) {
        badge.textContent = `Today in ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}, ${remainingMins} min${remainingMins !== 1 ? 's' : ''}`;
      } else {
        badge.textContent = `Today in ${remainingMins} min${remainingMins !== 1 ? 's' : ''}`;
      }
    }
  });
}

// Cancel Booking
reservationsList.addEventListener('click', async (e) => {
  if (e.target.classList.contains('cancel-booking-btn')) {
    const bookingId = e.target.getAttribute('data-id');
    if (confirm("Are you sure you want to cancel this booking, dear? Grandma was looking forward to it!")) {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          throw new Error("Oh dear, I couldn't cancel the reservation. Please try again.");
        }
        showToast("Reservation cancelled successfully, dear.");
        loadReservations();
      } catch (err) {
        showToast(err.message);
      }
    }
  }
});

// Periodic Countdown Updater
setInterval(updateCountdowns, 5000);
