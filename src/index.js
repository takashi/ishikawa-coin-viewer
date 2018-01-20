import React from 'react';
import ReactDOM from 'react-dom';
import Web3 from 'web3';
import ERC20ABI from 'human-standard-token-abi'

const promisify = (func, that) => {
  return (...arg) => {
    return new Promise((resolve, reject) => {
      const callback = (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
      let args = [...arg, callback]
      func.apply(that, args);
    })
  }
}

class IshikawaCoin {
  constructor(web3) {
    this.web3 = web3;
  }

  token() {
    let contract = this.web3.eth.contract(ERC20ABI)
    console.log(contract.abi);

    // The Ishikawa Coin contract
    return promisify(contract.at, contract)('0x6a728fb48483b523fdd24433add743d1ee1fc82e');
  }

  async totalSupply() {
    let token = await this.token();
    return promisify(token.totalSupply)();
  }

  async getBalance(address) {
    let token = await this.token();
    console.log(token);

    return promisify(token.balanceOf)(address);
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { coin: new IshikawaCoin(this.props.web3Client), supply: 0, notice: '', address: '', balance: null }
  }

  async componentDidMount() {
    let supply = await this.state.coin.totalSupply()
    let networkID = await this.getEthNetworkID()
    let notice;
    switch (networkID) {
      case "1":
        notice = 'This is mainnet';
        break
      case "2":
        notice = 'This is the deprecated Morden test network.';
        break
      case "3":
        notice = 'This is the ropsten test network.';
        break
      case "4":
        notice = 'This is the Rinkeby test network.';
        break
      case "42":
        notice = 'This is the Kovan test network.';
        break
      default:
        notice = 'This is an unknown network.';
    }
    this.setState({ supply: supply.toFormat(), notice });
  }

  async getEthNetworkID() {
    return promisify(this.props.web3Client.version.getNetwork)();
  }

  /**
   * shoud be called in polling because of:
   * https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#ear-listening-for-selected-account-changes
   */
  getAccounts() {
    this.props.web3Client.eth.getAccounts((err, result) => {
      console.log(result);
    });
  }

  onChange(e) {
    this.setState({address: e.target.value});
  }

  async onSubmit() {
    let balance = await this.state.coin.getBalance(this.state.address);
    this.setState({ balance: balance.toFormat() })
  }

  render() {
    return (
      <div>
        <p>
          {this.state.notice}
        </p>
        <p>
          total Ishikawa Coin supply is {this.state.supply}
        </p>
        {
          this.state.balance &&
          <p>your Ishikawa coin balance is {this.state.balance}</p>
        }
        <input type="text" value={this.state.address} onChange={this.onChange.bind(this)} />
        <input type="submit" onClick={this.onSubmit.bind(this)} />
      </div>
    )
  }
}

// web3 setup
window.addEventListener('load', function() {
  if (typeof web3 !== undefined) {
    // Metamask or Mist

    // Global web3.currentProvider object will be removed both Metamask and Mist.
    // https://github.com/ethereum/mist/releases/tag/v0.9.0
    // https://github.com/MetaMask/faq/blob/master/detecting_metamask.md#deprecation-of-global-web3js
    let web3js = new Web3(web3.currentProvider);

    // Run
    ReactDOM.render(
      <App web3Client={web3js} hoge="aaa" />,
      document.querySelector('#main')
    );
  } else {
    // try to connect test net on local?
  }
});

