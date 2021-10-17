// remember to switch to src forlder then run node Triangle.js

const waitForUserInput = require('wait-for-user-input')
const CBUtil = require('./logic')
const { isNull, isUndefined } = require('util');
const fs = require('fs')
const _ = require("lodash")

const QNTOrderDetails = {
    minSize: .01,
    minPriceDecimals: 4,
    minAmountDecimals: 2,
}

const ADAOrderDetails = {
    minSize: 1,
    minPriceDecimals: 4,
    minAmountDecimals: 2,
}

const BTCOrderDetails = {
    minSize: .001,
    minPriceDecimals: 2,
    minAmountDecimals: 8,
}

const entryPrice= 2.1926
const finalPrice = 2.155
const sellPrice  = 2.181
const stopPrice = 2.14
const investment = 100
const riskAmount = 10
const minSize= 1 //smallest coin size
const minPriceDecimals=4//buy limit price decimals
const minAmountDecimals=2 //coin size decimals
const coinPair = 'ADA-USD'
const feePercentage = .2 // example: .2 = 0.2%
const profitPercentage = 0.2
const profitPercentage_a = .202
const profitPercentage_b = .7 // adjust so that order 19 has same price as sell price
const n = 20

let tradeUtil = null
let cbSocketUtil = null

getPercentageTriangle = (i, order,c)=>{
    return (i**order)/c
}

const printOrderTriangle = (proposedOrders, sizeTotal)=>{
    for (const element of proposedOrders){
        const length = Number.parseInt( Math.round( 100* Number.parseFloat(element.size)/sizeTotal))
        let text = element.orderId + ' '
        for(let i=0; i<length; i++){
            text = text + '*'
        }
        console.log(text)
        
    }
}

const pf = (price) =>{
    const maxLength = 12
    const output = Number.parseFloat(price).toFixed(minPriceDecimals)
    if (output.length<maxLength) return output.padStart(maxLength)
    else return output
}

const calculateMaxProfit = (proposedOrders) =>{
    let dollarsSpent = 0;
    let dollarsCollected = 0;
    let makerFee = 0.1
    let sizeBought = 0
    let sizeSold =0
    let localSellPrice = 0
    let sellCost = 0
    let averagePrice = 0
    let cashProfit = 0
    let sellPrice_b = 0
    let cashout_b = 0
    let profit_b = 0
    console.log("=============================Experimental Triangle==============================================")
    console.log(`Trade   $ spent ,| $ collected ,| $ Cash In Hand ,| avg. Price ,| sell price,|    Trade G. Profit,| sell price b ,| cashout b,| profit b`)
    console.log("================================================================================================")
    for (let i=0; i<proposedOrders.length; i++){
        cashProfit = 0
        cashout_b = 0
        profit_b=0
        sizeBought +=  Number.parseFloat(proposedOrders[i].size)
        dollarsSpent += (proposedOrders[i].limitPrice *  Number.parseFloat(proposedOrders[i].size))* (1+ (makerFee/100)) //cost of order + fees
        averagePrice = (dollarsSpent-dollarsCollected)/sizeBought
        console.log(`${i.toString().padStart(2)}A ${pf(dollarsSpent)} , ${pf(dollarsCollected)} , ${pf(investment + dollarsCollected-dollarsSpent)} , ${pf(averagePrice)} , ${pf(localSellPrice)} , ${pf(cashProfit)}`)
        if((0.75 * sizeBought) >= minSize && i<proposedOrders.length-1){
            sizeSold = 0.75 * sizeBought
            localSellPrice = proposedOrders[i].profitPrice_a //price higher than bought.
            sellPrice_b = averagePrice * (1+(profitPercentage_b/100)) // avg price instead of limit p. so that we gaurantee profitability
            
            cashProfit = (localSellPrice - averagePrice)*sizeSold //from sale A
            dollarsCollected += ( sizeSold * localSellPrice )
            sellCost          = ( sizeSold * localSellPrice )*(makerFee/100)
            dollarsSpent     += sellCost
            sizeBought = sizeBought - sizeSold
            averagePrice = (dollarsSpent-dollarsCollected)/sizeBought
            //----------
            cashout_b = (sizeBought) * (sellPrice_b)  // size bought has been updated to what's left over after sale A
            profit_b  = cashout_b + dollarsCollected - (dollarsSpent+cashout_b*(makerFee/100))
            proposedOrders[i+1].size = (Number.parseFloat(proposedOrders[i+1].size)+ sizeSold).toFixed(minAmountDecimals)
        }
        else {

        }
        if (i== proposedOrders.length -1){
            localSellPrice = sellPrice
            dollarsCollected += (sizeBought*  localSellPrice)
            sellCost =          (sizeBought * localSellPrice )*(makerFee/100)
            cashProfit = (localSellPrice - averagePrice)*sizeBought
            dollarsSpent += sellCost
        }
        console.log(`${i.toString().padStart(2)}B ${pf(dollarsSpent)} , ${pf(dollarsCollected)} , ${pf(investment + dollarsCollected-dollarsSpent)} , ${pf(averagePrice)} , ${pf(localSellPrice)} , ${pf(cashProfit)}, ${pf(sellPrice_b)} , ${pf(cashout_b)}, ${pf(profit_b)}`)
    }
    console.log("Max Profit", dollarsCollected - dollarsSpent )
    console.log("Risk", sizeBought* (averagePrice - stopPrice))
}

const calculations = (c, order, isTrade, b)=>{

    let proposedOrders = []
    let percentageTotal = 0
    let dollarsSpent = 0
    let sizeTotal = 0
    let risk = 0
    let averagePrice = 0
    let profitPrice = 0
    let profitPrice_a = 0
    let profitPrice_b = 0
    let breakEvenPrice = 0
    console.log(`============ORDER: ${order}===============`)
    console.log("Id |  Limit P. |  Amt.  | Profit P.  | Profit P. A  | Profit P. B  | B.E P. |Size Total | Total Spent")
    for (let i=0; i<=n; i++) {
        let percentage = b ? getPercentageTriangle(i, order, c) + b : getPercentageTriangle(i, order, c) 
        let buyPrice = entryPrice - ((entryPrice-finalPrice)/n)*i 
        let cost = investment * percentage
        let  size = cost/buyPrice
        if (size >= minSize){
            dollarsSpent += cost
            percentageTotal += percentage
            sizeTotal += cost/buyPrice

            averagePrice = dollarsSpent/sizeTotal
            profitPrice = averagePrice*(1.0+ (profitPercentage)/100.0)
            breakEvenPrice = averagePrice*(1.0+ (feePercentage)/100.0)
            profitPrice_a = buyPrice*(1.0+ (profitPercentage_a)/100.0)
            risk = (sizeTotal*(breakEvenPrice-stopPrice)) 
            console.log(`${i} | ${buyPrice.toFixed(minPriceDecimals)} | ${(size).toFixed(minAmountDecimals)} |  ${profitPrice.toFixed(minPriceDecimals)} | ${profitPrice_a.toFixed(minPriceDecimals)} | ${profitPrice_b.toFixed(minPriceDecimals)} | ${breakEvenPrice.toFixed(minPriceDecimals)} |${sizeTotal.toFixed(minAmountDecimals)} | ${dollarsSpent.toFixed(minPriceDecimals)}`)
            proposedOrders.push({
                orderId: i,
                limitPrice: buyPrice.toFixed(minPriceDecimals),
                size: (size).toFixed(minAmountDecimals),
                profitPrice: profitPrice.toFixed(minPriceDecimals),
                profitPrice_a: profitPrice_a.toFixed(minPriceDecimals),
                breakEvenPrice: breakEvenPrice
            })
        }

    }
    const calculatedStopPrice = (breakEvenPrice - (riskAmount/sizeTotal)).toFixed(minPriceDecimals)
    const calculatedInvestmentForRisk = (riskAmount/(1-(stopPrice/breakEvenPrice))).toFixed(minPriceDecimals)
    const calculatedProfit = (sellPrice - breakEvenPrice)*sizeTotal 
    const calculatedGain = (sellPrice - averagePrice)/averagePrice
    const minWinPercentage = 100*1/(1+(calculatedProfit/risk))
    const riskToReward = calculatedProfit/risk
    printOrderTriangle(proposedOrders, sizeTotal)
    console.log("==============")
    console.log("Average Price    ", averagePrice.toFixed(minPriceDecimals))
    console.log("Break Even Price ", breakEvenPrice.toFixed(minPriceDecimals))
    console.log("Final Price @ 1% ", (entryPrice/(1.01)).toFixed(3))
    console.log("Current Diff %   ", (((entryPrice/finalPrice)-1)*100).toFixed(3))
    console.log("Dollars spent    ", dollarsSpent.toFixed(minPriceDecimals))
    console.log("Percentage spent ", percentageTotal.toFixed(4))
    console.log("Size Total       ", sizeTotal.toFixed(minAmountDecimals))
    console.log("===============")
    console.log("Coin Pair   ", coinPair)
    console.log("Investment  ", investment)
    console.log("Entry Price ", entryPrice)
    console.log("Final Price ", finalPrice)
    console.log("Stop Price: ", stopPrice, (finalPrice-stopPrice)>0 ? '' : '<-----ERROR' )
    console.log("Sell Price  ", sellPrice, ` Gain: ${(100*calculatedGain).toFixed(2)} %`)
    console.log("Profit Price", profitPrice)
    
    console.log("Risk:       ", risk.toFixed(minPriceDecimals) )
    console.log(`Calculated Stop Price for R = $${riskAmount} at Inv.= ${investment} --> ${calculatedStopPrice}`)
    console.log(`Calculated Investment for R = $${riskAmount} at S.P = ${stopPrice} --> ${calculatedInvestmentForRisk}`)
    console.log("Profit: $", calculatedProfit.toFixed(minPriceDecimals))
    console.log("R:R = 1:", (riskToReward).toFixed(4) )
    console.log(`M.W.R: ${(minWinPercentage).toFixed(1)}%`)
    calculateMaxProfit(_.cloneDeep(proposedOrders))
    return proposedOrders
}

const quadraticCalc = (isTrade)=>{
    const c = ((n**3)/3) + ((n**2)/2) + ((n)/6)
    calculations(c, 2,isTrade)
}

const cubicCalc = (isTrade)=>{
    const c = ((n**4)/4) + ((n**3)/2) + ((n**2)/4)
    calculations(c, 3,isTrade)
}

const linearCalc = (isTrade) => {
    const c = ((n**2)/2) + ((n)/2)
    calculations(c, 1,isTrade)
}

const quadraticTrapazoidCalc = (isTrade)=>{
    //n=20 assuming
    const b = (entryPrice*minSize)/investment
    const c = -2870/(21*b-1)
    calculations(c,2,isTrade, b)
}

const cubicTrapazoidCalc = (isTrade)=>{
    //n=20 assuming
    const b = (entryPrice*minSize)/investment
    const c = -44100/(21*b-1) //you can increase -44100 to 58191 if you want something higher than cubic like x^3.1
    return calculations(c,3,isTrade, b)
}

let isTesting = false
const smallDelay = async (time) =>{
    return new Promise((resolve, reject)=>{
        let timeDelay = time
        if (isTesting) timeDelay = 1
        else if (isUndefined(time)) timeDelay = 100
        
        setTimeout(()=>{
            resolve()
        }, timeDelay)
    })
}

const cancelOrder = async (orderId) =>{
    return new Promise(async (resolve, reject)=>{
        let done = false
        while(!done) {
            await tradeUtil.cancelOrderById(orderId).then(()=>{
                console.log("Cancelled Order")
                done = true
                resolve()
            }).catch(err=>{
                console.log("Error cancelling order.",err)
            })
            await smallDelay()
        }
    })
}

const tradeFileName = `trade-${Date.now()}`
const writeOrderDetails = (order)=>{

      content = `${order.side}, ${order.price}, ${order.filled_size}, ${order.executed_value}, ${order.fill_fees}, ${order.product_id}, ${order.created_at} \n`
      fs.writeFile(`C:/Users/amteagle/Desktop/Hobby/Quant/nodegui/nodegui-starter/trades/${tradeFileName}`, content, {flag: 'a'}, err => {
        if (err) {
          console.error(err)
          return
        }
        //file written successfully
      })
}

const writeLog = (message)=>{

    content = `${message} \n`
    fs.writeFile(`C:/Users/amteagle/Desktop/Hobby/Quant/nodegui/nodegui-starter/trades/current.txt`, content, {flag: 'a'}, err => {
      if (err) {
        console.error(err)
        return
      }
      //file written successfully
    })
}


//gets both order details and returns when one of them is filled. The orders need to be at different prices (otherwise possible to return both orders as filled)
const getFirstFilledOrder = async (buyOrderId, sellOrderId)=>{
    return new Promise(async (resolve, reject)=>{
        let done = false;
        let message = {sellOrderFilled: false, buyOrderFilled: false, sellOrder: null, buyOrder: null}
        while (!done) {
            if (!isNull(sellOrderId)){
                await tradeUtil.IsOrderFilled(sellOrderId).then(async result=>{
                    message.sellOrder = result.data
                    if(result.filled){
                        done = true
                        message.sellOrderFilled = true
                    }
                }).catch(err=>{
                    console.log("Failed to check Sell Order")
                })
            }
            await tradeUtil.IsOrderFilled(buyOrderId).then(async result=>{
                message.buyOrder = result.data
                if(result.filled){
                    done = true
                    message.buyOrderFilled = true
                }
            }).catch(err=>{
                console.log("Failed to check Buy Order.")
            })
            if (done) resolve(message)
            await smallDelay(1000)
        }
    })
}

const createSellOrder = async (profitPrice, totalSize)=>{
    return new Promise(async (resolve, reject)=>{
        let done = false
        while (!done) {
            await tradeUtil.sellLimitOrder(profitPrice, totalSize, coinPair).then((data)=>{
                console.log("Created Sell Order")
                done = true
                resolve(data)
            }).catch(err=>{
                reject(`Unable to Create Sell Order profitPrice: ${profitPrice} size: ${totalSize}`)
            })
            await smallDelay()
        } 
    })
}


//Close Trade by waiting for final sell order to close OR create stop loss order to exit trade.
const finalSale = async (stopPrice, sellOrder) =>{
    return new Promise( async (resolve, reject)=>{
        let done = false
        while (!done) {
            if (cbSocketUtil.currentPrice <= stopPrice) {
                console.log("!!! STOP price hit.")
                await cancelOrder(sellOrder.id)
                const stopOrder = await createSellOrder(stopPrice.toFixed(minPriceDecimals), sellOrder.size)
                const filledOrder = await getFirstFilledOrder(stopOrder.id, null) //hack , still works
                writeOrderDetails(filledOrder.buyOrder)  //hack , still works
                done = true
                resolve("Sold at Stop Price")
            }
            else if (cbSocketUtil.currentPrice >= sellOrder.price ) {
                await tradeUtil.IsOrderFilled(sellOrder.id).then(async response=>{
                    if(!isNull(response.data)){
                        done = true
                        writeOrderDetails(response.data)
                    }
                }).catch(err=>{
                    console.log("Failed to check Sell Order")
                })
                resolve("Final Sell Order Hit, check if filled.")
            } else await tradeUtil.getOrder(sellOrder.id)
            await smallDelay()
        }
    })
}

const startUtils = (isLive) =>{
    tradeUtil = new CBUtil.CoinbaseTradeUtil(isLive)
    cbSocketUtil = new CBUtil.CoinbaseSocketUtil(isLive, coinPair);
    tradeUtil.authenticate();
    cbSocketUtil.startSocket((price)=>{
    })
}

const restartSocket = () =>{
    cbSocketUtil.startSocket((price)=>{
    })
}

const abortProgram = ()=>{
    console.log("Exiting Program -- Check Orders")
    process.exit()
}

const placeBuyOrder = async (element)=>{
    return new Promise(async (resolve, reject)=>{
        let done = false
        while (!done){
            await tradeUtil.buyLimitOrder(element.limitPrice, element.size, coinPair).then( data=>{
                console.log("Buy Order Placed.")
                done = true
                resolve(data)
            }).catch(err=>{
                console.log("Buy Limit Order Trade Failed : ", element.orderId)
            })
            await smallDelay()
        }
    })
}

const triangleMethod = async (proposedOrders) =>{
    let buyOrder = null
    let  sellOrder = null
    let sizeTotal = 0
    let isFirstOrder = true
    let firstFilledOrder = {}
    for( const element of proposedOrders){
        buyOrder = await placeBuyOrder(element)
        sizeTotal +=  Number.parseFloat(buyOrder.size)
        if (isFirstOrder){
            isFirstOrder = false
            await getFirstFilledOrder(buyOrder.id, null)
            sellOrder = await createSellOrder(element.profitPrice, sizeTotal.toFixed(minAmountDecimals))
        }
        else {
            firstFilledOrder = await getFirstFilledOrder(buyOrder.id, sellOrder.id)
            if (firstFilledOrder.buyOrderFilled) {
                await cancelOrder(sellOrder.id)
                sellOrder = await createSellOrder(element.profitPrice, sizeTotal.toFixed(minAmountDecimals)) 
            }
            else if (firstFilledOrder.sellOrderFilled) {
                await cancelOrder(buyOrder.id)
                abortProgram()
            }
        }    
    }
    //All buy orders filled, time to wait for either sell order or stop price.
    await finalSale(stopPrice, sellOrder).then(res=>{
        console.log(res)
    })
}

//return number rounded down at fixed precision
const toFixedPD = (number,precision) =>{
    return (Math.floor(number*10**precision)/10**precision)
} 

const calculatePercentageA = (priceOriginal, priceFinal, minimumPercentageA) =>{
    const gain = (priceFinal - priceOriginal)/priceOriginal
    if (gain < minimumPercentageA) return minimumPercentageA
    else return gain
}

const calculatePercentageAPrice = (maxPriceGainQueue, price, minimumPercentageA) =>{
    let minPercentage = minimumPercentageA
    if (maxPriceGainQueue.length == 3) {
        minPercentage = Math.min(...maxPriceGainQueue) 
    }
    writeLog(`Sell Order Gain Used: ${minPercentage}` )
    return Number.parseFloat(price)*(1+(minimumPercentageA/100))
}

const triangleMethod2 = async (proposedOrders) =>{
    let buyOrder = null
    let  sellOrderA = null
    let sellOrder = null
    let sizeTotal = 0
    let sizeASold = 0
    let dollarsSpent =0
    let dollarsCollected=0
    let dollarsSpentFees = 0
    let averagePrice = 0
    let isFirstOrder = true
    let firstFilledOrder = {}
    let isBuyOrderFilled = false
    let sellPriceB = 0
    let calculatedSellPriceA = 0
    let maxPriceGainQueue = []
    let feeNerfPercentage = .35/.1 // //TODO: remove this once we reach our 100k+ monthly trading volume
    //loop start
    for (let i=0; i<proposedOrders.length ; i++){
        //place buy order
        buyOrder = await placeBuyOrder(proposedOrders[i])
        writeLog("buy order placed" )
        //if first time
        if (isFirstOrder){
            isFirstOrder = false
            //wait till filled
            firstFilledOrder =await getFirstFilledOrder(buyOrder.id, null)
            cbSocketUtil.startTrackingMaxPrice(Number.parseFloat(firstFilledOrder.buyOrder.price))
            writeOrderDetails(firstFilledOrder.buyOrder)
            writeLog("1BUY,"+ firstFilledOrder.buyOrder.size)
            sizeTotal        += Number.parseFloat(firstFilledOrder.buyOrder.size)
            dollarsSpent     += Number.parseFloat(firstFilledOrder.buyOrder.executed_value) 
            dollarsSpentFees += Number.parseFloat(firstFilledOrder.buyOrder.fill_fees) 
            averagePrice = (dollarsSpent + dollarsSpentFees*feeNerfPercentage - dollarsCollected)/sizeTotal
            //place sell order small (size = 75% x Total Size, price = current profit price)
            if (sizeTotal*0.75 >= minSize) { 
                sizeASold = toFixedPD(sizeTotal*.75,minAmountDecimals)
                sellOrderA = await createSellOrder(proposedOrders[i].profitPrice_a, sizeASold.toFixed(minAmountDecimals) )
                writeLog("1SellA Order placed", sellOrderA.size)
            } 
        }
        //else
        else{
            isSellOrderAFilled =false
            sellPriceB = 0
            sellOrder = sellOrderA
            isBuyOrderFilled = false
            while (!isBuyOrderFilled){
                
                //wait till buy order filled OR (if sellOrderA && sellOrderB not null, Sell Order small filled(if any exist) OR Big sell order filled)
                firstFilledOrder = await getFirstFilledOrder(buyOrder.id, !isNull(sellOrder) ? sellOrder.id : null ) 
                //if buy order filled, sell order A could be partially filled
                if (firstFilledOrder.buyOrderFilled) { 
                    writeOrderDetails(firstFilledOrder.buyOrder)
                    if (!isNull(firstFilledOrder.sellOrder)) writeOrderDetails(firstFilledOrder.sellOrder)
                    writeLog("2BUY,", firstFilledOrder.buyOrder.size )
                    //add side and cost to variables
                    sizeTotal        += Number.parseFloat(firstFilledOrder.buyOrder.size) 
                    dollarsSpent     += Number.parseFloat(firstFilledOrder.buyOrder.executed_value) 
                    dollarsSpentFees += Number.parseFloat(firstFilledOrder.buyOrder.fill_fees) 
                    //account for partially filled sell order A
                    if (!isNull(firstFilledOrder.sellOrder)) {
                        sizeTotal        -= Number.parseFloat(firstFilledOrder.sellOrder.filled_size)
                        dollarsSpentFees += Number.parseFloat(firstFilledOrder.sellOrder.fill_fees)
                        dollarsCollected += Number.parseFloat(firstFilledOrder.sellOrder.executed_value)
                    }
                    averagePrice = (dollarsSpent + dollarsSpentFees*feeNerfPercentage - dollarsCollected)/sizeTotal
                    console.log("Average Price", averagePrice)
                    writeLog("about to cancel Sell Order A")
                   //cancell small sell order, if not null
                   if(!isNull(sellOrderA) && !isSellOrderAFilled && !firstFilledOrder.sellOrderFilled) await cancelOrder(sellOrderA.id) //todo: verify this is valid, both orders filling at the same time.

                    //if (i< last one), create two orders.
                    if (i>0 && i<(proposedOrders.length-1)){
                        cbSocketUtil.stopTrackingMaxPrice()
                        maxPriceGainQueue.push(calculatePercentageA(Number.parseFloat(proposedOrders[i-1].limitPrice), cbSocketUtil.maxPrice, profitPercentage_a))
                        if(maxPriceGainQueue.length > 3) maxPriceGainQueue.shift()
                        //create new small sell order w/ updated size IF .75xtotalSize > min size
                        if (sizeTotal*0.75 >= minSize) {
                            cbSocketUtil.startTrackingMaxPrice(Number.parseFloat(firstFilledOrder.buyOrder.price))
                            sizeASold = toFixedPD(sizeTotal*.75,minAmountDecimals)
                            calculatedSellPriceA = calculatePercentageAPrice(maxPriceGainQueue, Number.parseFloat(proposedOrders[i].limitPrice), profitPercentage_a).toFixed(minPriceDecimals)
                            sellOrderA = await createSellOrder(calculatedSellPriceA, sizeASold.toFixed(minAmountDecimals)) 
                            writeLog(`created sell orders. aPrice: ${proposedOrders[i].profitPrice_a} aSize: ${sizeASold.toFixed(minAmountDecimals)}`)
                        } 
                    }
                    else {
                        writeLog("about to create final sell  order"+toFixedPD(sizeTotal, minAmountDecimals).toFixed(minAmountDecimals))
                        sellOrder = await createSellOrder(sellPrice.toFixed(minPriceDecimals), toFixedPD(sizeTotal, minAmountDecimals).toFixed(minAmountDecimals))  
                    }
                    //continue to next buy order.
                    isBuyOrderFilled = true
                }
                else if (firstFilledOrder.sellOrderFilled && !(isSellOrderAFilled)) {
                //if small sell order filled, buy order could be partially filled
                    if (!isSellOrderAFilled) {
                        writeOrderDetails(firstFilledOrder.sellOrder)
                        if (!isNull(firstFilledOrder.buyOrder)) writeOrderDetails(firstFilledOrder.buyOrder)
                        writeLog("Sell order A filled")
                        isSellOrderAFilled = true
                        writeLog("About to cancel Buy Order")
                        //cancell buy order, 
                        if (!firstFilledOrder.buyOrderFilled) await cancelOrder(buyOrder.id) //todo: verify this is valid, both orders filling at the same time.
                        sizeTotal         -= Number.parseFloat(firstFilledOrder.sellOrder.size)           + Number.parseFloat(firstFilledOrder.buyOrder.filled_size) 
                        dollarsCollected  += Number.parseFloat(firstFilledOrder.sellOrder.executed_value) - Number.parseFloat(firstFilledOrder.buyOrder.executed_value)
                        dollarsSpentFees += Number.parseFloat(firstFilledOrder.sellOrder.fill_fees) + Number.parseFloat(firstFilledOrder.buyOrder.fill_fees)
                        averagePrice = (dollarsSpent + dollarsSpentFees*feeNerfPercentage - dollarsCollected)/sizeTotal
                        sellPriceB = averagePrice * (1+(profitPercentage_b/100))
                        console.log("Average Price", averagePrice)
                        console.log("Price B", sellPriceB)
                        //create new buy order with same limit price but new size (add what you just sold)
                            //add size that you just sold
                        proposedOrders[i].size = (Number.parseFloat(proposedOrders[i].size) + Number.parseFloat(firstFilledOrder.sellOrder.size) - Number.parseFloat(firstFilledOrder.buyOrder.filled_size) ).toFixed(minAmountDecimals)
                        writeLog("About to create new Buy Order, size: " , proposedOrders[i].size)
                        buyOrder = await placeBuyOrder(proposedOrders[i])
                        
                    } else if (cbSocketUtil.currentPrice >= sellPriceB ){
                        //if sell price B crossed, note: buy order could be partially filled
                        writeLog("About to cancel Buy Order")
                        //cancell buy order, 
                        await cancelOrder(buyOrder.id)
                        sizeTotal         += Number.parseFloat(firstFilledOrder.buyOrder.filled_size) 
                        writeLog("About to Sell All Market Order Order")
                        sellOrder = await createSellOrder(toFixedPD(sellPriceB.toFixed(minPriceDecimals),sizeTotal, minAmountDecimals).toFixed(minAmountDecimals))
                        firstFilledOrder = await getFirstFilledOrder(sellOrder.id, null) //hack, still  works
                        writeOrderDetails(firstFilledOrder.buyOrder) //hack, still  works
                        abortProgram()
                    }
                }
            }
        }
    }
    console.log(`spent ${dollarsSpent} collected ${dollarsCollected} fees ${dollarsSpentFees} net ${dollarsCollected - (dollarsSpent + dollarsSpentFees)} excludes final sell order/stop`)
    //end loop
    //monitor stop order, execute if necessary
    await finalSale(stopPrice, sellOrder).then(res=>{
        console.log(res)
    })
}

async function main () {
    let done = false
    let userInput = await waitForUserInput('Live or Dummy? (LIVE)-->  ')
    if (userInput == 'LIVE') startUtils(true)
    else startUtils(false)

    userInput = await waitForUserInput('Want to Trade? enter YES-->  ')
    if (userInput == 'YES') {
        let proposedOrders = cubicTrapazoidCalc()
        userInput = await waitForUserInput('Continue with Trade? YES-->  ')
        if (userInput== 'YES'){
            //triangleMethod(proposedOrders)
            triangleMethod2(proposedOrders)
            while (!done) {
                userInput = await waitForUserInput('Restart Socket? enter SOCKET-->  ')
                if (userInput=="SOCKET") restartSocket()
                else if (userInput =="DONE") done = true
            }
        }
    }
    else {
        cubicTrapazoidCalc()
    }
}

//main()

async function test() {
    isTesting= true
    cbSocketUtil = new CBUtil.mockCBSocketUtil()
    const mockClient = new CBUtil.mockCoinbaseClient(cbSocketUtil)
    tradeUtil = new CBUtil.mockCBTradeUtil(mockClient)
    tradeUtil.authenticate();
    cbSocketUtil.startSocket((price)=>{
    })
    
    await mockClient.loadCandles("ADA-USD",1)
    mockClient.setStartingCadelIndex('16 Oct 2021 14:00:00 GMT-0500')
    let proposedOrders = cubicTrapazoidCalc()
    triangleMethod2(proposedOrders)
}
test()