import * as React from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json'

export default function App() {
  //Just a state variable to store our user's public wallet address.
  const[currAccount, setCurrAccount] = React.useState("");
  const contractAddress = "0xD5CbdaF99be31141102EEDA046a95f728EF5e8e5";
  const contractABI = abi.abi;
  const [allWaves, setAllWaves] = React.useState([]);
  const [newMessage, setNewMessage] = React.useState("")

  const checkIfWalletIsConnected = () => {
    //First make sure we have access to window.ethereum
    const {ethereum} = window;
    if(!ethereum){
      console.log("Make sure you have metamask!");
      return;
    }else{
      console.log("We have the ethereum object", ethereum);
    }

    //Check if we're authorized to access the user's wallet
    ethereum.request({method: 'eth_accounts'})
    .then(accounts => {
      //We could have multiple accounts. Check for one.
      if(accounts.length !== 0 ){
        //Grab the first account we have access to.
        const account = accounts[0];
        console.log("Found an authorized account: ", account);

        //Store the users public wallet address for later
        setCurrAccount(account);

        getAllWaves();
      }else{
        console.log("No authorized accounts found");
      }
    })
  }

  const connectWallet = () =>{
    const {ethereum} = window;
    if(!ethereum){
      alert("Get metamask!");
    }

    ethereum.request({method: 'eth_requestAccounts'}).then(accounts => {
      console.log("Connected", accounts[0]);
      setCurrAccount(accounts[0]);
    }).catch(err => console.log(err));
  }

  const wave = async () =>{
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const waveportalContract = new ethers.Contract(contractAddress, contractABI, signer);


    let count = await waveportalContract.getTotalWaves();
    console.log("retrieved total wave count...", count.toNumber());

    //writing transactions most be notify to miners. Only readings can surpass this
    const waveTxn = await waveportalContract.wave(newMessage, { gasLimit: 300000 });
    console.log("Mining...", waveTxn.hash);
    await waveTxn.wait()
    console.log("Mined == ", waveTxn.hash);

    count = await waveportalContract.getTotalWaves();
    console.log("Retrieve total wave count...", count.toNumber());
    // getAllWaves();
    setNewMessage("");
  }

  async function getAllWaves(){
    console.log("entered getAllWaves");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const waveportalContract = new ethers.Contract(contractAddress, contractABI, signer);

    let waves = await waveportalContract.getAllWaves();

    let wavesCleaned = [];
    waves.forEach(wave=>{
      wavesCleaned.push({
        address: wave.waver,
        timestamp: new Date(wave.timestamp * 1000),
        message:wave.message
      })
    });

    setAllWaves(wavesCleaned);

    //to catch event from contract
    waveportalContract.on("NewWave",(from, timestamp, message)=>{
      console.log("NewWave", from, timestamp, message);
      setAllWaves(oldArray=>[...oldArray, {
        address: from,
        timestamp: new Date(timestamp*1000),
        message: message
      }]);
    } );
  }

  //This runs our function when the page loads
  React.useEffect(()=>{
    checkIfWalletIsConnected()
  },[])

  const waveList = allWaves.map((wave, index) => {
          return(
            <li key={index}>
              <div className="waveLi">
                <h4>{wave.message}</h4>
                <div>From: {wave.address}</div>
                <div>At: {wave.timestamp.toString()}</div>
                
              </div>
            </li>
          )
        });

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        <span role="img" aria-label="waving hand">👋</span> Hey there! 
        </div>

        <div className="bio">
        I am Gaby and I am a CS student who want to learn some new stuff. Connect your Ethereum wallet and wave at me!
        </div>

        <div className="waveCountDiv">
        Waves Received: {allWaves.length}
        </div>

        <div className="inputBlock">
        <div className="textInput">
         <input type="text" placeholder="new message" value={newMessage} onChange={e => setNewMessage(e.target.value)}/>
        </div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>
        </div>

        {currAccount? null: (
          <button className="cnntWalletButton" onClick={connectWallet}>
          Connect Wallet
        </button>
        )}

        <div>
          <ol>{waveList}</ol>
        </div>
      </div>
    </div>
  );
}
