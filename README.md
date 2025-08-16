# Starknet Prediction Market Frontend

This is a Vite + React + TypeScript frontend for your Starknet Prediction Market contract.

## Learning Journey
This project was a deep dive into building a full-stack decentralized application (dApp) on the StarkNet blockchain. My learning journey focused on bridging the gap between a traditional web2 frontend and a web3 smart contract.

The main challenges and learning points were:

*   **StarkNet Integration**: Understanding the starknet.js library to communicate with a StarkNet smart contract from a React application. This included learning how to handle wallet connections, sign transactions, and call contract functions.
*   **Data Handling**: Working with StarkNet-specific data types like felt and shortString, and converting them to human-readable formats in the UI.
*   **State Management**: Using React hooks (useState, useEffect) to manage the complex state of the dApp, including the user's wallet connection, transaction status, and data fetched from the blockchain.

## Building Process and Approach
I approached the project in a structured way, starting with the basic setup and progressively adding more features:

1.  **Foundation**: I set up a new React project using Vite and TypeScript, which provided a fast and modern development environment.
2.  **Wallet Connection**: I implemented the core web3 functionality: connecting and disconnecting a StarkNet wallet using the @starknet-io/get-starknet library.
3.  **Reading from the Contract**: I focused on fetching data from the smart contract and displaying it in the UI. This included the prediction market's description and its current status.
4.  **Writing to the Contract**: I implemented the user-facing interactions, such as placing bets and claiming rewards. This involved creating and sending transactions to the blockchain.
5.  **Admin Features**: I added an admin section with special privileges, such as setting the market description and resolving the market. This required implementing logic to check the connected user's address against a predefined admin address.
6.  **UI/UX**: I designed a simple and intuitive user interface with clear feedback for users, including loading indicators and status messages for blockchain interactions. I also added a pop-up to provide important information to the user when they first visit the page.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   npm

    ```sh
    npm install npm@latest -g
    ```

### Installation

1.  Clone the repo

    ```sh
    git clone https://github.com/your_username_/Project-Name.git
    ```

2.  Install NPM packages

    ```sh
    npm install
    ```

3.  Run the development server

    ```sh
    npm run dev
    ```

## Tools Used
*   **Frontend Framework**: React with TypeScript
*   **Build Tool**: Vite
*   **StarkNet Libraries**: starknet.js and @starknet-io/get-starknet
*   **Styling**: Inline CSS-in-JS for component-level styling

## Feedback Gathered Along the Way
(This section is a suggestion based on the code. You should replace it with the actual feedback you received.)

"During development, I realized the importance of providing clear feedback to the user about the status of their transactions. Initially, the app didn't have clear loading and success/error messages, which made it confusing to use. After some testing, I added more detailed status updates to improve the user experience. I also received feedback that the admin functionality should be clearly separated from the user-facing features, which led me to create a distinct admin panel."