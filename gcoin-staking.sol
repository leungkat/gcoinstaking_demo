// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract gcoinStaking is ReentrancyGuard, Ownable {
	using SafeERC20 for IERC20;

	//interface for erc20
	IERC20 public immutable gcoin;

	//constructor
	constructor(IERC20 _gcoin){
		gcoin = _gcoin;
	}

	struct Staker{
		//amount of tokens staked by user
		uint256 totalAmountStaked;

		//last time of reward calculation for this user
		uint256 timeLastUpdated;

		//rewards (score) for user
		uint256 rewardScore;

		//calculated rewards from last period
		uint256 unclaimedRewards;
	}

	//input given every month
	uint256 private rewardsTotal = 0;

	//map the user addresses to the staker info
	mapping(address => Staker) public stakers;

	//keep an array of addresses
	address[] private staker_addresses;


	function stake(uint256 _numcoins) external nonReentrant{
		//if this wallet already has staked coins, calculate the rewards before adding more coins
		if(stakers[msg.sender].totalAmountStaked > 0){
			uint256 rewards = calculateRewards(msg.sender);
			stakers[msg.sender].rewardScore += rewards;
		}
		else{
			//if this wallet is new, add to the array of addresses
			staker_addresses.push(msg.sender);
		}

		require(_numcoins > 0, "You need to stake more than 0 coins." );
		//wallet must have the amount of coins they say they do
		require(gcoin.balanceOf(msg.sender) >= _numcoins, "Error: You don't have enough coins in your wallet!");

		//okay send the new coins over now
		require(gcoin.transferFrom(msg.sender, address(this), _numcoins), "Error: something went wrong when transferring");

		//update the amount staked for this wallet
		stakers[msg.sender].totalAmountStaked += _numcoins;
		//update time for staker
		stakers[msg.sender].timeLastUpdated = block.timestamp;

	}

	function withdraw (uint256 _numcoins) external nonReentrant{
		//make sure the user has enough coins to withdraw
		require(stakers[msg.sender].totalAmountStaked >= _numcoins, "Error: You have not staked enough coins to withdraw this amount!");

		uint256 rewards = calculateRewards(msg.sender);

		//remove the amount requested
		stakers[msg.sender].totalAmountStaked -= _numcoins;

		//update the rewards
		stakers[msg.sender].rewardScore += rewards;	

		//return coins to staker
		gcoin.safeTransfer(msg.sender, _numcoins);

		//update time for staker
		stakers[msg.sender].timeLastUpdated = block.timestamp;
	}

	function claimRewards() external{	//to send users rewards they have gotten from last period
		//check if the staker has any unclaimed rewards
		require(stakers[msg.sender].unclaimedRewards > 0, "Error: You currently have no rewards to claim. Please check back at the end of the month.");

		uint256 rewards = stakers[msg.sender].unclaimedRewards;

		//reset the unclaimed rewards to 0
		stakers[msg.sender].unclaimedRewards = 0;

		//transfer the unclaimed rewards
		gcoin.safeTransfer(msg.sender, rewards);

		//update rewardstotal
		rewardsTotal -= rewards;
	}

	function scoreToRewards(uint _coinsToDistrubute) public {	//used for the end of the period, to change users reward scores to 0 and add to their unclaimed rewards

		//update rewardScore for all stakers
		for(uint256 i = 0; i < staker_addresses.length; i++){
			calculateRewards(staker_addresses[i]);
		}

		uint256 totalRewardScore = 0;

		//calculate the total rewards score
		for(uint256 i = 0; i < staker_addresses.length; i++){
			totalRewardScore += stakers[staker_addresses[i]].rewardScore;
		}

		//calculate the unit to rewardScore 
		//uint256 unitRewardScore = _coinsToDistrubute/totalRewardScore;

		//update all unclaimedRewards for stakers
		for(uint256 i = 0; i < staker_addresses.length; i++){
			address t = staker_addresses[i];
			stakers[t].unclaimedRewards += stakers[t].rewardScore * _coinsToDistrubute/totalRewardScore;//unitRewardScore;
			stakers[t].rewardScore = 0;
			stakers[t].timeLastUpdated = block.timestamp;
		}

		rewardsTotal += _coinsToDistrubute;
	}

	function calculateRewards(address _staker) internal view returns(uint256 _rewards){
		//calculates rewardScore at a point in time

		return(
			(block.timestamp - stakers[_staker].timeLastUpdated) * stakers[_staker].totalAmountStaked
		);

	}

	function availableRewards( address _staker ) public view returns (uint256){
		return stakers[_staker].unclaimedRewards;
	}

	function updateRewardScore( address _staker ) public{
		stakers[_staker].rewardScore += calculateRewards(_staker);
		stakers[_staker].timeLastUpdated = block.timestamp;
	}

	function seeRewardScore ( address _staker ) public view returns (uint256){
		return stakers[_staker].rewardScore;
	}

	function getStakedTokens( address _staker ) public view returns (uint256){
		return stakers[_staker].totalAmountStaked;
	}

	function newRewardsTotal (uint256 _newRewards) public onlyOwner {
		//function already checks if the person calling this function is the owner

		//now add in the rewards
		rewardsTotal += _newRewards;
	}

	function viewRewardsTotal () public view returns (uint256){
		return rewardsTotal;
	}

}