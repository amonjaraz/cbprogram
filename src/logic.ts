declare function require(name: string):any
const CoinbasePro = require('coinbase-pro');
const timLib = require('timestampconvertjs')
const { isNull } = require('util');
const { promises } = require('dns');
import fs from 'fs'
import { arrayBuffer } from 'stream/consumers';
const sdk = require('api')('@coinbase-exchange/v1.0#1n77vk3ikushsqg9');
const secrets = require('./secret')

const CoinTag = 'ETH-USD'

interface ICBSocket {
    currentPrice:number
    maxPrice:number
    startTrackingMaxPrice(currentMaxPrice: number) : void  

    stopTrackingMaxPrice(): number 

    authenticate(): void

    startSocket(callback: any): void

    closeSocket(): void

}

class CoinbaseSocketUtil implements ICBSocket  {
    secret = '';
    key = '';
    passphrase = '';
    sandboxURI = 'https://api-public.sandbox.pro.coinbase.com';
    websocketURL =  'wss://ws-feed-public.sandbox.pro.coinbase.com'
    coinTag = ''

    authClient = null;
    websocket:any = {};
    currentPrice = 0;
    live = false;
    maxPrice = 0;
    trackMaxPriceInterval:ReturnType<typeof setInterval> | any;
    constructor(isReal: boolean, coinTag: string){
        if (isReal){
            this.websocketURL = 'wss://ws-feed.exchange.coinbase.com'
            this.coinTag = coinTag
        }
        this.trackMaxPriceInterval = undefined;
    }

    startTrackingMaxPrice = (currentMaxPrice: number) =>{
        this.maxPrice = currentMaxPrice
        this.trackMaxPriceInterval = setInterval(()=>{
            if (this.maxPrice < this.currentPrice) this.maxPrice = this.currentPrice
        },1000)
    }

    stopTrackingMaxPrice(){
        clearInterval(this.trackMaxPriceInterval)
        return this.maxPrice
    }

    authenticate(){
        this.authClient = new CoinbasePro.AuthenticatedClient(
            this.key,
            this.secret,
            this.passphrase,
            this.sandboxURI
        );
    }

    startSocket(callback: any){
        this.websocket = new CoinbasePro.WebsocketClient([this.coinTag],
        this.websocketURL,
            null,
            {channels: ['ticker']}
        )

        this.websocket.on('open', (response:any)=>{
            console.log("web socket OPEN")
        })

        var isFirst = true;
        this.websocket.on('message', (data:any) => {
            
            this.live=true;
          if (isFirst && data.type === 'subscriptions'){
              this.websocket.unsubscribe({ channels: ['heartbeat'] });
              isFirst=false;
          }
          //here we can track price
          this.currentPrice = data.price
          callback(data.price)
          //when price is at our goal, we buy using stop limit order, 
              //we can go further here and trail the low and continue moving the stop down until we reach the lowest point and it starts moving back up at resistance. 
              //if it continues down too far we can either cancell the order since we were wrong. We can gamble and buy the further dip too.
          //after we successfully buy
              //we can then set our stop loss immediately since we are assuming it is not going down any further.
              //we then monitor price and move our stop loss market order further up with price, keeping a margin below the current price. 
              //eventually our stop is hit and we sell w/ market order.
        });

        this.websocket.on('error', (err:any) => {
          console.log("web socket ERROR")
        });

        this.websocket.on('close', () => {
          console.log("web socket CLOSED")
          this.live=false;
        });
    }

    closeSocket(){
        this.websocket.disconnect();
        this.live=false;
    }
}

interface ICBTradeUtil {
    authClient: any
    authenticate(): void 
    /* Example
    {
        created_at:'2021-10-11T03:09:41.623976Z'
        executed_value:'0'
        fill_fees:'0'
        filled_size:'0'
        id:'5b6a9a17-3fa3-4da0-bdb4-20dbb648cd65'
        post_only:false
        price:'60000.00'
        product_id:'BTC-USD'
        settled:false
        side:'buy'
        size:'0.001'
        status:'pending'
        stp:'dc'
        time_in_force:'GTC'
        type:'limit'
    }
    */
    buyLimitOrder(purchasePrice: string, size: string, product_id: string):Promise<any> 
    sellLimitOrder(sellPrice: string, size: string, product_id: string):Promise<any>  
    getOrder(orderId: string): Promise<any> 


    //example of returned data
    /*
    {created_at:'2021-10-11T02:19:31.339836Z'
    done_at:'2021-10-11T02:19:31.339836Z'
    done_reason:'filled'
    executed_value:'55.4412300000000000'
    fill_fees:'0.2772061500000000'
    filled_size:'0.00100000'
    id:'3cb2daaf-211d-4ff8-9a36-dcda4caf664a'
    post_only:false
    price:'56000.00000000'
    product_id:'BTC-USD'
    profile_id:'d087ad88-a805-4773-b988-57e70dc67122'
    settled:true
    side:'buy'
    size:'0.00100000'
    status:'done'
    time_in_force:'GTC'
    type:'limit'}
    */
    IsOrderFilled(orderid: string): Promise< any>
    cancelOrderById(orderId: string) : Promise<any> 
}

class CoinbaseTradeUtil implements ICBTradeUtil  {
    secret = secrets.secretTradeSANDBOX
    key = '62e6d2474c821163883ad1eacb331562';
    passphrase = '1pse3d2el4q';
    sandboxURI = 'https://api-public.sandbox.pro.coinbase.com';
    authClient:any = {};

    constructor(isReal:boolean){
        if (isReal){
            this.secret = secrets.secretTradeLIVE
            this.key = '77432bff8fc3194764049609ceebe08f'
            this.passphrase = 'rd6dipe7l4j'
            this.sandboxURI = 'https://api.pro.coinbase.com'
        }
    }

    authenticate(){
        this.authClient = new CoinbasePro.AuthenticatedClient(
            this.key,
            this.secret,
            this.passphrase,
            this.sandboxURI
        );
        this.authClient.getCoinbaseAccounts((error:any, response:any, data:any)=>{
            console.log("   Authenticated")
        })
    }

    async buyLimitOrder(purchasePrice: string, size: string, product_id: string) {
        const buyParams = {
            price: purchasePrice, // '100.00' usd
            size: size, // '1' btc
            product_id: product_id, // 'BTC-USD'
          };
        return new Promise( (resolve, reject)=> this.authClient.buy(buyParams, (error:any, response:any, data:any)=>{
            if(error){
                //failed
                console.log("Error buying.", error)
                reject('Failed to place order')
            }
            else{
                //success
                console.log("Purchase Limit Order Placed Success")
                
                resolve(data)
            }
          }))
    }
    async sellLimitOrder(sellPrice:string, size: string, product_id: string) {
        const buyParams = {
            price: sellPrice, // '100.00' usd
            size: size, // '1' btc
            product_id: product_id, // 'BTC-USD'
          };
        return new Promise( (resolve, reject)=> this.authClient.sell(buyParams, (error:any, response:any, data:any)=>{
            if(error){
                //failed
                console.log("Error Selling.", error)
                reject('Failed to place order')
            }
            else{
                //success
                console.log("Sell Limit Order Placed Success")
                
                resolve(data)
            }
          }))
    }

    async getOrder(orderId: string){
        return new Promise((resolve, reject)=>{
            this.authClient.getOrder(orderId, (error:any, response:any, data:any)=>{
                if (error) {
                    reject('Get Order Failed')
                }
                else {
                    resolve(data)
                }
            });
        })
    }

    //example of returned data
    /*
    {created_at:'2021-10-11T02:19:31.339836Z'
    done_at:'2021-10-11T02:19:31.339836Z'
    done_reason:'filled'
    executed_value:'55.4412300000000000'
    fill_fees:'0.2772061500000000'
    filled_size:'0.00100000'
    id:'3cb2daaf-211d-4ff8-9a36-dcda4caf664a'
    post_only:false
    price:'56000.00000000'
    product_id:'BTC-USD'
    profile_id:'d087ad88-a805-4773-b988-57e70dc67122'
    settled:true
    side:'buy'
    size:'0.00100000'
    status:'done'
    time_in_force:'GTC'
    type:'limit'}
    */
    async IsOrderFilled(orderid: string){
        return new Promise((resolve, reject)=>{
            this.getOrder(orderid).then( (data: any) =>{
                if (data.status === 'done') {
                    resolve({filled: true,data: data})
                }
                else resolve({filled: false,data: data})
            }).catch(error=>{
                reject("error checking if order filled")
            })
        })

    }

    async cancelOrderById(orderId:string ){
        return new Promise((resolve, reject)=>{
            this.authClient.cancelOrder(orderId, (error:any, response:any, data:any)=>{
                if (error){
                    reject(error);
                }
                else{
                    resolve('Order Cancelled ')
                }
            })
        })
    }
}

class mockCBSocketUtil implements ICBSocket {
    currentPrice: number = 0
    maxPrice: number = 0

    constructor(){

    }
    startTrackingMaxPrice(currentMaxPrice: number): void {
        console.log("Mock start tracking max price")
    }
    stopTrackingMaxPrice(): number {
        console.log("Mock end tracking max price")
        return 1
    }
    authenticate(): void {
        console.log("Mock Authenticated.")
    }
    startSocket(callback: any): void {
        console.log("Mock start Socket")
    }
    closeSocket(): void {
        console.log("Mock close Socket")
    }
    
}


class mockCBTradeUtil implements ICBTradeUtil {
    authClient: mockCoinbaseClient;
    constructor(client: any){
        this.authClient = client
    }
    authenticate(): void {
        console.log("Mock Authenticate Trade Util")
    }
    buyLimitOrder(purchasePrice: string, size: string, product_id: string): Promise<any> {
        return Promise.resolve(this.authClient.buyLimitOrder(Number.parseFloat(purchasePrice), Number.parseFloat(size)))
    }
    sellLimitOrder(sellPrice: string, size: string, product_id: string): Promise<any> {
        return Promise.resolve(this.authClient.sellLimitOrder(Number.parseFloat(sellPrice), Number.parseFloat(size)))
    }
    getOrder(orderId: string): Promise<any> {
        return Promise.resolve(this.authClient.getOrder(orderId))
    }
    IsOrderFilled(orderid: string): Promise<any> {
        const order:any = this.authClient.getOrder(orderid)
        if (order.status == 'done') return Promise.resolve({filled: true, data: order})
        else return Promise.resolve({filled: false, data: order})
    }
    cancelOrderById(orderId: string): Promise<any> {
        return Promise.resolve(this.authClient.cancelOrder(orderId))
    }

}

class mockCoinbaseClient {

    orders:Map<string, object> = new Map()
    orderCount:number = 0
    numberOfChecks = 0
    candles:any 
    currentCandleIndex:number = 0
    socketObject: ICBSocket
    constructor(mockSocketUtil: ICBSocket){
        this.socketObject = mockSocketUtil

    }

    //cancelOrder
    cancelOrder = (orderId: string)=>{
        return this.orders.delete(orderId)
    }

    //getOrder
    getOrder = (orderId: string)=>{
        
        this.updateCandelIndexIfNeeded() //update candal after every 20 requests. Minimum should be 2 but playing it safe and going with 20.
        this.updateOrders()
        this.updateSocketPrice()
        return this.orders.get(orderId)
    }
    //sellLimit
    sellLimitOrder = (price: number, size: number) =>{
        this.orderCount++
        const id = "sell" + (this.orderCount.toString())
        this.orders.set(id, {
            id: id,
            price: price,
            size: size,
            side: 'sell',
            status: 'open',
            executed_value: 0,
            filled_size: 0,
            fill_fees: 0,
            created_at: id
        })
        return this.orders.get(id)
    }
    //buyLimit
    buyLimitOrder = (price: number, size: number) => {
        this.orderCount++
        const id = "buy" + (this.orderCount.toString())
        this.orders.set(id, {
            id: id,
            price: price,
            size: size,
            side: 'buy',
            status: "open", 
            executed_value: 0,
            filled_size: 0,
            fill_fees: 0,
            created_at: id
        })
        return this.orders.get(id)
    }

    //BACKEND Functions
    async delay(ms:number) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
    //loadOrders
    loadCandles = async (productId: string, days: number) =>{
        return new Promise(async (resolve, reject)=>{
            let start: number = 0;
            let end: number = 0;
            let delta: number = 300* 60 *1000 // number of miliseconds range allowed in a request
            let i: number = 0;
            let done: boolean = false
            const startDate = new Date()
            startDate.setDate(startDate.getDate()-days)
            const startTime = startDate.getTime()
            const endTime = Date.now()
            let array:number[][] = []
            while (!done){
                end = endTime - i*delta
                start = end - delta
                i++
                console.log(new Date(start).toUTCString())
                console.log(new Date(end).toUTCString())
                console.log("----------")
                
                if (start > startTime) {
                    await sdk['ExchangeRESTAPI_GetProductCandles']({
                        product_id: productId,
                        granularity: 60, //minutes
                        start: new Date(start).toUTCString(),  
                        end: new Date(end).toUTCString() // comes after start
                    })
                        .then( (res:any) => {
                            array = array.concat(res)
                        })
                        .catch( (err:any) => console.error(err));
                    await this.delay(1000)
                } 
                else done = true;
    
            }
            //filter repeated values
            array = array.filter((element:number[], index: number)=>{
                for(let i=0; i< array.length; i++){
                    if (element[0] === array[i][0] && i != index) return false
                }
                return true
            })
            //sort from lowest timestap to highest
            array = array.sort((a:number[], b:number[])=>{
                return a[0]-b[0]
            })
            this.candles = array
            resolve(array)
        })

    }

    //start async
    updateCandelIndexIfNeeded () {
        this.numberOfChecks++
        if (this.numberOfChecks == 20){
            this.numberOfChecks = 0
            this.currentCandleIndex++
        }
    }

    updateOrders(){
        const currentCandle = this.candles[this.currentCandleIndex]
        const low = currentCandle[1]
        const high = currentCandle[2]
        let dateObj = null
        this.orders.forEach((value: any, key, map)=>{
            if (value.status == 'open' && value.price <= high && value.price >= low ){
                value.status = 'done'
                value.executed_value = value.price * value.size
                value.filled_size = value.size
                value.fill_fees = value.executed_value * 0.001 // our target fee range
                dateObj = timLib.convertToLocalTime(currentCandle[0] * 1000, false);
                value.created_at = `${dateObj.monthName} ${dateObj.day} ${dateObj.year} ${dateObj.formattedTime}`
            }
        })
    }

    updateSocketPrice(){
        const currentCandle = this.candles[this.currentCandleIndex]
        const low = currentCandle[1]
        const high = currentCandle[2]
        this.socketObject.currentPrice = low //Asumption. Using this as worse case scenario. (triggers stop loss, doesn't trigger profitable sells)
    }

    setStartingCadelIndex(dateTime:string){
        const time = Math.round(Date.parse(dateTime)/1000) //'01 Jan 2021 00:00:00 GMT-0600'
        this.candles.find((candle: number[], index: number)=>{
            if (Math.abs(candle[0] - time) <60) { //if candle timestamp within 60 seconds
                this.currentCandleIndex = index
                return true
            }
            else return false
        })
    }



    
}


module.exports = {CoinbaseSocketUtil, CoinbaseTradeUtil, CoinTag, mockCoinbaseClient, mockCBSocketUtil, mockCBTradeUtil};