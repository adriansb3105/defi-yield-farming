// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenFarm is Ownable {
    IERC20 public dappToken;
    IERC20 public lpToken;

    // Información del stake de cada usuario
    struct Staker {
        uint256 amount;        // cuánto LP tiene stakeado
        uint256 rewards;       // recompensas acumuladas en DAPP
        uint256 lastUpdate;    // último timestamp en que se actualizaron sus recompensas
    }

    mapping(address => Staker) public stakers;
    uint256 public rewardRate = 1e18; // 1 DAPP por segundo por LP token (ajústalo según quieras)

    // Eventos
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsDistributed(address indexed user, uint256 amount);

    constructor(address _dappToken, address _lpToken) Ownable(msg.sender) {
        dappToken = IERC20(_dappToken);
        lpToken = IERC20(_lpToken);
    }

    // --- Interno: actualizar recompensas ---
    function _updateRewards(address user) internal {
        if (stakers[user].amount > 0) {
            uint256 timeDiff = block.timestamp - stakers[user].lastUpdate;
            uint256 pending = (stakers[user].amount * rewardRate * timeDiff) / 1e18;
            stakers[user].rewards += pending;
        }
        stakers[user].lastUpdate = block.timestamp;
    }

    // --- Depositar LP tokens ---
    function deposit(uint256 _amount) external {
        require(_amount > 0, "Deposito invalido");
        _updateRewards(msg.sender);

        lpToken.transferFrom(msg.sender, address(this), _amount);
        stakers[msg.sender].amount += _amount;

        emit Deposit(msg.sender, _amount);
    }

    // --- Retirar LP tokens ---
    function withdraw(uint256 _amount) external {
        require(_amount > 0, "Retiro invalido");
        require(stakers[msg.sender].amount >= _amount, "Fondos insuficientes");
        _updateRewards(msg.sender);

        stakers[msg.sender].amount -= _amount;
        lpToken.transfer(msg.sender, _amount);

        emit Withdraw(msg.sender, _amount);
    }

    // --- Reclamar recompensas ---
    function claimRewards() external {
        _updateRewards(msg.sender);
        uint256 reward = stakers[msg.sender].rewards;
        require(reward > 0, "No hay recompensas");

        stakers[msg.sender].rewards = 0;
        dappToken.transfer(msg.sender, reward);

        emit RewardsClaimed(msg.sender, reward);
    }

    // --- Distribuir recompensas a un usuario manualmente ---
    function distributeRewards(address user) external onlyOwner {
        _updateRewards(user);
        uint256 reward = stakers[user].rewards;
        if (reward > 0) {
            stakers[user].rewards = 0;
            dappToken.transfer(user, reward);
            emit RewardsDistributed(user, reward);
        }
    }

    // --- Distribuir recompensas a todos (solo para demo, no escalable) ---
    function distributeRewardsAll(address[] calldata users) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            _updateRewards(users[i]);
            uint256 reward = stakers[users[i]].rewards;
            if (reward > 0) {
                stakers[users[i]].rewards = 0;
                dappToken.transfer(users[i], reward);
                emit RewardsDistributed(users[i], reward);
            }
        }
    }

    // --- Helpers ---
    function stakingBalance(address user) external view returns (uint256) {
        return stakers[user].amount;
    }

    function pendingRewards(address user) external view returns (uint256) {
        if (stakers[user].amount == 0) return stakers[user].rewards;
        uint256 timeDiff = block.timestamp - stakers[user].lastUpdate;
        uint256 pending = (stakers[user].amount * rewardRate * timeDiff) / 1e18;
        return stakers[user].rewards + pending;
    }
}
