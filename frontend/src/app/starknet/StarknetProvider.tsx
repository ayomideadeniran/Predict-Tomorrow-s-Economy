"use client";
import React from "react";
import { sepolia } from "@starknet-react/chains";
import {
  StarknetConfig,
  publicProvider,
  braavos,
  argent,
  voyager,
} from "@starknet-react/core";

export function AppStarknetProvider({ children }: { children: React.ReactNode }) {
  const connectors = [braavos(), argent()];

  return (
    <StarknetConfig
      chains={[sepolia]}
      provider={publicProvider()}
      connectors={connectors}
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
}
