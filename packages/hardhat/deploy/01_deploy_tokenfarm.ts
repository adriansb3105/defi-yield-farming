import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy DappToken
  const dappToken = await deploy("DappToken", {
    from: deployer,
    args: [deployer],
    log: true,
  });

  // Deploy LPToken
  const lpToken = await deploy("LPToken", {
    from: deployer,
    args: [deployer],
    log: true,
  });

  // Deploy TokenFarm
  const tokenFarm = await deploy("TokenFarm", {
    from: deployer,
    args: [dappToken.address, lpToken.address],
    log: true,
  });

  console.log("DappToken deployed to:", dappToken.address);
  console.log("LPToken deployed to:", lpToken.address);
  console.log("TokenFarm deployed to:", tokenFarm.address);
};

export default func;
func.tags = ["TokenFarm"];
