const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = ({ target }) => {
  let db = target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

request.onsuccess = ({ target }) => {
  db = target.result;

  // check to see data base is online
  if (navigator.onLine) {
    checkDatabase();
  }
};

function saveBudget(record) {
  const payment = db.payment(["pending"], "readwrite");
  const store = payment.objectStore("pending");

  store.add(record);
}

function checkDatabase() {
  const payment = db.payment(["pending"], "readwrite");
  const store = payment.objectStore("pending");
  const pullInfo = store.pullInfo();

  pullInfo.onsuccess = function () {
    if (pullInfo.result.length > 0) {
      fetch("/api/payment/bulk", {
        method: "POST",
        body: JSON.stringify(pullInfo.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          return response.json();
        })
        .then(() => {
          const payment = db.payment(["pending"], "readwrite");
          const store = payment.objectStore("pending");
          store.clear();
        });
    }
  };
}

window.addEventListener("online", checkDatabase);
