import React, { useState, useEffect } from "react";
import { Contract, RpcProvider, AccountInterface, shortString } from "starknet";
import { connect, disconnect } from "@starknet-io/get-starknet";
import { CONTRACT_ADDRESS, CONTRACT_ABI, STARKNET_RPC } from "./starknetConfig";
import './App.css'

function App() {
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [marketDescription, setMarketDescription] = useState("");
  const [newMarketDescription, setNewMarketDescription] = useState("");
  const [winners, setWinners] = useState<string[]>([]);
  const [placedBets, setPlacedBets] = useState<{user: string, up: boolean}[]>([]);

  const ADMIN_ADDRESS = "0x035d4f5BA8c7aEaC79CdD3bd4DA7b84BFB3b66ffFEB7D0544658Ef9516f05466";

  function normalizeAddress(addr?: string) {
    if (!addr) return "";
    let a = addr.toLowerCase();
    if (a.startsWith("0x")) a = a.slice(2);
    a = a.padStart(64, "0");
    return a;
  }

  const provider = new RpcProvider({ nodeUrl: STARKNET_RPC });
  const contract = new Contract(CONTRACT_ABI.abi, CONTRACT_ADDRESS, provider);

  async function fetchMarketDescription() {
    try {
      const res = await contract.call("get_bet", [0]); // Hardcoded to bet ID 0
      console.log("Response from get_bet:", res);
      let felt;
      if (typeof res === 'object' && res !== null) {
        const keys = Object.keys(res);
        if (keys.length > 0) {
          felt = res[keys[0]];
        } else {
          throw new Error("get_bet returned an empty object.");
        }
      } else {
        felt = res;
      }
      const desc = shortString.decodeShortString(felt);
      setMarketDescription(desc);
    } catch (e) {
      console.error("Failed to fetch market description", e);
      setMarketDescription("Could not fetch market description. Is it created?");
      setStatus(`Error: ${(e as Error).message}`); // Show the error
    }
  }

  useEffect(() => {
    fetchMarketDescription();
  }, []);

  useEffect(() => {
    if (account) {
      const isAccountAdmin = normalizeAddress(account.address) === normalizeAddress(ADMIN_ADDRESS);
      setIsAdmin(isAccountAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [account]);

  async function handleConnect() {
    setLoading(true);
    setStatus("");
    try {
      const wallet = await connect({ modalMode: "alwaysAsk" });
      if (wallet) {
        await wallet.enable({ starknetVersion: "v5" } as any);
        setAccount(wallet.account);
        setStatus("Wallet connected!");
        setSuccess(true);
      } else {
        setStatus("Failed to connect wallet.");
        setSuccess(false);
      }
    } catch (e) {
      setStatus("Error: " + (e as Error).message);
      setSuccess(false);
    }
    setLoading(false);
  }

  async function handleDisconnect() {
    setLoading(true);
    await disconnect({ clearLastWallet: true });
    setAccount(null);
    setStatus("Wallet disconnected.");
    setSuccess(false);
    setLoading(false);
  }

  async function handleSetMarketDescription() {
    setLoading(true);
    setStatus("Setting market description...");
    setSuccess(false);
    try {
      if (!account) throw new Error("Wallet not connected");
      const contractWithAccount = new Contract(CONTRACT_ABI.abi, CONTRACT_ADDRESS, account);
      const tx = await contractWithAccount.invoke("add_bet", [newMarketDescription]);
      setStatus("Waiting for transaction to be accepted...");
      await provider.waitForTransaction(tx.transaction_hash);
      setStatus("Market description set! Tx: " + tx.transaction_hash);
      setSuccess(true);
      fetchMarketDescription(); // Refresh the description
    } catch (e) {
      setStatus("Error: " + (e as Error).message);
      setSuccess(false);
    }
    setLoading(false);
  }

  async function handleResolveMarket(isUp: boolean) {
    setLoading(true);
    setStatus("Resolving market...");
    setSuccess(false);
    try {
      if (!account) throw new Error("Wallet not connected");
      const contractWithAccount = new Contract(CONTRACT_ABI.abi, CONTRACT_ADDRESS, account);
      const betId = 0; // Hardcoded to the main market
      const tx = await contractWithAccount.invoke("resolve_bet", [betId, isUp]);
      setStatus("Waiting for transaction to be accepted...");
      await provider.waitForTransaction(tx.transaction_hash);
      setStatus("Market resolved! Tx: " + tx.transaction_hash);
      setSuccess(true);

      // Fetch betters after resolution
      let betters: string[] = [];
      if (isUp) {
        betters = await contract.call("get_up_betters", [betId]);
      } else {
        betters = await contract.call("get_down_betters", [betId]);
      }
      // betters may be an object or array, normalize to array of strings
      let winnerList: string[] = [];
      if (Array.isArray(betters)) {
        winnerList = betters.map(addr => String(addr));
      } else if (typeof betters === 'object' && betters !== null) {
        winnerList = Object.values(betters).map(addr => String(addr));
      }
      setWinners(winnerList);
    } catch (e) {
      setStatus("Error: " + (e as Error).message);
      setSuccess(false);
    }
    setLoading(false);
  }

  async function handlePlaceBet(isBettingUp: boolean) {
    setLoading(true);
    setStatus("Placing bet...");
    setSuccess(false);
    try {
      if (!account) throw new Error("Wallet not connected");
      const contractWithAccount = new Contract(CONTRACT_ABI.abi, CONTRACT_ADDRESS, account);
      const betId = 0; // Hardcoded to the main market
      const tx = await contractWithAccount.invoke("place_bet", [betId, isBettingUp]);
      setStatus("Bet placed! Tx: " + tx.transaction_hash);
      setSuccess(true);
      setPlacedBets([...placedBets, { user: account.address, up: isBettingUp }]);
    } catch (e) {
      setStatus("Error: " + (e as Error).message);
      setSuccess(false);
    }
    setLoading(false);
  }

  async function handleClaimReward() {
    setLoading(true);
    setStatus("Claiming reward...");
    setSuccess(false);
    try {
      if (!account) throw new Error("Wallet not connected");
      const contractWithAccount = new Contract(CONTRACT_ABI.abi, CONTRACT_ADDRESS, account);
      const betId = 0; // Hardcoded to the main market
      const tx = await contractWithAccount.invoke("claim_reward", [betId]);
      setStatus("Reward claimed! Tx: " + tx.transaction_hash);
      setSuccess(true);
    } catch (e) {
      setStatus("Error: " + (e as Error).message);
      setSuccess(false);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif", color: "#fff" }}>
      <h1 style={{ textAlign: "center" }}>Predict Tomorrow's Economy</h1>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <button onClick={account ? handleDisconnect : handleConnect} disabled={loading} style={{ padding: "0.5rem 2rem", fontSize: "1rem" }}>
          {account ? "Disconnect Wallet" : "Connect Wallet"}
        </button>
      </div>
      {account && (
        <div style={{ margin: "1rem 0", color: "#0c0", textAlign: "center" }}>
          Connected: {account.address}
        </div>
      )}
      <div style={{ margin: "1rem 0", textAlign: "center" }}>
        {loading && <span style={{ color: "#09f" }}>Loading...</span>}
        {!loading && status && (
          <span style={{ color: success ? "#0c0" : "#c00" }}>{status}</span>
        )}
      </div>

      <div style={{ background: "#222", borderRadius: 8, padding: 16, marginBottom: 24, textAlign: 'center' }}>
        <h2>{marketDescription}</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
          <button onClick={() => handlePlaceBet(true)} disabled={!account || loading || marketDescription === "Market not yet created." } style={{ padding: "1rem 2rem", fontSize: "1.2rem", background: "#00aaff", color: "white", border: "none", borderRadius: 8, cursor: 'pointer' }}>
            Bet Up
          </button>
          <button onClick={() => handlePlaceBet(false)} disabled={!account || loading || marketDescription === "Market not yet created."} style={{ padding: "1rem 2rem", fontSize: "1.2rem", background: "#ff4400", color: "white", border: "none", borderRadius: 8, cursor: 'pointer' }}>
            Bet Down
          </button>
        </div>
      </div>

      {isAdmin && (
        <>
          <div style={{ background: "#222", borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <h2>Set Market Description (Admin)</h2>
            <input value={newMarketDescription} onChange={e => setNewMarketDescription(e.target.value)} placeholder="New market description" style={{ marginRight: 8, padding: 4, width: '70%' }} />
            <button onClick={handleSetMarketDescription} disabled={!account || loading}>Set Description</button>
          </div>

          <div style={{ background: "#222", borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <h2>Resolve Market (Admin)</h2>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
              <button onClick={() => handleResolveMarket(true)} disabled={!account || loading} style={{ padding: "1rem 2rem", fontSize: "1.2rem", background: "#00aaff", color: "white", border: "none", borderRadius: 8, cursor: 'pointer' }}>
                Resolve Up
              </button>
              <button onClick={() => handleResolveMarket(false)} disabled={!account || loading} style={{ padding: "1rem 2rem", fontSize: "1.2rem", background: "#ff4400", color: "white", border: "none", borderRadius: 8, cursor: 'pointer' }}>
                Resolve Down
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ background: "#222", borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <h2>Claim Reward</h2>
        <p>Did you win the bet on the main market? Claim your reward here.</p>
        <button onClick={handleClaimReward} disabled={!account || loading}>Claim Reward for Main Market</button>
      </div>

      {winners.length > 0 && (
        <div style={{ background: "#222", borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <h2>Winners</h2>
          <ul>
            {winners.map((winner, index) => (
              <li key={index}>{winner}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
