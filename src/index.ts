import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QIcon, ColorGroup, QLineEdit, QSlider } from '@nodegui/nodegui';
import logo from '../assets/logox200.png';

import { isUndefined, isNullOrUndefined, isNumber } from 'util';
import Trade from './ctrade';

import CBLogic from './logic';
import {calculateGainRatio, calculateGrossProfitPercentage, calculateMinGainRatio, calculateMinProfitPrice, calculateSize, 
  calculateStopPrice, calculateInvestmentAmount, calculateMinStopAmount, calculateGrossProfitAmount} from './calculations'
/////////////////

////////////////
const cbSocketUtil = new CBLogic.CoinbaseSocketUtil();
const cbTradeUtil = new CBLogic.CoinbaseTradeUtil();
const trade = new Trade();

const productList = [{
    id: 'BTC-USD',
    sizeDecimals: 8,
    minSize: 0.0001
  }]

const win = new QMainWindow();
win.setWindowTitle("Alex's Trading Tool");

const centralWidget = new QWidget();
centralWidget.setObjectName("myroot");
const rootLayout = new FlexLayout();
centralWidget.setLayout(rootLayout);

//Live
const liveLabel = new QLabel();
liveLabel.setText(cbSocketUtil.live ? "LIVE": "OFF");
rootLayout.addWidget(liveLabel);

//Product ID
const product_id = CBLogic.CoinTag
const productIdLabel = new QLabel();
productIdLabel.setText(product_id);
rootLayout.addWidget(productIdLabel);

//Price
const priceLabel = new QLabel();
priceLabel.setText("Price");
const priceValue = new QLabel();
rootLayout.addWidget(priceLabel);
rootLayout.addWidget(priceValue);

//Purchase Price
const purchasePriceLabel = new QLabel();
purchasePriceLabel.setText("Purchase Price:");
const purchasePriceValue = new QLineEdit();
purchasePriceValue.setObjectName('numCharsInput');
rootLayout.addWidget(purchasePriceLabel);
rootLayout.addWidget(purchasePriceValue);

//Investment Amount
const investAmtLabel = new QLabel();
investAmtLabel.setText("Investment Amount:");
const investmentAmtValue = new QLabel();
investmentAmtValue.setObjectName('numCharsInput');
rootLayout.addWidget(investAmtLabel);
rootLayout.addWidget(investmentAmtValue);

//Risk Amount
const riskAmtLabel = new QLabel();
riskAmtLabel.setText("Risk Amount:");
const riskAmtInput = new QLineEdit();
riskAmtInput.setObjectName('numCharsInput');
rootLayout.addWidget(riskAmtLabel);
rootLayout.addWidget(riskAmtInput);

//Stop Price 
const stopPriceLabel = new QLabel();
stopPriceLabel.setText("Stop Price:");
const stopPriceInput = new QLineEdit();
stopPriceInput.setObjectName('numCharsInput');
rootLayout.addWidget(stopPriceLabel);
rootLayout.addWidget(stopPriceInput);

//Minimum Stop Size @ gain ratio 2:1
const minStopSizeAmountLabel = new QLabel();
minStopSizeAmountLabel.setText("Minimum Stop Amount 2:1:");
const minStopSizeValue= new QLabel();
minStopSizeValue.setObjectName('numCharsInput');
rootLayout.addWidget(minStopSizeAmountLabel);
rootLayout.addWidget(minStopSizeValue);

//Purchase Button
const purchaseButton = new QPushButton();
purchaseButton.setText("Purchase")
rootLayout.addWidget(purchaseButton);

//Size
const sizeAmtLabel = new QLabel();
sizeAmtLabel.setText("Crypto Size:");
const sizeAmtValue= new QLabel();
sizeAmtValue.setObjectName('numCharsInput');
rootLayout.addWidget(sizeAmtLabel);
rootLayout.addWidget(sizeAmtValue);

//Stop  Amount
const stopAmountLabel = new QLabel();
stopAmountLabel.setText("Stop  Amount:");
const stopAmountValue= new QLabel();
stopAmountValue.setObjectName('numCharsInput');
rootLayout.addWidget(stopAmountLabel);
rootLayout.addWidget(stopAmountValue);

//Minimum profit price goal 
const minPriceGoalLabel = new QLabel();
minPriceGoalLabel.setText("Minimum Profit price:");
const minPriceGoalValue= new QLabel();
minPriceGoalValue.setObjectName('numCharsInput');
rootLayout.addWidget(minPriceGoalLabel);
rootLayout.addWidget(minPriceGoalValue);

//Minimum gain ratio to profit
const minGainRatioLabel = new QLabel();
minGainRatioLabel.setText("Minimum Gain Ratio:");
const minGainRatioValue= new QLabel();
minPriceGoalValue.setObjectName('numCharsInput');
rootLayout.addWidget(minGainRatioLabel);
rootLayout.addWidget(minGainRatioValue);

//Sell Price Input
const sellPriceInputLabel = new QLabel();
sellPriceInputLabel.setText("Sell Price:");
const sellPriceValue = new QLineEdit();
sellPriceValue.setObjectName('numCharsInput');
rootLayout.addWidget(sellPriceInputLabel);
rootLayout.addWidget(sellPriceValue);


//Profit %
const profitPercentLabel = new QLabel();
profitPercentLabel.setText("Gross Profit %");
const profitPercentValue= new QLabel();
profitPercentValue.setObjectName('numCharsInput');
rootLayout.addWidget(profitPercentLabel);
rootLayout.addWidget(profitPercentValue);

// gain ratio
const gainRatioLabel = new QLabel();
gainRatioLabel.setText("Gain Ratio:");
const gainRatioValue= new QLabel();
gainRatioValue.setObjectName('numCharsInput');
rootLayout.addWidget(gainRatioLabel);
rootLayout.addWidget(gainRatioValue);

// gain ratio
const profitAmountLabel = new QLabel();
profitAmountLabel.setText("Gross Profit $:");
const profitAmountValue= new QLabel();
gainRatioValue.setObjectName('numCharsInput');
rootLayout.addWidget(profitAmountLabel);
rootLayout.addWidget(profitAmountValue);

//below we have the sell button,
  //here we create a trailing stop (sell below x number.)

const convertToNumber = ( text: string, n: number) =>{
  return Number.parseFloat(text).toFixed(n);
}

//Stop Increment  Input
const stopIncrementInputLabel = new QLabel();
stopIncrementInputLabel.setText("Stop Increment:");
const stopIncrementValue = new QLineEdit();
sellPriceValue.setObjectName('numCharsInput');
rootLayout.addWidget(stopIncrementInputLabel);
rootLayout.addWidget(stopIncrementValue);


//Increase Stop  Button
const buttonIncreaseStop = new QPushButton();
buttonIncreaseStop.setText("Increase Stop")
rootLayout.addWidget(buttonIncreaseStop);

//New Stop Price   Input
const NewStopPriceLabel = new QLabel();
NewStopPriceLabel.setText("New Stop Price:");
const NewStopPriceInput = new QLineEdit();
sellPriceValue.setObjectName('numCharsInput');
rootLayout.addWidget(NewStopPriceLabel);
rootLayout.addWidget(NewStopPriceInput);


//Increase Stop  Button
const buttonSetNewStop = new QPushButton();
buttonSetNewStop.setText("Set Stop")
rootLayout.addWidget(buttonSetNewStop);

//Start Socket Button
const buttonStartSocket = new QPushButton();
buttonStartSocket.setText("Start Socket")
buttonStartSocket.addEventListener('clicked', ()=>{
  cbSocketUtil.startSocket(updateTags)
  
})
rootLayout.addWidget(buttonStartSocket);

//Close Socket Button
const buttonCloseSocket = new QPushButton();
buttonCloseSocket.setText("Close Socket")
buttonCloseSocket.addEventListener('clicked', ()=>{
  cbSocketUtil.closeSocket()
  
})
rootLayout.addWidget(buttonCloseSocket);

//Get Orders Button
const getOrdersButton = new QPushButton();
getOrdersButton.setText("Get All Orders")
getOrdersButton.addEventListener('clicked', ()=>{
  cbTradeUtil.getOrders()
  
})
rootLayout.addWidget(getOrdersButton);

//slider
const slider = new QSlider();
rootLayout.addWidget(slider);


win.setCentralWidget(centralWidget);
win.setStyleSheet(
  `
    #myroot {
      background-color: white;
      height: '100%';
      align-items: 'center';
      justify-content: 'center';
    }
    #mylabel {
      font-size: 16px;
      font-weight: bold;
      padding: 1;
    }
  `
);
win.show();

(global as any).win = win;
///////////////
const getPurchasePrice = ()=>{
  return convertToNumber(purchasePriceValue.text(),2)
}

const getStopPrice = () =>{
  return convertToNumber(stopPriceInput.text(),2)
}

const getRiskAmount = () =>{
  return convertToNumber(riskAmtInput.text(),2)
}

const getSellPrice = () =>{
  return convertToNumber(sellPriceValue.text(),2)
}

const getStopIncrementAmount = () =>{
  return convertToNumber(stopIncrementValue.text(),2)
}

const getStopAmount = () =>{
  const purchasePrice = getPurchasePrice()
  const stopPrice = getStopPrice()
  return (Number.parseFloat(purchasePrice) - Number.parseFloat(stopPrice)) 
}

const updateTags = ()=>{
  priceValue.setText(cbSocketUtil.currentPrice)
  liveLabel.setText(cbSocketUtil.live ? "LIVE": "OFF");
  //pull inputs.
  const purchasePrice = getPurchasePrice()
  const stopPrice = getStopPrice()
  const stopAmount = getStopAmount()
  const riskAmount = getRiskAmount()
  const sellPrice = getSellPrice()
  //calculations
  const investmentAmount = calculateInvestmentAmount(purchasePrice, riskAmount, stopAmount)
  const size = calculateSize(riskAmount, stopAmount)
  const grossProfitPercentage = calculateGrossProfitPercentage(purchasePrice,sellPrice)
  //SET TEXT 
  sizeAmtValue.setText(size)
  investmentAmtValue.setText(investmentAmount)
  stopAmountValue.setText(stopAmount)
  minPriceGoalValue.setText(calculateMinProfitPrice(purchasePrice))
  minGainRatioValue.setText(calculateMinGainRatio(purchasePrice,stopAmount))
  profitPercentValue.setText(grossProfitPercentage)
  gainRatioValue.setText(calculateGainRatio(purchasePrice, stopAmount, sellPrice))
  minStopSizeValue.setText(calculateMinStopAmount(purchasePrice))
  profitAmountValue.setText(calculateGrossProfitAmount(size, purchasePrice, sellPrice))
}

//Process Function
// This method will attempt create buy limit order at specified price. Then it will 
//poll the api to see when the order is filled 10 times per second. Once the order is 
//filled, it will create a stop order.
const purchaseProcess = async (purchasePrice: any, size: any, product_id: any, stopPrice: any)=>{
  return new Promise(async (resolve, reject)=>{
    let orderId = '';
    let processComplete = false;
    //place buy order
    await cbTradeUtil.buyLimitOrder(purchasePrice, size, product_id).then((data)=>{
      orderId = data.id
    }).catch((err)=>{
      console.log(err)
      reject('Failed to place Order.')
    })
    //check order status and then place stop loss order
    await cbTradeUtil.getOrder(orderId).then((data)=>{
      if (data.status === 'done') {
        //create stop market order return
        console.log("CREATING STOP MARKET ORDER")
        cbTradeUtil.stopMarketOrder(stopPrice, size, product_id).then((data)=>{
          resolve(data)
        }).catch((error)=>{
          reject(error)
        })
        processComplete = true;
      } 
    }).catch(err=>{
      console.log("failed to get order: " + orderId)

    })
    if (!processComplete){
      const interval = setInterval(()=>{
        cbTradeUtil.getOrder(orderId).then((data)=>{
          if (data.status === 'done') {
            //create stop market order return
            console.log("CREATING STOP MARKET ORDER")
            cbTradeUtil.stopMarketOrder(stopPrice, size, product_id).then((data)=>{
              resolve(data)
            }).catch((error)=>{
              reject(error)
            }).finally(()=>{
              clearInterval(interval)
            })
            processComplete = true;
          } 
          else {
            console.log("Order Not Filled: ", data.status)
          }
        }).catch(err=>{
          console.log("failed to get order: " + orderId)
        })
      }, 1000) // ping every 1000 miliseconds
    }
  })
} //end purchaseProcess

/*RaiseStopOrder, this method will cancell our existing stop sell order and raise it up to the specified price.
we will have buttons to increase it by x amount which you can enter.
*/
const raiseStopOrder = async (newStopPrice: any,size: any, existingOrderId:any)=>{
  return new Promise((resolve, reject)=>{
    //cancel order
    cbTradeUtil.cancelOrderById(existingOrderId).then(()=>{
      //create new order
      cbTradeUtil.stopMarketOrder(newStopPrice, size, product_id).then((data)=>{
        resolve(data)
      }).catch((error)=>{
        reject(error)
      }).finally(()=>{
        
      })
    }).catch((error)=>{
      reject(error)
    })

  })
}


//Event Listeners
let currentStopDetails = {
  price: 0,
  size: 0,
  id: ''
}
sellPriceValue.addEventListener('textChanged', updateTags)
purchasePriceValue.addEventListener('textChanged', updateTags)
riskAmtInput.addEventListener('textChanged', updateTags)
stopPriceInput.addEventListener('textChanged', updateTags)
purchaseButton.addEventListener('clicked', ()=>{
  const purchasePrice = getPurchasePrice();
  const riskAmount = getRiskAmount();
  const stopAmount = getStopAmount();
  const size = calculateSize(riskAmount, stopAmount);
  const stopPrice = calculateStopPrice(purchasePrice, stopAmount);
  purchaseProcess(purchasePrice, size, product_id, stopPrice).then( (result:any) =>{
    console.log(result)
    //set stop price variable
    currentStopDetails.id = result.id
    currentStopDetails.price = Number.parseFloat(result.price)
    currentStopDetails.size = Number.parseFloat(result.size)

  }).catch(error=>{
    console.log(error)
  })
});
buttonIncreaseStop.addEventListener('clicked', ()=>{

  const newStopPrice = (currentStopDetails.price + Number.parseFloat(getStopIncrementAmount())).toFixed(2)

  raiseStopOrder(newStopPrice, currentStopDetails.size, currentStopDetails.id).then( (result:any) =>{
    console.log(result)
    //set stop price variable
    currentStopDetails.id = result.id
    currentStopDetails.price = Number.parseFloat(result.price)
    currentStopDetails.size = Number.parseFloat(result.size)
  }).catch(error=>{
    console.log(error)
  })
})
buttonSetNewStop.addEventListener('clicked', ()=>{

  const newStopPrice = (NewStopPriceInput.text())

  raiseStopOrder(newStopPrice, currentStopDetails.size, currentStopDetails.id).then( (result:any) =>{
    console.log(result)
    //set stop price variable
    currentStopDetails.id = result.id
    currentStopDetails.price = Number.parseFloat(result.price)
    currentStopDetails.size = Number.parseFloat(result.size)
  }).catch(error=>{
    console.log(error)
  })
})
cbSocketUtil.startSocket(updateTags);
cbTradeUtil.authenticate();
