"use client";

import { useEconomyContract } from "../hooks/hooks";
import ConnectWallet from "./ConnectWallet";
import Prediction from "./Prediction";
import OwnerControls from "./OwnerControls";
import Header from "./Header";
import UserInfo from "./UserInfo";
import Footer from "./Footer";

export default function Home() {
  const {
    address,
    status,
    stakeAmount,
    setStakeAmount,
    hasPredicted,
    isOwner,
    readableTotalUp,
    readableTotalDown,
    isPredicting,
    predictError,
    isDetermining,
    determineError,
    handlePredict,
    handleDetermine,
    readableResult,
    readablePrediction
  } = useEconomyContract();

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white flex flex-col items-center p-0">
      <Header readableTotalUp={readableTotalUp} readableTotalDown={readableTotalDown} />

      <UserInfo
        address={address}
        readablePrediction={readablePrediction}
        readableResult={readableResult}
        isPredicting={isPredicting}
        isDetermining={isDetermining}
        predictError={predictError}
        determineError={determineError}
      />

      {!hasPredicted && (
        <Prediction
          hasPredicted={hasPredicted}
          isPredicting={isPredicting}
          stakeAmount={stakeAmount}
          setStakeAmount={setStakeAmount}
          handlePredict={handlePredict}
        />
      )}

      {isOwner && readableResult === "Pending" && (
        <OwnerControls
          isDetermining={isDetermining}
          handleDetermine={handleDetermine}
        />
      )}

      {status === "disconnected" && (
        <ConnectWallet />
      )}
      <Footer />
    </main>
  );
}