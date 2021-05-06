const NM = 1;
const LP = 36;
const MP = 34;
const HP = 35;
const DM = 33;
const NMF = 3;
const LPF = 70;
const MPF = 68;
const HPF = 69;
const DMF = 67;
const conditions = [NM, LP, MP, HP, DM, NMF, LPF, MPF, HPF, DMF];

console.log("content.js Connected");

const updateCurrentPrices = (prices, grade, price) => {
  switch (grade) {
    case NM:
      prices.nm = price;
      break;
    case LP:
      prices.lp = price;
      break;
    case MP:
      prices.mp = price;
      break;
    case HP:
      prices.hp = price;
      break;
    case DM:
      prices.dm = price;
      break;
    case NMF:
      prices.nmf = price;
      break;
    case LPF:
      prices.lpf = price;
      break;
    case MPF:
      prices.mpf = price;
      break;
    case HPF:
      prices.hpf = price;
      break;
    default: // case DMF:
      prices.dmf = price;
      break;
  }
}

const handleNonFoil = (element, lowest, last, market, prices, grade) => {
  let price = 0;
  console.log(`doing ${grade}`);
  switch (grade) {
    case LP:
      price = prices.nm * .9;
      if (lowest > price && lowest < prices.nm) {
        price = lowest;
      }
      if (last <= lowest && last > price && last <= prices.nm) {
        price = last;
      }
      break;
    case MP:
      price = prices.lp * .9;
      if (lowest > price && lowest < prices.lp) {
        price = lowest;
      }
      if (last <= lowest && last > price && last <= prices.lp) {
        price = last;
      }
      break;
    case HP:
      price = prices.mp * .9;
      if (lowest > price && lowest < prices.mp) {
        price = lowest;
      }
      if (last <= lowest && last > price && last <= prices.mp) {
        price = last;
      }
      break;
    case DM:
      price = prices.hp * .9;
      if (lowest > price && lowest < prices.hp) {
        price = lowest;
      }
      if (last <= lowest && last > price && last <= prices.hp) {
        price = last;
      }
      break;
    default: // NM
      price = lowest ? lowest : 0;
      if (last <= lowest && last > price) {
        price = last;
      }
  }
  
  if (!price) {
    price = market;
  }
  updateCurrentPrices(prices, grade, price);
  element.querySelector('.validation-message-container').firstElementChild.value = price ? price.toFixed(2) : 0;
}

const handleFoil = (element, lowest, last, market, prices, grade) => {
  let price = 0;
  console.log(`doing ${grade}`);

  switch (grade) {
    case LPF:
      price = prices.nmf * .9;
      if (lowest > price && lowest < prices.nmf) {
        price = lowest;
      }
      if (last <= lowest && last > price && last <= prices.nmf) {
        price = last;
      }
      break;
    case MPF:
      price = prices.lpf * .9;
      if (lowest > price && lowest < prices.lfp) {
        price = lowest;
      }
      if (last <= lowest && last > price && last <= prices.lpf) {
        price = last;
      }
      break;
    case HPF:
      price = prices.mpf * .9;
      if (lowest > price && lowest < prices.mpf) {
        price = lowest;
      }
      if (last <= lowest && last > price && last <= prices.mpf) {
        price = last;
      }
      break;
    case DMF:
      price = prices.hpf * .9;
      if (lowest > price && lowest < prices.hpf) {
        price = lowest;
      }
      if (last <= lowest && last > price && last <= prices.hpf) {
        price = last;
      }
      break;
    default: // NMF
      price = lowest ? lowest : 0;
      if (last <= lowest && last > price) {
        price = last;
      }
  }
  
  if (!price) {
    price = market;
  }
  updateCurrentPrices(prices, grade, price);
  element.querySelector('.validation-message-container').firstElementChild.value = price ? price.toFixed(2) : 0;
}

const updatePrices = () => {
  const prices = {
    nm: 0,
    lp: 0,
    mp: 0,
    hp: 0,
    nmf: 0,
    lpf: 0,
    mpf: 0,
    hpf: 0,
  }

  getCurrentCardInventory();

  for (const conditionId of conditions) {
    const element = document.getElementById(`ConditionRow_${conditionId}`);
    if (!element) {
      continue;
    }
    if (conditionId === NM) {
      element.querySelector('.validation-message-container').firstElementChild.focus();
    }
    const lowestPriceElement = element.querySelector("[data-bind='formatCurrency: lowestPrice']");
    const lowestShippingElement = element.querySelector("[data-bind='formatCurrency: lowestShipping']");
    const lastPriceElement = element.querySelector("[data-bind='formatCurrency: lastSoldPrice']");
    const lastShippingElement = element.querySelector("[data-bind='formatCurrency: lastSoldShipping']");
    const marketPriceElement = element.querySelector("[data-bind='formatCurrency: marketPrice']");

    const lowest = lowestPriceElement && lowestShippingElement
      ? parseFloat(lowestPriceElement.innerText) + parseFloat(lowestShippingElement.innerText)
      : 0;
    const last = lastPriceElement && lastShippingElement
      ? parseFloat(lastPriceElement.innerText) + parseFloat(lastShippingElement.innerText)
      : 0;
    const market = marketPriceElement
      ? parseFloat(marketPriceElement.innerText)
      : 0;
    if (conditionId === NM || (conditionId <= LP && conditionId >= DM)) {
      handleNonFoil(element, lowest, last, market, prices, conditionId);
    } else {
      handleFoil(element, lowest, last, market, prices, conditionId);
    }
  }
}

const savePrices = () => {
  updateCurrentSessionTotal();
  const clickElement = document.querySelector('input[value="Save"]');
  if (clickElement) {
    clickElement.click();
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('action: ', msg.action);
  switch (msg.action) {
    case 'updatePrices':
      updatePrices();
      break;
    case 'savePrices':
      savePrices();
      break;
    case 'tabUpdated':
      if (window.location.href.includes('store.tcgplayer.com/admin/product/manage/')) {
        getCurrentCardInventory();
      }
      break;
    case 'storeAddress':
      if (window.location.href.includes('store.tcgplayer.com/admin/orders/manageorder/')) {
        storeCurrentAddress();
        sendResponse({addressStored: true})
      }
      break;
    case 'bulkStoreAddresses':
      if (window.location.href.includes('store.tcgplayer.com/admin/orders/orderlist')) {
        const checkedElements = document.querySelectorAll('.is-checked');
        console.log(checkedElements);
        for (const row of checkedElements) {
          const aTag = row.querySelector('a');
          const evt = new MouseEvent('click', {metaKey: true});
          aTag.dispatchEvent(evt);
        }
        console.log(`Sending response. Please wait ${checkedElements.length * 700 / 1000} seconds`);
        sendResponse({
          tabsOpened: true,
          wait: checkedElements.length * 700
        });
      }
      break;
    case 'retrieveAndResetSessionTotal':
      const total = localStorage.getItem('currentSessionTotal') ? localStorage.getItem('currentSessionTotal') : 0;
      console.log(`Recording session amount: $${total} in sheets`);
      sendResponse({
        total
      });
      localStorage.removeItem('currentSessionTotal');
      break;
    case 'retrieveAndResetAddresses':
      const addresses = localStorage.getItem('tcgAddresses') ? localStorage.getItem('tcgAddresses') : '';
      console.log(`Recording addresses:`);
      console.log(addresses);
      sendResponse({
        addresses
      });
      localStorage.removeItem('tcgAddresses');
      break;
    default:
      console.error(`I didn't understand the command: ${msg.action}`);
  }
});

const mutationObserver = new MutationObserver(async (mutations) => {
  console.log(mutations);
  if (mutations[0].target.tagName === 'INPUT'  &&
    mutations[0].target !== document.activeElement) {
    console.log('focusing from observer');
    mutations[0].target.focus();
    mutations[0].target.select();
    setTimeout(makeButtonsEasierToClick, 1000);
  }

  for (const mutation of mutations) {
    if (mutation.target.tagName === 'A') {
      mutation.target.parentElement.style.padding = 0;
      mutation.target.style.padding = '8px 10px';
      mutation.target.style.display = 'block';
    }
  }
});

try {
  mutationObserver.observe(document.querySelector('#SearchValue'), {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true
  });
  console.log("Found search input")
  const searchBox = document.querySelector('#SearchValue');
  console.log(searchBox);
  if (searchBox !== document.activeElement) {
    console.log('focusing!');
    searchBox.focus();
    searchBox.select();
  }
} catch (err) {
  console.log("I don't see search input");
}

const makeButtonsEasierToClick = () => {
  try {
    console.log('Making links easier to click');
    mutationObserver.observe(document.querySelector('a[data-bind="attr: { href: SITEROOT + \'product/manage/\' + $data.ProductId }, click: function (data, event) { manageProduct(data.ProductId); }"]'), {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true
    });
    const links = document.querySelectorAll('a[data-bind="attr: { href: SITEROOT + \'product/manage/\' + $data.ProductId }, click: function (data, event) { manageProduct(data.ProductId); }"]');
    for (const element of links) {
      element.parentElement.style.padding = 0;
      element.style.padding = '8px 10px';
      element.style.display = 'block';
    }
  } catch (err) {
    console.log("Couldn't find clickable links");
  }
}

const storeCurrentAddress = () => {
  console.log('getting current address');
  const addressElement = document.querySelector('.address-compact');
  let currentAddresses = localStorage.getItem('tcgAddresses') ? JSON.parse(localStorage.getItem('tcgAddresses')) : [];
  console.log(addressElement.children[0].innerText);
  currentAddresses.push(addressElement.children[0].innerText);
  localStorage.setItem('tcgAddresses', JSON.stringify(currentAddresses));
}

const getCurrentCardInventory = () => {
  const cardName = document.querySelector(`span[data-bind="text: productName"]`).innerText;
  const lastCard = JSON.parse(localStorage.getItem('currentCard'));
  console.log(lastCard);
  if (lastCard && lastCard.cardName === cardName) {
    return;
  }

  const quantities = document.querySelectorAll(`input[data-bind="disable: $parent.isForwardFreightSeller, textInput: quantity, css: { 'invalid' : !quantity.isValid() }"]`);
  const currentInventory = {};

  quantities.forEach((qty, i) => {
    if (qty.value) {
      currentInventory[i] = parseInt(qty.value);
    }
  });

  localStorage.setItem('currentCard', JSON.stringify({cardName, currentInventory}));
}

const updateCurrentSessionTotal = () => {
  const quantities = document.querySelectorAll(`input[data-bind="disable: $parent.isForwardFreightSeller, textInput: quantity, css: { 'invalid' : !quantity.isValid() }"]`);
  const prices = document.querySelectorAll(`input[data-bind="textInput: newPrice, formatCurrency: newPrice, css: { 'invalid' : !newPrice.isValid() }"]`);
  const oldInventory = JSON.parse(localStorage.getItem('currentCard'));
  const cardName = document.querySelector(`span[data-bind="text: productName"]`).innerText;

  if (cardName !== oldInventory.cardName) {
    console.error('')
  }

  let amount = 0;
  quantities.forEach((qtyInput, i) => {
    if (qtyInput.value) {
      const qty = parseInt(qtyInput.value);
      const oldQty = oldInventory.currentInventory[i] ? oldInventory.currentInventory[i] : 0;
      console.log(qty, oldQty);
      if (qty > oldQty) {
        amount += parseFloat(prices[i].value) * (qty - oldQty);
      }
    }
  });

  const localStorageSessionTotal = localStorage.getItem('currentSessionTotal');
  const currentSessionTotal = localStorageSessionTotal ? parseFloat(localStorageSessionTotal) : 0;
  console.log(currentSessionTotal, amount, currentSessionTotal + amount);
  localStorage.setItem('currentSessionTotal', currentSessionTotal + amount);
  console.log(localStorage.getItem('currentSessionTotal'));
  localStorage.removeItem('currentCard');
}

setTimeout(makeButtonsEasierToClick, 400);
setTimeout(() => console.log(`Current Total: ${localStorage.getItem('currentSessionTotal')}`), 401);