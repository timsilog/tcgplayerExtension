const fillPrices = () => {
  console.log('filling prices');
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'updatePrices' });
  });
}

const submitSession = () => {
  chrome.runtime.sendMessage({
    action: 'submitSession',
  });
}

document.querySelector('#fill-prices').addEventListener('click', fillPrices);
document.querySelector('#submit-session').addEventListener('click', submitSession);