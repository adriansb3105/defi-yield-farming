import { useState } from "react";
import { useAccount, useNetwork, useContractRead, usePrepareContractWrite, useContractWrite } from "wagmi";
import TokenFarmArtifact from "../../../hardhat/artifacts/contracts/TokenFarm.sol/TokenFarm.json";
import LPTokenArtifact from "../../../hardhat/artifacts/contracts/LPToken.sol/LPToken.json";
import hardhatContracts from "../../generated/hardhat_contracts.json";

export default function Home() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const [amount, setAmount] = useState("0");

  // Obtener nombres y direcciones del contrato
  const chainName = chain?.name || "localhost";
  const tokenFarmAddress = hardhatContracts[chainName]?.TokenFarm[0]?.address || "";
  const lpTokenAddress = hardhatContracts[chainName]?.LPToken[0]?.address || "";

  // --- Leer balances ---
  const { data: stakingBalance } = useContractRead({
    address: tokenFarmAddress,
    abi: TokenFarmArtifact.abi,
    functionName: "stakingBalance",
    args: [address],
    watch: true,
  });

  const { data: pendingRewards } = useContractRead({
    address: tokenFarmAddress,
    abi: TokenFarmArtifact.abi,
    functionName: "pendingRewards",
    args: [address],
    watch: true,
  });

  const { data: lpBalance } = useContractRead({
    address: lpTokenAddress,
    abi: LPTokenArtifact.abi,
    functionName: "balanceOf",
    args: [address],
    watch: true,
  });

  // --- Prepare Deposit ---
  const { config: depositConfig } = usePrepareContractWrite({
    address: tokenFarmAddress,
    abi: TokenFarmArtifact.abi,
    functionName: "deposit",
    args: [BigInt(amount || "0")],
  });
  const { write: deposit } = useContractWrite(depositConfig);

  // --- Prepare Withdraw ---
  const { config: withdrawConfig } = usePrepareContractWrite({
    address: tokenFarmAddress,
    abi: TokenFarmArtifact.abi,
    functionName: "withdraw",
    args: [BigInt(amount || "0")],
  });
  const { write: withdraw } = useContractWrite(withdrawConfig);

  // --- Prepare Claim Rewards ---
  const { config: claimConfig } = usePrepareContractWrite({
    address: tokenFarmAddress,
    abi: TokenFarmArtifact.abi,
    functionName: "claimRewards",
  });
  const { write: claim } = useContractWrite(claimConfig);

  // --- Prepare Approve LPToken ---
  const { config: approveConfig } = usePrepareContractWrite({
    address: lpTokenAddress,
    abi: LPTokenArtifact.abi,
    functionName: "approve",
    args: [tokenFarmAddress, BigInt(amount || "0")],
  });
  const { write: approve } = useContractWrite(approveConfig);

  // --- Prepare Mint LPToken ---
  const { config: mintConfig } = usePrepareContractWrite({
    address: lpTokenAddress,
    abi: LPTokenArtifact.abi,
    functionName: "mint",
    args: [address, BigInt(amount || "0")],
  });
  const { write: mint } = useContractWrite(mintConfig);

  return (
    <div className="flex flex-col items-center gap-6 p-10">
      <h1 className="text-3xl font-bold">🌱 Token Farm</h1>

      <div className="text-lg text-center">
        <p>👤 Tu dirección: {address}</p>
        <p>📊 Staking balance: {stakingBalance?.toString() || "0"} LPT</p>
        <p>💰 Recompensas pendientes: {pendingRewards?.toString() || "0"} DAPP</p>
        <p>🟢 LP balance: {lpBalance?.toString() || "0"} LPT</p>
      </div>

      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Cantidad (wei)"
        className="border rounded px-3 py-2 w-64 text-center"
      />

      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={() => mint && mint()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow"
        >
          Mint LPToken
        </button>

        <button
          onClick={() => approve && approve()}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg shadow"
        >
          Approve LPToken
        </button>

        <button
          onClick={() => deposit && deposit()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow"
        >
          Deposit
        </button>

        <button
          onClick={() => withdraw && withdraw()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg shadow"
        >
          Withdraw
        </button>

        <button
          onClick={() => claim && claim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow"
        >
          Claim Rewards
        </button>
      </div>
    </div>
  );
}
