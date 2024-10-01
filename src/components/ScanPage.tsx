import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner'; // Importing the QR scanner package
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import * as baseAccount from '../AccountInfo';

// Program ID of your deployed product storage program
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

const ScanPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null); // Reference to the video element
  const [scanResult, setScanResult] = useState<string | null>(null); // State to store the scanned result
  const [error, setError] = useState<string | null>(null); // State to handle errors
  const [verificationResult, setVerificationResult] = useState<string | null>(null); // State to store verification result
  const wallet = useAnchorWallet(); // Use the wallet adapter hook for the connected wallet

  useEffect(() => {
    if (videoRef.current) {
      const qrScanner = new QrScanner(videoRef.current, (result: string) => {
        setScanResult(result); // Update the scan result
        verifyIfProductExists(result); // Verify the scanned product
        qrScanner.stop(); // Stop scanning after a successful scan
      });

      qrScanner.start() // Start the QR scanner
        .catch(err => {
          setError('Failed to start camera: ' + err.message); // Handle any errors
        });

      // Cleanup function to stop the scanner
      return () => {
        qrScanner.stop();
      };
    }
  }, []);

  // Get IDs from contract
  const verifyIfProductExists = async (scannedProduct: string) => {
    try {
      if (!wallet || !baseAccount.default) {
        console.log("baseAccount:", baseAccount.default);
        console.error("Wallet not connected");
        return;
      }

      const connection = new Connection("https://api.devnet.solana.com");
      const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
      const program = new anchor.Program(idl, PROGRAM_ID, provider);

      // Fetch the baseAccount data from the Solana program
      const account = await program.account.baseAccount.fetch(new PublicKey(baseAccount.default)); // Fetch using the correct structure
      console.log('Fetched account:', account);

      // Convert the numbers (if any) to readable format
      if (account && account.numbers) {
        const fetchedProducts = account.numbers.map((num: anchor.BN) => num.toNumber());
        
        // Check if the scanned product exists
        const scannedProductNumber = parseInt(scannedProduct, 10);
        if (fetchedProducts.includes(scannedProductNumber)) {
          setVerificationResult("Product is STANDARD.");
        } else {
          setVerificationResult("Product is SUBSTANDARD.");
        }
      } else {
        console.error('No numbers found in account');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching numbers');
      console.error('Error fetching numbers:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bluer text-white">
      <h2 className="text-3xl font-bold mb-6">Scan QR Code</h2>
      {error && <p className="text-red-500">{error}</p>} {/* Display any error messages */}
      
      {/* Scanner box with semi-rounded edges and lines only at the corners */}
      <div className="relative flex justify-center items-center mb-6">
        <div className="relative w-[90vw] max-w-md h-[60vw] max-h-[350px]">
          {/* Scanner edges (only at the corners) */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-md"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-md"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-md"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-md"></div>
          
          {/* Video element for QR scanner */}
          <video ref={videoRef} className="w-full h-full object-cover rounded-md border border-[#5779FF]" />
        </div>
      </div>

      {scanResult && (
        <div className="text-green-500 text-xl">
          {/* Display the scanned result */}
          <p>Scanned Product: {scanResult}</p>
        </div>
      )}

      {verificationResult && (
        <div className="text-yellow-500 text-lg mt-4">
          {/* Display the verification result */}
          <p>{verificationResult}</p>
        </div>
      )}
    </div>
  );
};

export default ScanPage;
