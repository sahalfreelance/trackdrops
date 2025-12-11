<?php
header("Content-Type: application/json");

// FORCE clean output
ob_clean();
error_reporting(0);

$address = $_GET["address"] ?? "";

if (!$address) {
    echo json_encode(["error" => "No address provided"]);
    exit;
}

$url = "https://www.drops.bot/api/airdrops/checkAddress";

$payload = [
    "address" => $address,
    "networkType" => "EVM",
    "token" => "try-skip"
];

$cookie = "_ga=GA1.1.65332260.1764693913; _gcl_au=1.1.69761875.1764693913; country=ID; _ga_FF53NQ0W8C=GS2.1.s1765157713$o5$g0$t1765157713$j60$l0$h0; __Host-next-auth.csrf-token=b2d7f290bf1a5f402dde20f2b9542e4889763d15db4848c0937a2b7a0101dac5%7C0c20eb45a937b0d54f475149e9207be01311b7dd2b5122fe8fdf3f8fe49c4dec; __Secure-next-auth.callback-url=https%3A%2F%2Fwww.drops.bot; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..oRxMiNl_4TMvOg5Y.NziosixaqjKfYjBoXeKHoO2xkLJ4uYDnSmWqv_GmgVuwtnCbJHfjKO4qt0Z8lSq-vAoyAJUHSGXf-ul0skh-lsm4yvzX5cGyq9U_wolKFLudomBKT5D398VyFFUN-p0IeDwqQdUKxPHii3rzP66icb7BgnuXHODghnUtJ7CfDSRIslUYOfQfZdKDN_xDdoBszHj9dcI3e987sqUuRnp4LjIDS2bVF7n1mlbBKi1ZVFb-eCguRBe2ULyeAaR8DPnkC5-M8lPELQ3-lWpJZK80u6eYsD467aw0zZCEDs8P1d85kGNbYsn4rD15lBXxNYAdY-nf_1eK9QwW.yc46xQuz2q69dJSnJ_0JOg";

$headers = [
    "Content-Type: application/json",
    "User-Agent: Mozilla/5.0",
    "Cookie: $cookie"
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

// TEST IF VALID JSON
$data = json_decode($response, true);

if (!$data) {
    echo json_encode([
        "error" => "Invalid response from API",
        "raw" => $response
    ]);
    exit;
}

$output = [];

$keys = [
    "eligibleAirdrops",
    "claimedAirdrops",
    "expiredAirdrops",
    "manualEligibilityCheckAirdrops",
    "addressCheckAirdrops"
];

foreach ($keys as $k) {
    if (!empty($data[$k])) {
        foreach ($data[$k] as $item) {
            $output[] = [
                "id" => $item["airdropId"] ?? "unknown",
                "claimed" => $item["isClaimed"] ?? "",
                "amount" => $item["amount"] ?? 0,
                "usd" => $item["fiatValue"] ?? 0,
            ];
        }
    }
}

echo json_encode($output);
exit;
