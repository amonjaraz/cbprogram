
const CBUtil = require('./logic')
const A = async () =>{
    return new Promise((resolve, reject)=>{
        setTimeout(() => {
            console.log("A")
            resolve(true)
        }, 4000);
    })

}

const B = async () =>{
    return new Promise((resolve, reject)=>{
        setTimeout(() => {
            console.log("B")
            resolve(true)
        }, 3000);
    })

}

const main = async ()=>{

    // if (await A() || await B() ){
    //     console.log("IF")
    // }

    // let array = [{a: 1}, {a: 2}]
    // for(let i=0; i<array.length; i++){
    //     if(i==0) {
    //         array[i+1].a = 3
    //     }
    //     console.log(array[i])
    // }
    // const sizeTotal = .513456
    // const sevfiveSize = (sizeTotal*.75).toFixed(3)
    // const twnfiveSize = (sizeTotal*.25).toFixed(3)
    // console.log(2.545.toFixed(2))
    // console.log(Math.floor(2.545*10**2)/10**2)
    // console.log(sevfiveSize, twnfiveSize, Number.parseFloat(sevfiveSize) + Number.parseFloat(twnfiveSize))
    // const arr = [1,2,3]
    // console.log("mmin",Math.min(...arr))
    //const mockClient = new CBUtil.mockCoinbaseClient()
    //mockClient.loadOrderFromFile("ADA-USD", 1)
    const time = Date.parse('01 Jan 2021 00:00:00 GMT-0600') //day month year hour:seconds:milliseconds GMT-0600 (houston time)
    console.log(time)
}
main()