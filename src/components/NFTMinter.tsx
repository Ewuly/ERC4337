import * as PlentiFi from "@plentifi/smartaccount";
import { Contract, JsonRpcProvider } from "ethers";
import { useEffect, useState } from "react";

const BUSINESS_ID = "abcdef1234567890abcdef1234567890";
// Exemple d'adresse de contrat NFT - à remplacer par votre contrat
const NFT_CONTRACT_ADDRESS = "0x840fD881D2e0851f5271fE8E6335A5283Fa0013c" as `0x${string}`;

const NFTMinter = () => {
  const [nftBalance, setNftBalance] = useState(0n);
  const [sessionKeyActive, setSessionKeyActive] = useState(false);

  const USER_ADDRESS = "0xA43bdd70Fb4E1d0972B44BCBa39151907F9a14Bf" as `0x${string}`;

  const NFT_ABI = [
    "function safeMint() public",
    "function balanceOf(address owner) public view returns (uint256)",
  ];

  const updateBalance = async () => {
    const nftContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      NFT_ABI,
      new JsonRpcProvider(PlentiFi.businessProvider(BUSINESS_ID, "17000")),
    );

    const balance = await nftContract.balanceOf(USER_ADDRESS); // Use USER_ADDRESS instead
    setNftBalance(balance);
  };

  useEffect(() => {
    updateBalance();
  }, []);

  const mintNFT = async () => {
    const userOp = PlentiFi.createOperation({
      target: NFT_CONTRACT_ADDRESS,
      fctName: "safeMint",
      abi: NFT_ABI,
      args: [], // No arguments needed for safeMint
    });

    const receipt = await PlentiFi.connect(BUSINESS_ID, userOp, {});
    console.log("Mint receipt:", receipt);
    
    await updateBalance();
  };

  const createSessionKey = async () => {
    // Créer une clé de session valide pour 5 minutes
    const expiryTime = Math.floor(Date.now() / 1000) + 300; // 5 minutes
    
    const sessionKeyOp = PlentiFi.createSessionKey({
      validUntil: BigInt(expiryTime),
      validAfter: BigInt(Math.floor(Date.now() / 1000)),
      permissions: [{
        target: NFT_CONTRACT_ADDRESS,
        functionSelector: "0x6a627842", // safeMint() function selector
        rules: [] // No specific rules
      }]
    });

    await PlentiFi.connect(BUSINESS_ID, sessionKeyOp);
    setSessionKeyActive(true);

    // La clé de session expirera automatiquement après 5 minutes
    setTimeout(() => setSessionKeyActive(false), 300000);
  };

  const mintWithMultiSig = async () => {
    const userOp = PlentiFi.createOperation({
      target: NFT_CONTRACT_ADDRESS,
      fctName: "safeMint",
      abi: NFT_ABI,
      args: [], // No arguments needed for safeMint
    });

    const receipt = await PlentiFi.connect(BUSINESS_ID, userOp, {
      requireMultiSig: true,
      minSignatures: 2 // Requires 2 signatures
    });

    console.log("Multi-sig mint receipt:", receipt);
    await updateBalance();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-lg">
        <h1 className="mb-6 text-4xl font-bold text-gray-800">NFT Minter</h1>
        
        <div className="mb-6 text-xl text-gray-700">
          NFT Balance: {nftBalance.toString()}
        </div>
        
        <div className="space-y-4">
          <button
            onClick={mintNFT}
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Mint NFT
          </button>

          <button
            onClick={createSessionKey}
            className={`w-full px-6 py-3 text-lg font-semibold text-white rounded-lg ${
              sessionKeyActive ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {sessionKeyActive ? 'Session Key Active' : 'Create Session Key (5min)'}
          </button>

          <button
            onClick={mintWithMultiSig}
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700"
          >
            Mint with Multi-Sig
          </button>
        </div>
      </div>
    </div>
  );
};

export default NFTMinter; 