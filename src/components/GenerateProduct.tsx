import * as React from 'react';
import { useEffect } from 'react';
import * as anchor from '@project-serum/anchor';
import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { CustomWalletMultiButton } from './connection';
import BASEACCOUNT from '../AccountInfo';

// Program ID of your deployed product storage program
const PROGRAM_ID = new PublicKey("5Ma25KjfLWFJvkyAEiCeHgcxnuq11AXnJiXyEL3gxwZ9");

// Define a simple IDL for your program
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

interface Props {
  baseAccount: string | null;
  setBaseAccount: (account: string | null) => void;
}


const GenerateProduct: React.FC<Props> = ({ baseAccount, setBaseAccount }) => {
  const wallet = useAnchorWallet();
  
  const createBase = async (connection: anchor.web3.Connection) => {
    try {
      if (!wallet) {
        console.error('Wallet not connected');
        return;
      }

      const newBaseAccount = Keypair.generate();
      setBaseAccount(newBaseAccount.publicKey.toString());

      const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
      const program = new anchor.Program(idl, PROGRAM_ID, provider);

      await program.methods.initialize().accounts({
        baseAccount: newBaseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      }).signers([newBaseAccount]).rpc();

      console.log(`Initialized base account: ${newBaseAccount.publicKey.toString()}`);
    } catch (err) {
      console.error('Failed to create base account:', err);
    }
  };

  const handleGenerate = async () => {
    try {
      const connection = new Connection("https://api.devnet.solana.com");
      if (!wallet) {
        console.error('Wallet not connected');
        return;
      }

      console.log('checking BASE');

      if (BASEACCOUNT === null) {
        console.log('No baseAccount: calling createBase');
        await createBase(connection);
        return;
      }

      setBaseAccount(BASEACCOUNT);
      console.log('asserting');
      if (baseAccount !== null) {
        console.log('finished assession');
        const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
        const program = new anchor.Program(idl, PROGRAM_ID, provider);

        console.log('tx building');


        // USE BLOCKTIME TO GENERATE THE PRODUCT
        const slot = await connection.getSlot();
        const blockTime =  await connection.getBlockTime(slot);
        
        console.log('Gen. block time', blockTime);

        const tx = await program.methods.saveNumber(new anchor.BN(blockTime)).accounts({
          baseAccount: new PublicKey(baseAccount),
        }).rpc();

        console.log(`product saved with transaction ID: ${tx}`);
      } else {
        console.error('No product provided to save.');
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  useEffect(() => {
    if (baseAccount) {
      console.log(`Base account is now set: ${baseAccount}`);
    }
  }, [baseAccount]);

  return (
    <div>
      <div className="relative mb-6">
        <CustomWalletMultiButton />
        <div className="absolute p-4">
          <button
            className="bg-zombieWhite text-gameBlack p-2 rounded shadow-zombie hover:shadow-md hover:shadow-zombie transition"
            onClick={handleGenerate}
          >
            Save product
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateProduct;
