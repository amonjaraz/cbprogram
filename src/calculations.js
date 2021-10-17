const calculateSize = ( riskAmount, stopAmount)=>{
    const shares =  (riskAmount/stopAmount).toFixed(8)
    return shares
}

const calculateStopPrice = (purchasePrice, stopAmount) =>{
    return purchasePrice - stopAmount;
}

const calculateMinProfitPrice = (purchasePrice)=>{
    const feePercentage = .01 // 0.5% buy + 0.5% sell =  1%
    return (1+feePercentage)*purchasePrice;
}

const calculateMinGainRatio = (purchasePrice, stopAmount)=>{
    const gainAmount = calculateMinProfitPrice(purchasePrice) - purchasePrice;
    return gainAmount/stopAmount;
}

//assuming 2 is our minimum gain ratio
const calculateMinStopAmount = (purchasePrice) =>{
    const gainAmount = calculateMinProfitPrice(purchasePrice) - purchasePrice;
    return gainAmount/2
}

const calculateGrossProfitPercentage = (purchasePrice, sellPrice) =>{
    return ((sellPrice-purchasePrice)/purchasePrice)*100
}

const calculateGainRatio = (purchasePrice, stopAmount, sellPrice) =>{
    const gainAmount = sellPrice - purchasePrice;
    return gainAmount/stopAmount
}

const calculateInvestmentAmount = (purchasePrice, riskAmount, stopAmount)=>{
    const buyFeePercentage = 0.005
    return (purchasePrice*calculateSize(riskAmount, stopAmount)*(1+buyFeePercentage))
}

const calculateGrossProfitAmount = (size, purchasePrice, sellPrice ) =>{
    return (sellPrice-purchasePrice)*size;
}

module.exports = {
    calculateSize,
    calculateGainRatio,
    calculateGrossProfitPercentage,
    calculateMinGainRatio,
    calculateMinProfitPrice,
    calculateStopPrice,
    calculateInvestmentAmount,calculateMinStopAmount,
    calculateGrossProfitAmount
}