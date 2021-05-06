console.log('im the background');

let token;
const spreadsheetId = '1RHhAdkhAfBYQRY_EVsoJKAY34EXnj-5jjnEPiQjKdwo';

chrome.commands.onCommand.addListener(command => {
  console.log(command);

  switch (command) {
    case 'update_prices':
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'updatePrices' });
      });
      break;
    case 'save_prices':
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'savePrices' });
      });
      break;
    case 'submit_session':
      submitSession()
      break;
    case 'store_address':
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'storeAddress' });
      });
      break;
    case 'write_addresses':
      writeAddresses();
      break;
    case 'bulk_write_addresses':
      // send message to content telling to open all checked orders, then respond
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        // const mainId = tabs[0].id;
        chrome.tabs.sendMessage(tabs[0].id, { action: 'bulkStoreAddresses'}, response => {
          if (response.tabsOpened) {
            // wait a few seconds for pages to load
            setTimeout(() => {
              chrome.tabs.query({currentWindow: true}, tabs => {
                console.log(tabs);

                tabs.forEach((tab, i) => {
                  if (tab.url.includes('store.tcgplayer.com/admin/orders/manageorder')) {
                    console.log('sending');
                    console.log(tab.id);
                    setTimeout(() => {
                      chrome.tabs.sendMessage(tab.id, { action: 'storeAddress' }, response => {
                        if (response.addressStored) {
                          chrome.tabs.remove(tab.id);
                        }
                      });
                    }, i * 100);
                  }
                });
                setTimeout(() => {
                  writeAddressesSmall();
                }, (tabs.length + 1) * 100);
              });
            }, response.wait);
          }
        });
      });
      // on response tell each tab to store its address:
      // then fire the write function and clear local storage
      break;
    default:
      console.error(`I didn't understand the command: ${command}`);
  }
});

const writeToSheet = (url, values) => {
  try {
    console.log('writing to sheet');
    console.log(url, values);
    if (!token) {
      getToken(writeToSheet, [url, values]);
      return;
    }
    console.log('this is the token: ', token);

    const init = {
      method: 'POST',
      async: true,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values
      }),
      'contentType': 'json'
    };
    fetch(url, init)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        if (data.error) {
          console.log('trying again');
          getToken(writeToSheet, [url, values]);
        }
      });
  } catch (e) {
    console.error(e);
    console.log(e.error);
    console.log('trying again');
    if (e.status === 'UNAUTHENTICATED') {
      getToken(writeToSheet, [url, values]);
    }
  }
}

const getToken = (cb, params) => {
  console.log('getting token');
  chrome.identity.getAuthToken({ 'interactive': true }, resultToken => {
    token = resultToken
    cb(...params);
  });
  console.log(token);
}

function getFormattedDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = (1 + date.getMonth()).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return month + '/' + day + '/' + year;
}

const submitSession = () => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'retrieveAndResetSessionTotal' }, response => {
      const range = "'Uploads'!A:B"
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`;
      const values = [
        [getFormattedDate(), response.total], // [left cell, right cell]
      ]
      writeToSheet(url, values);
    })
  });
}

const writeAddressesSmall = () => {
  try {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'retrieveAndResetAddresses' }, response => {
        const range = "ALS!A:F"
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`;

        const values = [];
        let currentRow = [];
        console.log('im in heerererererere');
        const addresses = JSON.parse(response.addresses);
        for (let i = 0; i < addresses.length; i++) {
            currentRow.push(addresses[i]);
            currentRow.push('');
          if ((!((i + 1) % 3)) && currentRow.length) {
            console.log(currentRow);
            values.push(currentRow);
            currentRow = [];
          }
        }
        // if 1 leftover
        if (currentRow.length) {
          values.push(currentRow);
        }
        writeToSheet(url, values);
      })
    });
  } catch (e) {
    console.error(e);
    console.log(e.error);
    console.log('trying again');
    if (e.status === 'UNAUTHENTICATED') {
      getToken(writeToSheet, [url, values]);
    }
  }
}

const writeAddresses = () => {
  try {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'retrieveAndResetAddresses' }, response => {
        const range = "AveryLabels!A:C"
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`;

        const values = [];
        let currentRow = [];
        console.log(response.addresses);
        const addresses = JSON.parse(response.addresses);
        for (let i = 0; i < addresses.length; i++) {
          if ((!(i % 2)) && currentRow.length) {
            values.push(currentRow);
            currentRow = [];
          }
          if (!(i % 2)) { // even
            currentRow.push(addresses[i]);
          } else { // odd
            currentRow.push('');
            currentRow.push(addresses[i]);
          }
        }
        // if 1 leftover
        if (currentRow.length) {
          values.push(currentRow);
        }
        writeToSheet(url, values);
      })
    });
  } catch (e) {
    console.error(e);
    console.log(e.error);
    console.log('trying again');
    if (e.status === 'UNAUTHENTICATED') {
      getToken(writeToSheet, [url, values]);
    }
  }
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  switch (msg.action) {
    case 'submitSession':
      submitSession();
      break;
    default:
      console.error(`I didn't understand the runtime action: ${msg.action}`)
  }
  if (msg.action === "updateIcon") {
    if (msg.value) {
      chrome.browserAction.setIcon({ path: "/assets/amqpIcon48.png" });
    } else {
      chrome.browserAction.setIcon({ path: "/assets/amqpIconOff48.png" });
    }
  }
});


