import {
	useAddress,
	useMetamask,
	useToken,
	useTokenBalance,
	useContract,
} from "@thirdweb-dev/react";
import { Token } from "@thirdweb-dev/sdk";
import { BigNumber, Contract, ethers } from "ethers";
import { id } from "ethers/lib/utils";
import type { NextPage } from "next";
import { MissingStaticPage } from "next/dist/shared/lib/utils";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";

const gcoinAddress = "0x207Af744eC3890aB62655344122894370ec49455";
const stakingContractAddress = "0x9a054AC32D4704404247864F4E20CD30244Ed212";

const Stake: NextPage = () => {
	//wallet connection hooks
	const address = useAddress();
	const connectWithMetaMask = useMetamask();

	//contract hooks
	const gcoinContract = useToken(gcoinAddress);
	const {contract, isLoading} = useContract(stakingContractAddress);

	//load token balance
	const {data: tokenBalance} = useTokenBalance(gcoinContract, address);

	//custom contract functions
	const [claimableRewards, setAvailableRewards] = useState<BigNumber>();
	const [rewardsScore, setRewardsScore] = useState<BigNumber>();
	const [tokens, setTokens] = useState<BigNumber>();

	//get unclaimed rewards
	useEffect(() => {
		if(!contract || !address) return;

		async function loadUnclaimedRewards(){
			const ucr = await contract?.call("availableRewards", address);
			console.log("Loaded unclaimed rewards", ucr);
			setAvailableRewards(ucr);
		}
		loadUnclaimedRewards();

	}, [address, contract]);

	//get rewards score
	useEffect(() => {
		if(!contract || !address) return;

		async function loadRewardScore(){
			await contract?.call("updateRewardScore", address);
			const rs = await contract?.call("seeRewardScore", address);
			console.log("Loaded reward score", rs);
			setRewardsScore(rs);
		}
		loadRewardScore();

	}, [address, contract]);

	//write functions
	async function stakeCoins(id: BigNumber){
		if (!address) return;
		//not really sure about safetransfers and approval here
		const isApproved = await gcoinContract?.allowance(address);
		if (!isApproved)
		{	
			await gcoinContract?.setAllowance(stakingContractAddress, id.toNumber());
		}
		console.log("BUTTONPRESS");
		gcoinContract?.setAllowance(stakingContractAddress, id.toNumber());
		const stake = await contract?.call("stake", id);
	}

	async function withdraw(id: BigNumber){
		const withdraw = await contract?.call("withdraw", id);
	}

	async function claimRewards(){
		const claim = await contract?.call("claimRewards");
	}

	if(isLoading){
		return <div>Loading . . . </div>;
	}

	return(
		<div className={styles.container}>
			<h1 className={styles.h1}>Stake your Tokens</h1>

			<hr className={`${styles.divider} ${styles.spaceTop}`}/>

			{!address ? (
				<button className={styles.mainButton} onClick={connectWithMetaMask}> Connect Wallet </button>
			) : (
				<>
				<h2>Your Account Score</h2> 
				<b>
				{!rewardsScore ? 
				"Reward Score not available at this time." : 
				(ethers.utils.formatUnits(rewardsScore,18))
				}
			</b>{" "}

				<div className={styles.tokenGrid}>
					<div className={styles.tokenItem}>
						<h3 className={styles.tokenLabel}>Claimable Rewards</h3>
						<p className={styles.tokenValue}>
							<b>
								{!claimableRewards ? 
								"No claimable rewards at this time." : 
								ethers.utils.formatUnits(claimableRewards, 18)
								}
							</b>{" "}
								{tokenBalance?.symbol}
						</p>
					</div>

					<div className={styles.tokenItem}>
						<h3 className={styles.tokenLabel}>Current Balance</h3>
						<p className={styles.tokenValue}>
							<b>{tokenBalance?.displayValue}</b> {tokenBalance?.symbol}
						</p>
					</div>
				</div>

				<button
					className={`${styles.mainButton} ${styles.spacerTop}`}
					onClick={() => claimRewards()}
				>
					Claim Rewards
				</button>

				<hr className={`${styles.divider} ${styles.spacerTop}`} />
				<div>
					
				<input
						type="number"
						placeholder="Amount of tokens"
						value={tokens?.toNumber()}
						onChange={(e) => setTokens(BigNumber.from(e.target.value))}
						className={styles.textInput}
						style={{alignItems: "center"}}
						/>

				<div style={{alignItems: "center"}}>
				<button
					className={`${styles.mainButton} ${styles.spacerBottom}`}
					onClick={() => stakeCoins(BigNumber.from(tokens))}
					>
					Stake
					</button>
					
					<button
					className={`${styles.mainButton} ${styles.spacerBottom}`}
					onClick={() => withdraw(BigNumber.from(tokens))}
					>
					Withdraw
					</button>

				</div>
					
				</div>
				</>
			)
			}
		</div>
	);
};

export default Stake;