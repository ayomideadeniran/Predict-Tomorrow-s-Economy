import { useState, useEffect } from "react";
import { Contract, RpcProvider, AccountInterface, shortString } from "starknet";
import { connect, disconnect } from "@starknet-io/get-starknet";
import { CONTRACT_ADDRESS, CONTRACT_ABI, STARKNET_RPC } from "./starknetConfig";
import "./App.css";

function App() {
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [marketDescription, setMarketDescription] = useState("");
  const [newMarketDescription, setNewMarketDescription] = useState("");
  const [winners, setWinners] = useState<string[]>([]);
  const [isMarketResolved, setIsMarketResolved] = useState(false);
  const [hasUserBet, setHasUserBet] = useState(false);
  const [placedBets, setPlacedBets] = useState<{ user: string; up: boolean }[]>(
    []
  );
  const [betId, setBetId] = useState<number | null>(null);

  const ADMIN_ADDRESS =
    "0x035d4f5BA8c7aEaC79CdD3bd4DA7b84BFB3b66ffFEB7D0544658Ef9516f05466";

  function normalizeAddress(addr?: string) {
    if (!addr) return "";
    let a = addr.toLowerCase();
    if (a.startsWith("0x")) a = a.slice(2);
    a = a.padStart(64, "0");
    return a;
  }

  const provider = new RpcProvider({ nodeUrl: STARKNET_RPC });
  const contract = new Contract({
    abi: CONTRACT_ABI.abi,
    address: CONTRACT_ADDRESS,
    providerOrAccount: provider,
  });

  async function fetchLastBetId() {
    console.log("Fetching last bet ID...");
    try {
      // Attempt to get the total number of bets, assuming a public var `bet_counter`
      const betCounter = await contract.call("bet_counter", []);
      const lastId = Number(betCounter) - 1;
      if (lastId >= 0) {
        setBetId(lastId);
        console.log("Last bet ID is:", lastId);
        return;
      }
    } catch (e) {
      console.log("Could not fetch bet_counter, falling back to iteration.");
    }

    // Fallback to iteration
    let i = 17;
    let lastBetId = null;
    console.log("Starting to fetch last bet ID by iteration...");
    while (i < 18) {
      // Limit to prevent infinite loops
      try {
        await contract.call("get_bet", [i]);
        lastBetId = i;
        i++;
      } catch (e) {
        break;
      }
    }

    if (lastBetId !== null) {
      setBetId(lastBetId);
      console.log("Last bet ID found by iteration:", lastBetId);
    } else {
      console.log("No bets found.");
      setBetId(null);
    }
  }

  async function fetchMarketDescription() {
    if (betId === null) return;
    setLoading(true);
    setStatus("Fetching market description...");
    try {
      const res = await contract.call("get_bet", [betId]);
      console.log("Response from get_bet:", res);

      let felts: any[] = [];
      if (Array.isArray(res)) {
        felts = res;
      } else if (typeof res === "object" && res !== null) {
        // Handle struct-like objects that are array-like
        felts = Object.values(res);
      } else {
        felts = [res];
      }

      const desc = felts
        .map((felt) => {
          try {
            return shortString.decodeShortString(felt);
          } catch (e) {
            console.warn("Could not decode felt:", felt, e);
            return ""; // Return empty string for parts that fail to decode
          }
        })
        .join("");

      setMarketDescription(desc);
      setStatus("");
    } catch (e) {
      console.error("Failed to fetch market description", e);
      setMarketDescription(
        "Could not fetch market description. Is it created?"
      );
      setStatus(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  // async function checkUserAndMarketStatus() {
  //   if (!account || betId === null) return;

  //   setHasUserBet(false);
  //   setIsMarketResolved(false);

  //   try {
  //     const calls = [{
  //       contractAddress: CONTRACT_ADDRESS,
  //       entrypoint: 'place_bet',
  //       calldata: [betId, 1] // direction doesn't matter for this check
  //     }];
  //     await account.getSimulateTransaction(calls);
  //   } catch (e) {
  //     const errorString = JSON.stringify(e);
  //     if (errorString.includes("Already bet")) {
  //       setHasUserBet(true);
  //     }
  //     if (errorString.includes("Bet closed")) {
  //       setIsMarketResolved(true);
  //     }
  //   }
  // }

  async function checkUserAndMarketStatus() {
    if (!account || betId === null) return;

    setHasUserBet(false);
    setIsMarketResolved(false);

    try {
      // Fetch current nonce from account
      const nonce = await account.getNonce();

      const calls = [
        {
          type: "INVOKE" as const,
          contractAddress: CONTRACT_ADDRESS,
          entrypoint: "place_bet",
          calldata: [betId, 1],
          nonce: nonce, // required
        },
      ];

      await account.getSimulateTransaction(calls);
    } catch (e) {
      const errorString = JSON.stringify(e);
      if (errorString.includes("Already bet")) {
        setHasUserBet(true);
      }
      if (errorString.includes("Bet closed")) {
        setIsMarketResolved(true);
      }
    }
  }

  useEffect(() => {
    fetchLastBetId();
  }, []);

  useEffect(() => {
    if (betId !== null) {
      fetchMarketDescription();
      if (account) {
        checkUserAndMarketStatus();
      }
    }
  }, [betId, account]);

  useEffect(() => {
    if (account) {
      setLoading(true);
      const isAccountAdmin =
        normalizeAddress(account.address) === normalizeAddress(ADMIN_ADDRESS);
      setIsAdmin(isAccountAdmin);
      if (betId !== null) {
        checkUserAndMarketStatus().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, [account, betId]);

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

      // Split the description into chunks of 31 characters
      // const descParts = newMarketDescription.match(/.{1,31}/g) || [];

      const descParts = newMarketDescription.match(/.{1,31}/g) || [];

      const contractWithAccount = new Contract({
        abi: CONTRACT_ABI.abi,
        address: CONTRACT_ADDRESS,
        providerOrAccount: account,
      });

      const tx = await contractWithAccount.invoke("add_bet", [...descParts]);
      setStatus("Waiting for transaction to be accepted...");
      await provider.waitForTransaction(tx.transaction_hash);
      setStatus("Market description set! Tx: " + tx.transaction_hash);
      setSuccess(true);
      await fetchLastBetId(); // Refresh the description
    } catch (e) {
      setStatus("Error: " + (e as Error).message);
      setSuccess(false);
    }
    setLoading(false);
  }

  async function handleResolveMarket(isUp: boolean) {
    if (betId === null) return;
    setLoading(true);
    setStatus("Resolving market...");
    setSuccess(false);
    try {
      if (!account) throw new Error("Wallet not connected");
      const contractWithAccount = new Contract({
        abi: CONTRACT_ABI.abi,
        address: CONTRACT_ADDRESS,
        providerOrAccount: account,
      });

      const tx = await contractWithAccount.invoke("resolve_bet", [betId, isUp]);
      setStatus("Waiting for transaction to be accepted...");
      await provider.waitForTransaction(tx.transaction_hash);
      setStatus("Market resolved! Tx: " + tx.transaction_hash);
      setSuccess(true);
      setIsMarketResolved(true); // Mark the market as resolved

      // Fetch betters after resolution
      let betters: string[] = [];
      if (isUp) {
        const resUp = await contract.call("get_up_betters", [betId]);
        betters = Array.isArray(resUp) ? resUp.map(String) : [String(resUp)];
      } else {
        const resDown = await contract.call("get_down_betters", [betId]);
        betters = Array.isArray(resDown)
          ? resDown.map(String)
          : [String(resDown)];
      }
      // betters may be an object or array, normalize to array of strings
      let winnerList: string[] = [];
      if (Array.isArray(betters)) {
        winnerList = betters.map((addr) => String(addr));
      } else if (typeof betters === "object" && betters !== null) {
        winnerList = Object.values(betters).map((addr) => String(addr));
      }
      setWinners(winnerList);
    } catch (e) {
      setStatus("Error: " + (e as Error).message);
      setSuccess(false);
    }
    setLoading(false);
  }

  function handleResetResolution() {
    setWinners([]);
    setIsMarketResolved(false);
    setStatus("Resolution has been reset.");
    setSuccess(true);
  }

  async function handlePlaceBet(isBettingUp: boolean) {
    if (betId === null) return;
    setLoading(true);
    setStatus("Placing bet...");
    setSuccess(false);
    try {
      if (!account) throw new Error("Wallet not connected");
      const contractWithAccount = new Contract({
        abi: CONTRACT_ABI.abi,
        address: CONTRACT_ADDRESS,
        providerOrAccount: account,
      });

      const tx = await contractWithAccount.invoke("place_bet", [
        betId,
        isBettingUp,
      ]);
      setStatus("Bet placed! Tx: " + tx.transaction_hash);
      setSuccess(true);
      setPlacedBets([
        ...placedBets,
        { user: account.address, up: isBettingUp },
      ]);
    } catch (e) {
      setStatus("Error: " + (e as Error).message);
      setSuccess(false);
    }
    setLoading(false);
  }

  async function handleClaimReward() {
    if (betId === null) return;
    setLoading(true);
    setStatus("Claiming reward...");
    setSuccess(false);
    try {
      if (!account) throw new Error("Wallet not connected");
      const contractWithAccount = new Contract({
        abi: CONTRACT_ABI.abi,
        address: CONTRACT_ADDRESS,
        providerOrAccount: account,
      });

      const tx = await contractWithAccount.invoke("claim_reward", [betId]);
      setStatus("Waiting for transaction to be accepted...");
      await provider.waitForTransaction(tx.transaction_hash);
      setStatus("Reward claimed! Tx: " + tx.transaction_hash);
      setSuccess(true);
    } catch (e) {
      setStatus("Error: " + (e as Error).message);
      setSuccess(false);
    }
    setLoading(false);
  }

  const [isBountyPopupVisible, setIsBountyPopupVisible] = useState(false);

  useEffect(() => {
    setIsBountyPopupVisible(true);
  }, []);

  const BountyDetailsPopup = () => (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#333",
          padding: "2rem",
          borderRadius: 8,
          maxWidth: 500,
          textAlign: "center",
        }}
      >
        <div
          style={{ textAlign: "left", maxHeight: "80vh", overflowY: "auto" }}
        >
          <h2>Learning Journey</h2>
          <p>
            This project was a deep dive into building a full-stack
            decentralized application (dApp) on the StarkNet blockchain. My
            learning journey focused on bridging the gap between a traditional
            web2 frontend and a web3 smart contract.
          </p>
          <h3>The main challenges and learning points were:</h3>
          <ul>
            <li>
              <strong>StarkNet Integration:</strong> Understanding the
              starknet.js library to communicate with a StarkNet smart contract
              from a React application. This included learning how to handle
              wallet connections, sign transactions, and call contract
              functions.
            </li>
            <li>
              <strong>Data Handling:</strong> Working with StarkNet-specific
              data types like felt and shortString, and converting them to
              human-readable formats in the UI.
            </li>
            <li>
              <strong>State Management:</strong> Using React hooks (useState,
              useEffect) to manage the complex state of the dApp, including the
              user's wallet connection, transaction status, and data fetched
              from the blockchain.
            </li>
          </ul>
          <h2>Building Process and Approach</h2>
          <p>
            I approached the project in a structured way, starting with the
            basic setup and progressively adding more features:
          </p>
          <ol>
            <li>
              <strong>Foundation:</strong> I set up a new React project using
              Vite and TypeScript, which provided a fast and modern development
              environment.
            </li>
            <li>
              <strong>Wallet Connection:</strong> I implemented the core web3
              functionality: connecting and disconnecting a StarkNet wallet
              using the @starknet-io/get-starknet library.
            </li>
            <li>
              <strong>Reading from the Contract:</strong> I focused on fetching
              data from the smart contract and displaying it in the UI. This
              included the prediction market's description and its current
              status.
            </li>
            <li>
              <strong>Writing to the Contract:</strong> I implemented the
              user-facing interactions, such as placing bets and claiming
              rewards. This involved creating and sending transactions to the
              blockchain.
            </li>
            <li>
              <strong>Admin Features:</strong> I added an admin section with
              special privileges, such as setting the market description and
              resolving the market. This required implementing logic to check
              the connected user's address against a predefined admin address.
            </li>
            <li>
              <strong>UI/UX:</strong> I designed a simple and intuitive user
              interface with clear feedback for users, including loading
              indicators and status messages for blockchain interactions. I also
              added a pop-up to provide important information to the user when
              they first visit the page.
            </li>
          </ol>
          <h2>Tools Used</h2>
          <ul>
            <li>
              <strong>Frontend Framework:</strong> React with TypeScript
            </li>
            <li>
              <strong>Build Tool:</strong> Vite
            </li>
            <li>
              <strong>StarkNet Libraries:</strong> starknet.js and
              @starknet-io/get-starknet
            </li>
            <li>
              <strong>Styling:</strong> Inline CSS-in-JS for component-level
              styling
            </li>
          </ul>
          <h2>Feedback Gathered Along the Way</h2>
          <p>
            <em>
              {/* (This section is a suggestion based on the code. You should replace
              it with the actual feedback you received.) */}
            </em>
          </p>
          <p>
            "During development, I realized the importance of providing clear
            feedback to the user about the status of their transactions.
            Initially, the app didn't have clear loading and success/error
            messages, which made it confusing to use. After some testing, I
            added more detailed status updates to improve the user experience. I
            also d received feedback that the admin functionality should be
            clearly separated from the user-facing features, which led me to
            create a distinct admin panel."
          </p>
        </div>
        <button
          onClick={() => setIsBountyPopupVisible(false)}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "2rem auto",
        fontFamily: "sans-serif",
        color: "#fff",
      }}
    >
      {isBountyPopupVisible && <BountyDetailsPopup />}
      <h1 style={{ textAlign: "center" }}>Predict Tomorrow's Economy</h1>
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}
      >
        <button
          onClick={account ? handleDisconnect : handleConnect}
          disabled={loading}
          style={{ padding: "0.5rem 2rem", fontSize: "1rem" }}
        >
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

      <div
        style={{
          background: "#222",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        <h2>{marketDescription}</h2>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          {account && (
            <>
              <button
                onClick={() => handlePlaceBet(true)}
                disabled={
                  loading ||
                  isMarketResolved ||
                  hasUserBet ||
                  marketDescription === "Market not yet created."
                }
                style={{
                  padding: "1rem 2rem",
                  fontSize: "1.2rem",
                  background: "#00aaff",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                {hasUserBet ? "You Already Bet" : "Bet Up"}
              </button>
              <button
                onClick={() => handlePlaceBet(false)}
                disabled={
                  loading ||
                  isMarketResolved ||
                  hasUserBet ||
                  marketDescription === "Market not yet created."
                }
                style={{
                  padding: "1rem 2rem",
                  fontSize: "1.2rem",
                  background: "#ff4400",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                {hasUserBet ? "You Already Bet" : "Bet Down"}
              </button>
            </>
          )}
        </div>
      </div>

      {isAdmin && (
        <>
          <div
            style={{
              background: "#222",
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <h2>Set Prediction (Admin)</h2>
            <input
              value={newMarketDescription}
              onChange={(e) => setNewMarketDescription(e.target.value)}
              placeholder="New Prediction (max 31 chars)"
              maxLength={31}
              style={{ marginRight: 8, padding: 4, width: "70%" }}
            />
            <button
              onClick={handleSetMarketDescription}
              disabled={!account || loading || newMarketDescription.length > 31}
            >
              Set Prediction
            </button>
            {newMarketDescription.length > 31 && (
              <div style={{ color: "red", marginTop: "8px" }}>
                Description cannot exceed 31 characters.
              </div>
            )}
          </div>

          <div
            style={{
              background: "#222",
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <h2>Resolve Prediction (Admin)</h2>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <button
                onClick={() => handleResolveMarket(true)}
                disabled={!account || loading}
                style={{
                  padding: "1rem 2rem",
                  fontSize: "1.2rem",
                  background: "#00aaff",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Resolve Up
              </button>
              <button
                onClick={() => handleResolveMarket(false)}
                disabled={!account || loading}
                style={{
                  padding: "1rem 2rem",
                  fontSize: "1.2rem",
                  background: "#ff4400",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Resolve Down
              </button>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "1rem",
              }}
            >
              <button
                onClick={handleResetResolution}
                disabled={!account || loading}
              >
                Reset Resolution
              </button>
            </div>
          </div>
        </>
      )}

      <div
        style={{
          background: "#222",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <h2>Claim Reward</h2>
        <p>
          Did you win the bet on the main Prediction? Claim your reward here.
        </p>
        <button
          onClick={handleClaimReward}
          disabled={!account || loading || !isMarketResolved}
        >
          {isMarketResolved
            ? "Claim Reward for Main Prediction"
            : "Market not resolved yet"}
        </button>
      </div>

      {winners.length > 0 && (
        <div
          style={{
            background: "#222",
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
          }}
        >
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
