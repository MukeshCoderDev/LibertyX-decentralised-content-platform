# Detailed Plan for Task 2: Implement Multi-Chain Network Support and Configuration

**Goal:** Enable the LibertyX platform to seamlessly operate across multiple blockchain networks, allowing users to connect, detect, and switch between supported chains while ensuring correct contract interactions.

**Requirements Addressed (from `requirements.md`):**
*   **2.1: Network Detection:** Detect the current network upon wallet connection.
*   **2.2: Unsupported Network Prompt:** Prompt users to switch if on an unsupported network.
*   **2.3: Network Switching Options:** Provide options for Ethereum, Polygon, BNB Chain, Arbitrum, Optimism, and Avalanche.
*   **2.4: Configuration Update:** Update contract addresses and configurations upon successful network switch.
*   **2.5: Network Switching Error Handling:** Display errors and maintain state on failure.
*   **2.6: UI Auto-Update:** Automatically update UI to reflect network changes.

**Design Considerations (from `design.md`):**
*   **Web3 Integration Layer:** Leverage `WalletConnection` and `Smart Contract APIs`.
*   **WalletProvider Interface:** Utilize `chainId` and `switchNetwork` from `WalletContextType`.
*   **ContractManager Interface:** Use `getContract(name: string, chainId: number)` for multi-chain contract access.

---

#### **Phase 1: Core Network Configuration**

1.  **Define Supported Networks and Configuration:**
    *   Create a new file (e.g., `lib/blockchainConfig.ts`) to centralize all blockchain network details.
    *   For each supported network (Ethereum, Polygon, BNB Chain, Arbitrum, Optimism, Avalanche), define an object containing:
        *   `chainId`: The unique chain ID (e.g., `1` for Ethereum Mainnet, `137` for Polygon Mainnet).
        *   `chainName`: A human-readable name (e.g., "Ethereum Mainnet", "Polygon Mainnet").
        *   `rpcUrl`: The RPC endpoint(s) for interacting with the network.
        *   `blockExplorerUrl`: The URL for the network's block explorer.
        *   `nativeCurrency`: Details of the native currency (name, symbol, decimals).
        *   `contractAddresses`: A nested object mapping deployed contract names (e.g., `libertyToken`, `creatorRegistry`) to their specific addresses on that network. This is critical for Requirement 2.4.

#### **Phase 2: WalletProvider Enhancements for Network Management**

1.  **Integrate Network Detection (Requirement 2.1):**
    *   Modify the `WalletProvider` (likely `lib/WalletProvider.tsx`) to detect the `chainId` of the connected wallet immediately after connection.
    *   Store the detected `chainId` in the `WalletContextType` state.
2.  **Implement Unsupported Network Handling (Requirement 2.2):**
    *   Add logic within `WalletProvider` to compare the detected `chainId` against the list of supported networks defined in `lib/blockchainConfig.ts`.
    *   If the network is unsupported, trigger a UI prompt (e.g., a modal or a persistent banner) to inform the user and suggest switching.
3.  **Develop Network Switching Functionality (Requirement 2.3):**
    *   Implement the `switchNetwork` function within `WalletProvider` as defined in the `WalletContextType` interface.
    *   This function will use the `wallet_switchEthereumChain` RPC method to request the wallet to switch to the specified `chainId`. If the chain is not already added to the user's wallet, use `wallet_addEthereumChain`.
4.  **Handle Network Change Events (Requirement 2.6):**
    *   Subscribe to `chainChanged` events from the connected wallet provider.
    *   When a `chainChanged` event occurs, automatically update the `chainId` state in `WalletProvider` and trigger necessary UI re-renders to reflect the new network.
5.  **Implement Robust Error Handling for Network Switching (Requirement 2.5):**
    *   Add `try-catch` blocks around network switching operations to gracefully handle failures (e.g., user rejecting the switch, invalid chain ID, network issues).
    *   Display user-friendly error messages and ensure the `WalletProvider` state accurately reflects the current network, even if the switch fails.

#### **Phase 3: ContractManager Adaptation for Multi-Chain**

1.  **Dynamic Contract Instance Initialization (Requirement 2.4):**
    *   Modify the `ContractManager` (or the module responsible for initializing contract instances) to accept the current `chainId` as a parameter.
    *   When initializing contract instances, use the `chainId` to retrieve the correct contract address from the `contractAddresses` mapping in `lib/blockchainConfig.ts`.
    *   The `getContract(name: string, chainId: number)` method should be updated to ensure it always returns the contract instance relevant to the currently active chain.

#### **Phase 4: User Interface (UI) Integration**

1.  **Network Status Indicators:**
    *   Update the Header component or a dedicated status bar to display the currently connected network's name and potentially its icon.
2.  **Network Switcher Component:**
    *   Create a UI component (e.g., a dropdown or modal) that lists all supported networks from `lib/blockchainConfig.ts`.
    *   Allow users to select a network, which will trigger the `switchNetwork` function from `WalletProvider`.
3.  **Prompts and Feedback:**
    *   Implement visual prompts (e.g., a modal, toast notification) when an unsupported network is detected, guiding the user to switch.
    *   Provide clear visual feedback (loading states, success messages, error alerts) during network switching operations.

---

### Mermaid Diagram: Multi-Chain Network Support Flow

```mermaid
graph TD
    A[User Connects Wallet] --> B{WalletProvider: Detect Current Network (chainId)};
    B --> C{WalletProvider: Is chainId in Supported Networks?};
    C -- No --> D[UI: Display "Unsupported Network" Prompt];
    D --> E{User Selects Supported Network};
    E --> F[WalletProvider: Call switchNetwork(selectedChainId)];
    F -- Success --> G[WalletProvider: Update chainId State];
    F -- Failure --> H[UI: Display Error Message];
    G --> I[ContractManager: Re-initialize Contracts with new chainId];
    I --> J[UI: Update to reflect new Network];
    C -- Yes --> I;
    K[Wallet: chainChanged Event] --> G;