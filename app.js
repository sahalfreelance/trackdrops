/* =====================================================
                     GLOBAL VARS
===================================================== */
let provider = null;
let currentAccount = null;

/* =====================================================
                CHECK IF RUNNING IN MINI APP
===================================================== */
function isMiniApp() {
    return typeof window.miniapp !== "undefined" ||
           (typeof sdk !== "undefined" && sdk.wallet);
}

/* =====================================================
                   CONNECT WALLET
===================================================== */
async function connectWallet() {

    /* ===============================
      CASE 1 → FARCASTER MINI APP
    =============================== */
    if (isMiniApp()) {
        try {
            const wallet = await sdk.wallet.getUserWallet();
            currentAccount = wallet.address;

            updateUIAfterConnect(currentAccount);
            return;
        } catch (e) {
            showAlert("Failed to get Mini App wallet.");
            return;
        }
    }

    /* ===============================
      CASE 2 → BROWSER METAMASK
    =============================== */
    provider = await detectEthereumProvider();
    if (!provider) return showAlert("MetaMask not found!");

    try {
        const accounts = await provider.request({ method: "eth_requestAccounts" });
        currentAccount = accounts[0];
        localStorage.setItem("connectedWallet", currentAccount);

        updateUIAfterConnect(currentAccount);
    } catch (err) {
        showAlert("Wallet connection rejected.");
    }
}

/* =====================================================
                   UPDATE UI CONNECTED
===================================================== */
function updateUIAfterConnect(address) {
    document.getElementById("wallet").value = address;
    document.getElementById("connectBtn").style.display = "none";
    document.getElementById("disconnectBtn").style.display = "inline-block";
    document.getElementById("wallet").style.display = "inline-block";
    document.getElementById("checkBtn").style.display = "inline-block";
}

/* =====================================================
                   DISCONNECT
===================================================== */
async function disconnectWallet() {

    /* MINI APP MODE */
    if (isMiniApp()) {
        currentAccount = null;
        localStorage.removeItem("connectedWallet");
        resetUI();
        return;
    }

    /* METAMASK MODE */
    try {
        await provider.request({ method: "eth_requestAccounts" });
        currentAccount = null;

        localStorage.removeItem("connectedWallet");
        resetUI();
    } catch (err) {
        showAlert("Disconnect cancelled.");
    }
}

function resetUI() {
    document.getElementById("wallet").value = "";
    document.getElementById("connectBtn").style.display = "inline-block";
    document.getElementById("disconnectBtn").style.display = "none";
    document.getElementById("wallet").style.display = "none";
    document.getElementById("checkBtn").style.display = "none";
    document.querySelector(".results h2").style.display = "none";
    document.getElementById("cards").innerHTML = "";
}

/* =====================================================
                  AUTO LOGIN (2 modes)
===================================================== */
async function autoLogin() {

    /* MINI APP → WALLET SELALU ADA */
    if (isMiniApp()) {
        try {
            const wallet = await sdk.wallet.getUserWallet();
            currentAccount = wallet.address;
            updateUIAfterConnect(currentAccount);
            return;
        } catch (e) {
            return; // no error needed
        }
    }

    /* BROWSER METAMASK */
    provider = await detectEthereumProvider();
    if (!provider) return;

    const savedWallet = localStorage.getItem("connectedWallet");
    if (!savedWallet) return;

    try {
        const accounts = await provider.request({ method: "eth_accounts" });

        if (accounts.length && accounts[0].toLowerCase() === savedWallet.toLowerCase()) {
            currentAccount = accounts[0];
            updateUIAfterConnect(currentAccount);
        } else {
            localStorage.removeItem("connectedWallet");
        }
    } catch {
        localStorage.removeItem("connectedWallet");
    }
}

window.addEventListener("load", autoLogin);

/* =====================================================
                      LOADER
===================================================== */
function showLoader() {
    document.getElementById("overlay").classList.remove("hidden");
}
function hideLoader() {
    document.getElementById("overlay").classList.add("hidden");
}

/* =====================================================
                   CHECK AIRDROP
===================================================== */
async function checkAirdrop() {
    if (!currentAccount) return showAlert("Please connect wallet.");

    showLoader();
    try {
        const res = await fetch("api.php?address=" + currentAccount);
        const data = await res.json();
        hideLoader();

        if (data.error) return showAlert(data.error);

        renderCards(data);
    } catch (err) {
        hideLoader();
        showAlert("Error fetching data.");
    }
}

/* =====================================================
                   RENDER RESULTS
===================================================== */
function renderCards(data) {
    const box = document.getElementById("cards");
    const title = document.querySelector(".results h2");

    box.innerHTML = "";
    title.style.display = "none";

    const clean = data.filter(item => {
        const id = (item.id ?? item.airdropId ?? "").toLowerCase();
        return id !== "unknown" && !id.includes("hidden-airdrop");
    });

    if (!clean.length) return showAlert("This address got no drops.");

    title.style.display = "block";

    clean.forEach(item => {
        const id = item.id ?? item.airdropId ?? "Unknown";
        const readable = id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        const claimed = item.claimed ? "Claimed" : "Not Claimed";
        const amount = Number(item.amount ?? 0).toLocaleString();
        const usd = Number(item.usd ?? item.fiatValue ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 2
        });

        box.innerHTML += `
            <div class="card">
                <img class="icon-box" src="assets/default.png">
                <div class="card-title">${readable}</div>
                <div style="margin-top:6px;line-height:20px;">
                    <small>Status: <strong>${claimed}</strong></small><br>
                    <small>Amount: <strong>${amount}</strong></small><br>
                    <small>USD Value: <strong>$${usd}</strong></small>
                </div>
            </div>
        `;
    });
}

/* =====================================================
                     ALERT SYSTEM
===================================================== */
function showAlert(msg) {
    document.getElementById("alertMessage").innerText = msg;
    document.getElementById("alertOverlay").classList.remove("hidden");
}

function closeAlert() {
    document.getElementById("alertOverlay").classList.add("hidden");
}
