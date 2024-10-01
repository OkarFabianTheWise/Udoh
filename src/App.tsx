import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import GenerateProduct from './components/GenerateProduct';
import FetchProduct from './components/FetchProduct';
import WalletContextProvider from './components/connection';
import ScanPage from './components/ScanPage';
import './App.css';

function App() {
  // Move baseAccount to the App component
  const [baseAccount, setBaseAccount] = useState<string | null>(null);

  return (
    <WalletContextProvider>
      {/*wrap with WalletContextProvider so we can have wallet button accessible.. Style wallet button in /components/connection page 33*/}
      <Router>
        {/* i couldnt get tailwindcss to work in typescript so no styling works, figure that out */}
        <div className="bg-black min-h-screen flex flex-col items-center justify-center text-white">
          <h1 className="text-4xl mb-10">Solana Number Storage</h1>

          {/* Navigation links */}
          <div className="flex flex-row space-x-4 mb-8">
            <Link 
              to="/" 
              className="px-4 py-2 border border-white text-white rounded hover:bg-white hover:text-[#050059] transition duration-200"
            >
              Home
            </Link>
            <Link 
              to="/scan" 
              className="px-4 py-2 border border-white text-white rounded hover:bg-white hover:text-[#050059] transition duration-200"
            >
              Scan Product
            </Link>
            <Link 
              to="/fetch" 
              className="px-4 py-2 border border-white text-white rounded hover:bg-white hover:text-[#050059] transition duration-200"
            >
              View Products
            </Link>
          </div>

          <main className="p-4">
            <Routes>
              <Route path="/" element={<GenerateProduct baseAccount={baseAccount} setBaseAccount={setBaseAccount} />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/fetch" element={<FetchProduct baseAccount={baseAccount} />} />
            </Routes>
          </main>
        </div>
      </Router>
    </WalletContextProvider>
  );
}

export default App;
