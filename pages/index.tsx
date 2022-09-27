import { ConnectWallet } from "@thirdweb-dev/react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";


const Home: NextPage = () => {
  const router = useRouter();

  return (
    <div>
      <ConnectWallet accentColor="#f213a4" colorMode="dark" />

      <div
          className={styles.optionSelectBox}
          role="button"
          onClick={() => router.push(`/stake`)}
        >
          {/* Staking an NFT */}
          {/*<img src={`/icons/token.webp`} alt="drop" />*/}
          <h2 className={styles.selectBoxTitle}>Stake Your NFTs</h2>
        </div>
    </div>
  );
};

export default Home;
