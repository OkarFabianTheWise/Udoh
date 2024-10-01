import React, { useEffect, useState } from 'react';
import * as anchor from '@project-serum/anchor';
import { PublicKey, Connection } from '@solana/web3.js';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { QRCodeSVG } from 'qrcode.react'; // Import QR code generator
import BASEACCOUNT from '../AccountInfo';

const PROGRAM_ID = new PublicKey("5Ma25KjfLWFJvkyAEiCeHgcxnuq11AXnJiXyEL3gxwZ9");

// Define the IDL for your program
const idl: anchor.Idl = {
  version: "0.1.0",
  name: "number_storage_program",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "baseAccount", isMut: true, isSigner: true },
        { name: "user", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: true, isSigner: false }
      ],
      args: []
    },
    {
      name: "saveNumber",
      accounts: [
        { name: "baseAccount", isMut: true, isSigner: false }
      ],
      args: [
        { name: "number", type: "u64" }
      ]
    },
    {
      name: "getNumbers",
      accounts: [
        { name: "baseAccount", isMut: false, isSigner: false }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "BaseAccount",
      type: {
        kind: "struct",
        fields: [
          { name: "numbers", type: { vec: "u64" } } // Define account structure
        ]
      }
    }
  ]
};

// interface Props {
//   baseAccount: string | null; // baseAccount passed from App
// }

const FetchProduct: React.FC = () => {
  const [products, setProducts] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wallet = useAnchorWallet(); // Use the wallet adapter hook for the connected wallet

  useEffect(() => {
    // Automatically fetch numbers when the component mounts
    fetchproductIds();
  }, []);

  // Get IDs from contract
  const fetchproductIds = async () => {
    try {
      if (!wallet || !BASEACCOUNT) {
        console.log("baseAccount:", BASEACCOUNT);
        console.error("Wallet not connected");
        return;
      }
      
      const baseAccount = BASEACCOUNT;

      const connection = new Connection("https://api.devnet.solana.com");
      const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
      const program = new anchor.Program(idl, PROGRAM_ID, provider);

      // Fetch the baseAccount data from the Solana program
      const account = await program.account.baseAccount.fetch(new PublicKey(baseAccount)); // Fetch using the correct structure
      console.log('Fetched account:', account);

      // Convert the numbers (if any) to readable format
      if (account && account.numbers) {
        const fetchedProducts = account.numbers.map((num: anchor.BN) => num.toNumber());
        setProducts(fetchedProducts);
      } else {
        console.error('No numbers found in account');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching numbers');
      console.error('Error fetching numbers:', err);
    }
  };

  return (
    <div className="mt-10">
      <h2 className="text-2xl mb-4">Fetched Products:</h2>
      {error && <p className="text-red-500">{error}</p>}
      <button
        className="bg-zombieWhite text-gameBlack p-2 rounded shadow-zombie hover:shadow-md hover:shadow-zombie transition mb-4"
        onClick={fetchproductIds}
      >
        Fetch Products
      </button>

      <ul className="mt-4">
        {products.length > 0 ? (
          products.map((num, index) => (
            <li key={index} className="mb-6">
              <p className="text-lg mb-2">Product {num}</p> {/* Display product number */}
              <div className="flex justify-center">
                {/* Display QR code for each product */}
                <QRCodeSVG value={num.toString()} size={128} />
              </div>
            </li>
          ))
        ) : (
          <p>No Products.</p>
        )}
      </ul>
    </div>
  );
};

export default FetchProduct;
