/*
This script is use to explore the local network of the user
Maybe it will find other Blanche Neige instance...
*/

let net = require('net');
const { networkInterfaces } = require('os');

// Server side, only need to listen on the local network

let server = net.createServer((socket) => {
    console.log('~ New client on the network '+socket.remoteAddress);
	socket.write('Welcome to the Blanche Neige server !');
	socket.pipe(socket);
});



//Client side

// Need the network ip range

const nets = networkInterfaces();
const ipv4_data = []

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
            ipv4_data.push({
                name: name,
                address: net.address,
                mask: net.cidr.split('/')[1],
                class: detectLocalIpClass(net.address)
            })
        }
    }
}
showAllNetworkInt()


let ipData = calcIpRange(ipv4_data[0].address, ipv4_data[0].mask)
let ipRange = genAllIpToCheck(ipData, ipv4_data[0].address)

//HERE WE GOOOOO NEED TO SCANN ALL THE IP :p
console.log(`~ Scanning ${ipRange.length} IP`)

let clientOnlineList = []

for(let i = 0; i < ipRange.length; i++){
    //try to connect to the ip
    let client = new net.Socket();
    client.connect(12645, ipRange[i], () => {
        console.log("+ "+ipRange[i] +" is responding")
        let checkAll = clientOnlineList.find(x => x.ip == ipRange[i])
        if(!checkAll){
            clientOnlineList.push({
                ip: ipRange[i],
                socket: client
            })
        }
    });
    client.on('close', () => {
        client.destroy();
    });
    client.on('error', (err) => {
        client.destroy();
    });
}

upServer()


// ALL the function stuff. Not really funny.
const showAllNetworkInt = () => {
    console.log(`~ Find ${ipv4_data.length} network interface`)
    for(let i=0; i<ipv4_data.length; i++){
        console.log("- "+ipv4_data[i].name + " : " + ipv4_data[i].address + " / " + ipv4_data[i].mask + " (" + ipv4_data[i].class + ")");
    }
    console.log("")
}

const detectLocalIpClass = (ip) => {
    if(ip.startsWith("10.")){
        return "A"
    } else if(ip.startsWith("172.")){
        return "B"
    } else if(ip.startsWith("192.168.")){
        return "C"
    } else if(getFirstIpOfip(ip) >= 224 && getFirstIpOfip(ip) <= 239){
        return "D"
    } else {
        return "E"
    }
}

const calcIpRange = (ip, mask) => {
    let ip_range = []
    let ip_range_start = ip.split(".")
    let ip_range_end = ip.split(".")
    let cut = whereToCut(mask)
    for(let i=0; i<cut; i++){
        ip_range_start[3-i] = 0
        ip_range_end[3-i] = 255
    }
    ip_range.push(ip_range_start.join("."))
    ip_range.push(ip_range_end.join("."))
    ip_range.push(cut)
    return ip_range
}

const whereToCut = (mask) => {
    let res = (32 - mask)/8
    //check si pas de virgule
    if(res.toString().includes(".")){
        console.log('[ERROR] - Network mask is not valid / not supported by the script')
    }
    return res
}

const genAllIpToCheck = (ip_range, my_ip) => {
    let res = []
    let ip_range_start = setAllNum(ip_range[0].split("."))
    let cut = ip_range[2]

    //calcul all ip between range start and range end
    res.push(ip_range_start.slice(0, 4-cut).join('.'))
    for(let i=3; i>=cut; i--){
        for(let j=0; j<res.length; j++){
            let tmp = getAllTheRange(ip_range_start[i])
            for(let k=0; k<tmp.length; k++){
                if((res[j]+"."+tmp[k]).split('.').length>4){
                    break
                } 
                if((res[j]+"."+tmp[k]) != my_ip){
                    if(!res.includes(res[j]+"."+tmp[k])){
                        res.push(res[j]+"."+tmp[k])
                    }
                }
            }
        }
    }
    
    //remove all not ipv4 address
    res = res.filter(x => x.split(".").length == 4)
    
    return res
}

const getAllTheRange = (deb) => {
    let res = []
    for(let i=deb; i<256; i++){
        res.push(i)
    }
    return res
}

const setAllNum = (array) => {
    for(let i=0; i<array.length; i++){
        array[i] = Number(array[i])
    }
    return array
}

const getFirstIpOfip = (ip) => {
    return Number(ip.split(".")[0])
}

// ALL listeners stuff

const clientStuff = () => {
    console.log(`~ Total online client: ${clientOnlineList.length}`)

    //DO SOMETHING WITH THE CLIENT
}

const upServer = () => {
    setTimeout(() => {
        clientStuff()
    } , 5000);
    console.log("~ Up the server")
    server.listen(12645);
}