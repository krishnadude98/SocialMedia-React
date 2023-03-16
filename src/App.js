import './App.css';
import React, { useEffect, useState ,useRef} from 'react';
import Popup from 'reactjs-popup';
import { useForm } from "react-hook-form";
import contract from './contracts/SocialMedia.json';
import axios from 'axios';


const ethers = require("ethers")


const abi= contract.abi;
const contractAddress="0x70ea858706db44c29553917bf0d5df96964d835b";




function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [data, setData] = useState(0);
  const [event,setEvent]= useState(null);
  const [loaded,setLoaded]= useState(false);
  const [count,setCount]=useState(0);
  const [posts,setPosts]=useState([]);
  const [image, setImage] = useState(null);
  const [ipfs,setIpfs]= useState(null);
  const [webhookData, setWebhookData] = useState(null);
  const dataref = useRef(null);
  const[SocialMediaContract,setSocialMediaContract]=useState(null);
  const [messages, setMessages] = useState([]);
  
  let provider,signer;
  let apikey=process.env.API_KEY;
  let apisecret= process.env.SECRET;

  const handleImageChange = (event) => {
    setImage(event.target.files[0]);
  };
  const handleImageUpload = async () => {
    const formData = new FormData();
    formData.append('file', image);

    try {
      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          pinata_api_key: "2984d527d66781d2f9f4",
          pinata_secret_api_key: "ae62594140b67988cec546e01baa4cd3bcde9cd0e4593d5ef8b753ab03858d9d",
        },
      });
      console.log("IPFS=>",response.data.IpfsHash)
      setIpfs(response.data.IpfsHash);
    } catch (error) {
      console.error(error);
    }
  };
  
  const checkWalletIsConnected = async() => { 
    const {ethereum}=window;
    if(!ethereum){
      <Popup 
            position="right center">
                <div>Metamask Not Found!!</div>
                <h5>Pls install metamask extension and setup <a href='https://youtu.be/4pLAxp9dgYM'>metamask</a></h5>
        </Popup>
    }
    const accounts=await ethereum.request({method:'eth_requestAccounts'})

    if(accounts.length !==0){
      const account= accounts[0];
      setCurrentAccount(account)
    }else{
      console.log("Not authorized accounts found")
    }

  };

  const createPostButton = () => {
    return (
      <button className='cta-button mint-nft-button'>
        Wallet Connected {`(${currentAccount})`}
      </button>
    )
  }

  const getButton=() =>{
    return (
      <button className='cta-button mint-nft-button' onClick={()=>{setData(data+1)}}>
       View posts
      </button>
    )
  }

  const connectWalletHandler = async () => { 
    const {ethereum}=window;
    if(!ethereum){
      <Popup 
            position="right center">
                <div>Metamask Not Found!!</div>
                <h5>Pls install metamask extension and setup <a href='https://youtu.be/4pLAxp9dgYM'>metamask</a></h5>
        </Popup>
    }
    try{
      const accounts=await ethereum.request({method:'eth_requestAccounts'});
      console.log(`Account connected address: ${accounts[0]}`);
      setCurrentAccount(accounts[0]);
    }catch(err){
      console.log(err)
    }

  }


  const connectWalletButton = () => {
    return (
      <button onClick={connectWalletHandler} className='cta-button connect-wallet-button'>
        Connect Wallet
      </button>
    )
  }
  
 


  
  
  useEffect( () => { 
    async function fetchData() {
        try {
          const {ethereum}= window;
          let postCount=0;
          if(ethereum){
             provider = new ethers.providers.Web3Provider(window.ethereum)
             signer= provider.getSigner();
             let SocialMediaContract= new ethers.Contract(contractAddress,abi,signer);
             setSocialMediaContract(SocialMediaContract)
             console.log(SocialMediaContract)
             let count= await SocialMediaContract.getTotalPost();
             setCount(count.toNumber());
             console.log(count);
          }else{
            console.log("no etherium object");
          }
        } catch (err) {
            console.log(err);
        }
    }
    fetchData();
  }, [currentAccount]);

  useEffect(()=>{
    async function fetchData() {
        console.log("FETCH DATA")
      
        for(let i=1;i<=count;i++){
          try{
            let post= await SocialMediaContract.getPost(`${i}`);
            
            if(post.postUid!==0 && post.text!="" && post.User != "0x0000000000000000000000000000000000000000"){
              let mypost= {postuid:post.postUid.toString(),user:post.User,text:post.text,ipfs:post.ipfsHash}
              console.log("mypost",mypost)
              let temp=posts;
              temp[posts.length]=mypost;
              setPosts(temp);
  
            }
            
          }catch(e){
            console.log(e)
            
          }
          
        }
        setLoaded(true);
     

    }
    fetchData();
  },[count]);




  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const onSubmit = async data => {
    console.log(SocialMediaContract)
    try{
      let tx= await SocialMediaContract.createPost(data.text,data.hash);
      tx.wait(1)
      alert(`Transaction sucessfull tx hash ${tx.hash}`)
    }catch(e){
      if(e.message.includes("ACTION_REJECTED",0)){
        alert(`Transaction canceled by user`)
      }
    }
    
 
  };
  const onSubmit2 = async data => {
    try{
      console.log("INSISIDE DELETE")
      console.log(SocialMediaContract)
      let tx= await SocialMediaContract.deletePost(data.postuid);
      tx.wait(1)
      console.log(tx.hash);
      alert(`Transaction sucessfull tx hash ${tx.hash}`)
    }catch(e){
      if(e.message.includes("ACTION_REJECTED",0)){
        alert(`Transaction canceled by user`)
      }
      else if(e.message.includes("deletePost__InvalidPostUid",0)){
        alert("Provided postuid is not exsitent or alreasdy deleted")
      }
      else if(e.message.includes("deletePost__SenderNotPoster",0)){
        alert("You are not the post owner")
      }
      else if(e.message.includes("transaction may fail")){
        alert("You are not the post owner")
      }
      else{
        console.log(e)
      }
    }
    
 
  };

  const postForm= ()=>{
    return(
    <form onSubmit={handleSubmit(onSubmit)} className="post-form">
      {/* Register input fields with form instance */}
      <h4>Write a Post</h4>
      <br/>
      <label>What's in you mind</label>
      <input {...register("text")} />
      <label >Ipfs Hash :</label>
      <input ref={dataref} type="text" {...register("hash")} />
      <button type="submit">Post!</button>
      <br/>
      </form>
    )
  }

  const deleteForm= ()=>{
    return(
    <form onSubmit={handleSubmit(onSubmit2)} className="post-form">
      {/* Register input fields with form instance */}
      <h4>Delete a Post</h4>
      <br/>
      <label>Post UID :</label>
      <input {...register("postuid")} />
      <button type="submit">Delete</button>
      <br/>
      </form>
    )
  }

  async function handleSentinelNotification() {
   new Promise((resolve,reject)=>{
    SocialMediaContract.once("NewPost", async function () {
      console.log("new post event happened");
      try {
        setEvent(true);
        resolve()

      } catch (error) {
          console.log(error);
          reject(error);
      }
      
  });
   })
  }

  useEffect(() => {
    handleSentinelNotification()
  });


  useEffect(()=>{
    setData(data+1)
  },[event]);

  // useEffect(() => {
   
    
  //   // Define a callback function for event subscription
    
    
  //   const getEvents= () =>{
  //       SocialMediaContract.on("NewPost",(users,ipfsHash,text,postId)=>{
  //         console.log("event happened")
  //         setEvent(postId);
  //       }

        
  // )}

  //   getEvents();
  //     // Return a cleanup function to unsubscribe from events
      
  //   });
    


    return (
      <div className='main-app'>
      <h1>Hari's Social Media</h1>
      <div>
      {currentAccount ? postForm():(<br></br>)}
      {currentAccount ? (<h4>Don't have hash use ? use below service to generate hash </h4>) : (<h3></h3>)}
      {currentAccount ?(
      <div>
      <input type="file" onChange={handleImageChange} />
      <button onClick={handleImageUpload}>Upload Image</button>
      <h3>{ipfs}</h3>
      </div>):(<h2></h2>)}
      {currentAccount ? deleteForm():(<br></br>)}
      {currentAccount ? createPostButton() : connectWalletButton()}
      

      {currentAccount ? getButton():<br></br>}
      {currentAccount&&loaded && count? (
          <div>
          <h5>Posts</h5>
      
    
          <div>
            {
              posts.map(post =>(
                <ul className='user-post'>
                  {console.log(post.user)}
                  <ul>Posted By: {post.user}</ul>
                  <img className='postImg' src={"https://gateway.pinata.cloud/ipfs/"+post.ipfs}/>
                  <ul>Caption:{post.text}   POSTUID: {post.postuid}</ul>
                 
                </ul>
              ))
            }
  
          </div>
        </div>
      ):(
        <div>Loading</div>
      )}


      
      
      
      
      
      </div>
    </div>
    );
}

export default App;
