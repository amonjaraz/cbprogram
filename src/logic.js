"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var CoinbasePro = require('coinbase-pro');
var timLib = require('timestampconvertjs');
var isNull = require('util').isNull;
var promises = require('dns').promises;
var sdk = require('api')('@coinbase-exchange/v1.0#1n77vk3ikushsqg9');
var CoinTag = 'ETH-USD';
var CoinbaseSocketUtil = /** @class */ (function () {
    function CoinbaseSocketUtil(isReal, coinTag) {
        var _this = this;
        this.secret = 'p/oTxTuaCbgNsYwYsXSskM/C/c2n2CY0JmdUPnVMl3/+OhY51cJkSz0efln12Y/hn6Vo1NXuJvpZeemGbwsbcA==';
        this.key = '4ae8375b12a13ebae72cf486fe1edc2a';
        this.passphrase = 'qetcm2d0ywk';
        this.sandboxURI = 'https://api-public.sandbox.pro.coinbase.com';
        this.websocketURL = 'wss://ws-feed-public.sandbox.pro.coinbase.com';
        this.coinTag = '';
        this.authClient = null;
        this.websocket = {};
        this.currentPrice = 0;
        this.live = false;
        this.maxPrice = 0;
        this.startTrackingMaxPrice = function (currentMaxPrice) {
            _this.maxPrice = currentMaxPrice;
            _this.trackMaxPriceInterval = setInterval(function () {
                if (_this.maxPrice < _this.currentPrice)
                    _this.maxPrice = _this.currentPrice;
            }, 1000);
        };
        if (isReal) {
            this.websocketURL = 'wss://ws-feed.exchange.coinbase.com';
            this.coinTag = coinTag;
        }
        this.trackMaxPriceInterval = undefined;
    }
    CoinbaseSocketUtil.prototype.stopTrackingMaxPrice = function () {
        clearInterval(this.trackMaxPriceInterval);
        return this.maxPrice;
    };
    CoinbaseSocketUtil.prototype.authenticate = function () {
        this.authClient = new CoinbasePro.AuthenticatedClient(this.key, this.secret, this.passphrase, this.sandboxURI);
    };
    CoinbaseSocketUtil.prototype.startSocket = function (callback) {
        var _this = this;
        this.websocket = new CoinbasePro.WebsocketClient([this.coinTag], this.websocketURL, null, { channels: ['ticker'] });
        this.websocket.on('open', function (response) {
            console.log("web socket OPEN");
        });
        var isFirst = true;
        this.websocket.on('message', function (data) {
            _this.live = true;
            if (isFirst && data.type === 'subscriptions') {
                _this.websocket.unsubscribe({ channels: ['heartbeat'] });
                isFirst = false;
            }
            //here we can track price
            _this.currentPrice = data.price;
            callback(data.price);
            //when price is at our goal, we buy using stop limit order, 
            //we can go further here and trail the low and continue moving the stop down until we reach the lowest point and it starts moving back up at resistance. 
            //if it continues down too far we can either cancell the order since we were wrong. We can gamble and buy the further dip too.
            //after we successfully buy
            //we can then set our stop loss immediately since we are assuming it is not going down any further.
            //we then monitor price and move our stop loss market order further up with price, keeping a margin below the current price. 
            //eventually our stop is hit and we sell w/ market order.
        });
        this.websocket.on('error', function (err) {
            console.log("web socket ERROR");
        });
        this.websocket.on('close', function () {
            console.log("web socket CLOSED");
            _this.live = false;
        });
    };
    CoinbaseSocketUtil.prototype.closeSocket = function () {
        this.websocket.disconnect();
        this.live = false;
    };
    return CoinbaseSocketUtil;
}());
var CoinbaseTradeUtil = /** @class */ (function () {
    function CoinbaseTradeUtil(isReal) {
        this.secret = '0QjU82lNHuemjTqZ0bhZq5AEPn2xldpq0M/v4r8kghjCrYuK+YW8OYv0jXcbTl9NpMBdqxRp/RMOoYFja+G/Sg==';
        this.key = '62e6d2474c821163883ad1eacb331562';
        this.passphrase = '1pse3d2el4q';
        this.sandboxURI = 'https://api-public.sandbox.pro.coinbase.com';
        this.authClient = {};
        if (isReal) {
            this.secret = '4q+/rHwOQ3m5goQl4Ff1duoN5FRClgQxDWSX9QsFJLmzQi7bHgbmxfle/ETTEGmgN8Q3z1+1lIS0RZ4bZ9me0Q==';
            this.key = '77432bff8fc3194764049609ceebe08f';
            this.passphrase = 'rd6dipe7l4j';
            this.sandboxURI = 'https://api.pro.coinbase.com';
        }
    }
    CoinbaseTradeUtil.prototype.authenticate = function () {
        this.authClient = new CoinbasePro.AuthenticatedClient(this.key, this.secret, this.passphrase, this.sandboxURI);
        this.authClient.getCoinbaseAccounts(function (error, response, data) {
            console.log("   Authenticated");
        });
    };
    CoinbaseTradeUtil.prototype.buyLimitOrder = function (purchasePrice, size, product_id) {
        return __awaiter(this, void 0, void 0, function () {
            var buyParams;
            var _this = this;
            return __generator(this, function (_a) {
                buyParams = {
                    price: purchasePrice,
                    size: size,
                    product_id: product_id
                };
                return [2 /*return*/, new Promise(function (resolve, reject) { return _this.authClient.buy(buyParams, function (error, response, data) {
                        if (error) {
                            //failed
                            console.log("Error buying.", error);
                            reject('Failed to place order');
                        }
                        else {
                            //success
                            console.log("Purchase Limit Order Placed Success");
                            resolve(data);
                        }
                    }); })];
            });
        });
    };
    CoinbaseTradeUtil.prototype.sellLimitOrder = function (sellPrice, size, product_id) {
        return __awaiter(this, void 0, void 0, function () {
            var buyParams;
            var _this = this;
            return __generator(this, function (_a) {
                buyParams = {
                    price: sellPrice,
                    size: size,
                    product_id: product_id
                };
                return [2 /*return*/, new Promise(function (resolve, reject) { return _this.authClient.sell(buyParams, function (error, response, data) {
                        if (error) {
                            //failed
                            console.log("Error Selling.", error);
                            reject('Failed to place order');
                        }
                        else {
                            //success
                            console.log("Sell Limit Order Placed Success");
                            resolve(data);
                        }
                    }); })];
            });
        });
    };
    CoinbaseTradeUtil.prototype.getOrder = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.authClient.getOrder(orderId, function (error, response, data) {
                            if (error) {
                                reject('Get Order Failed');
                            }
                            else {
                                resolve(data);
                            }
                        });
                    })];
            });
        });
    };
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
    CoinbaseTradeUtil.prototype.IsOrderFilled = function (orderid) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.getOrder(orderid).then(function (data) {
                            if (data.status === 'done') {
                                resolve({ filled: true, data: data });
                            }
                            else
                                resolve({ filled: false, data: data });
                        })["catch"](function (error) {
                            reject("error checking if order filled");
                        });
                    })];
            });
        });
    };
    CoinbaseTradeUtil.prototype.cancelOrderById = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.authClient.cancelOrder(orderId, function (error, response, data) {
                            if (error) {
                                reject(error);
                            }
                            else {
                                resolve('Order Cancelled ');
                            }
                        });
                    })];
            });
        });
    };
    return CoinbaseTradeUtil;
}());
var mockCBSocketUtil = /** @class */ (function () {
    function mockCBSocketUtil() {
        this.currentPrice = 0;
        this.maxPrice = 0;
    }
    mockCBSocketUtil.prototype.startTrackingMaxPrice = function (currentMaxPrice) {
        console.log("Mock start tracking max price");
    };
    mockCBSocketUtil.prototype.stopTrackingMaxPrice = function () {
        console.log("Mock end tracking max price");
        return 1;
    };
    mockCBSocketUtil.prototype.authenticate = function () {
        console.log("Mock Authenticated.");
    };
    mockCBSocketUtil.prototype.startSocket = function (callback) {
        console.log("Mock start Socket");
    };
    mockCBSocketUtil.prototype.closeSocket = function () {
        console.log("Mock close Socket");
    };
    return mockCBSocketUtil;
}());
var mockCBTradeUtil = /** @class */ (function () {
    function mockCBTradeUtil(client) {
        this.authClient = client;
    }
    mockCBTradeUtil.prototype.authenticate = function () {
        console.log("Mock Authenticate Trade Util");
    };
    mockCBTradeUtil.prototype.buyLimitOrder = function (purchasePrice, size, product_id) {
        return Promise.resolve(this.authClient.buyLimitOrder(Number.parseFloat(purchasePrice), Number.parseFloat(size)));
    };
    mockCBTradeUtil.prototype.sellLimitOrder = function (sellPrice, size, product_id) {
        return Promise.resolve(this.authClient.sellLimitOrder(Number.parseFloat(sellPrice), Number.parseFloat(size)));
    };
    mockCBTradeUtil.prototype.getOrder = function (orderId) {
        return Promise.resolve(this.authClient.getOrder(orderId));
    };
    mockCBTradeUtil.prototype.IsOrderFilled = function (orderid) {
        var order = this.authClient.getOrder(orderid);
        if (order.status == 'done')
            return Promise.resolve({ filled: true, data: order });
        else
            return Promise.resolve({ filled: false, data: order });
    };
    mockCBTradeUtil.prototype.cancelOrderById = function (orderId) {
        return Promise.resolve(this.authClient.cancelOrder(orderId));
    };
    return mockCBTradeUtil;
}());
var mockCoinbaseClient = /** @class */ (function () {
    function mockCoinbaseClient(mockSocketUtil) {
        var _this = this;
        this.orders = new Map();
        this.orderCount = 0;
        this.numberOfChecks = 0;
        this.currentCandleIndex = 0;
        //cancelOrder
        this.cancelOrder = function (orderId) {
            return _this.orders["delete"](orderId);
        };
        //getOrder
        this.getOrder = function (orderId) {
            _this.updateCandelIndexIfNeeded(); //update candal after every 20 requests. Minimum should be 2 but playing it safe and going with 20.
            _this.updateOrders();
            _this.updateSocketPrice();
            return _this.orders.get(orderId);
        };
        //sellLimit
        this.sellLimitOrder = function (price, size) {
            _this.orderCount++;
            var id = "sell" + (_this.orderCount.toString());
            _this.orders.set(id, {
                id: id,
                price: price,
                size: size,
                side: 'sell',
                status: 'open',
                executed_value: 0,
                filled_size: 0,
                fill_fees: 0,
                created_at: id
            });
            return _this.orders.get(id);
        };
        //buyLimit
        this.buyLimitOrder = function (price, size) {
            _this.orderCount++;
            var id = "buy" + (_this.orderCount.toString());
            _this.orders.set(id, {
                id: id,
                price: price,
                size: size,
                side: 'buy',
                status: "open",
                executed_value: 0,
                filled_size: 0,
                fill_fees: 0,
                created_at: id
            });
            return _this.orders.get(id);
        };
        //loadOrders
        this.loadCandles = function (productId, days) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var start, end, delta, i, done, startDate, startTime, endTime, array;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    start = 0;
                                    end = 0;
                                    delta = 300 * 60 * 1000 // number of miliseconds range allowed in a request
                                    ;
                                    i = 0;
                                    done = false;
                                    startDate = new Date();
                                    startDate.setDate(startDate.getDate() - days);
                                    startTime = startDate.getTime();
                                    endTime = Date.now();
                                    array = [];
                                    _a.label = 1;
                                case 1:
                                    if (!!done) return [3 /*break*/, 6];
                                    end = endTime - i * delta;
                                    start = end - delta;
                                    i++;
                                    console.log(new Date(start).toUTCString());
                                    console.log(new Date(end).toUTCString());
                                    console.log("----------");
                                    if (!(start > startTime)) return [3 /*break*/, 4];
                                    return [4 /*yield*/, sdk['ExchangeRESTAPI_GetProductCandles']({
                                            product_id: productId,
                                            granularity: 60,
                                            start: new Date(start).toUTCString(),
                                            end: new Date(end).toUTCString() // comes after start
                                        })
                                            .then(function (res) {
                                            array = array.concat(res);
                                        })["catch"](function (err) { return console.error(err); })];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, this.delay(1000)];
                                case 3:
                                    _a.sent();
                                    return [3 /*break*/, 5];
                                case 4:
                                    done = true;
                                    _a.label = 5;
                                case 5: return [3 /*break*/, 1];
                                case 6:
                                    //filter repeated values
                                    array = array.filter(function (element, index) {
                                        for (var i_1 = 0; i_1 < array.length; i_1++) {
                                            if (element[0] === array[i_1][0] && i_1 != index)
                                                return false;
                                        }
                                        return true;
                                    });
                                    //sort from lowest timestap to highest
                                    array = array.sort(function (a, b) {
                                        return a[0] - b[0];
                                    });
                                    this.candles = array;
                                    resolve(array);
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        }); };
        this.socketObject = mockSocketUtil;
    }
    //BACKEND Functions
    mockCoinbaseClient.prototype.delay = function (ms) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
            });
        });
    };
    //start async
    mockCoinbaseClient.prototype.updateCandelIndexIfNeeded = function () {
        this.numberOfChecks++;
        if (this.numberOfChecks == 20) {
            this.numberOfChecks = 0;
            this.currentCandleIndex++;
        }
    };
    mockCoinbaseClient.prototype.updateOrders = function () {
        var currentCandle = this.candles[this.currentCandleIndex];
        var low = currentCandle[1];
        var high = currentCandle[2];
        var dateObj = null;
        this.orders.forEach(function (value, key, map) {
            if (value.status == 'open' && value.price <= high && value.price >= low) {
                value.status = 'done';
                value.executed_value = value.price * value.size;
                value.filled_size = value.size;
                value.fill_fees = value.executed_value * 0.001; // our target fee range
                dateObj = timLib.convertToLocalTime(currentCandle[0] * 1000, false);
                value.created_at = dateObj.monthName + " " + dateObj.day + " " + dateObj.year + " " + dateObj.formattedTime;
            }
        });
    };
    mockCoinbaseClient.prototype.updateSocketPrice = function () {
        var currentCandle = this.candles[this.currentCandleIndex];
        var low = currentCandle[1];
        var high = currentCandle[2];
        this.socketObject.currentPrice = low; //Asumption. Using this as worse case scenario. (triggers stop loss, doesn't trigger profitable sells)
    };
    mockCoinbaseClient.prototype.setStartingCadelIndex = function (dateTime) {
        var _this = this;
        var time = Math.round(Date.parse(dateTime) / 1000); //'01 Jan 2021 00:00:00 GMT-0600'
        this.candles.find(function (candle, index) {
            if (Math.abs(candle[0] - time) < 60) { //if candle timestamp within 60 seconds
                _this.currentCandleIndex = index;
                return true;
            }
            else
                return false;
        });
    };
    return mockCoinbaseClient;
}());
module.exports = { CoinbaseSocketUtil: CoinbaseSocketUtil, CoinbaseTradeUtil: CoinbaseTradeUtil, CoinTag: CoinTag, mockCoinbaseClient: mockCoinbaseClient, mockCBSocketUtil: mockCBSocketUtil, mockCBTradeUtil: mockCBTradeUtil };
