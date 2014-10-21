var votes = require('./detailedVotes.json')

var ipCount = {}
var gaCount = {}
var combinedGaAndIPCount = {}

// Todo, compare subnets?

votes.forEach(function (vote) {
  if (ipCount[vote.ip] == null) {
    ipCount[vote.ip] = 1
  } else {
    ipCount[vote.ip]++
  }
  if (gaCount[vote.ga] == null) {
    gaCount[vote.ga] = 1
  } else {
    gaCount[vote.ga]++
  }
})

var ipCountList = []
var gaCountList = []

Object.keys(ipCount).forEach(function (ip) {
  if (ipCount[ip] > 1) {
    ipCountList.push({ ip: ip, count: ipCount[ip] })
  }
})

Object.keys(gaCount).forEach(function (ga) {
  if (gaCount[ga] > 1) {
    gaCountList.push({ ga: ga, count: gaCount[ga] })
  }
})


ipCountList.sort(function compare(a, b) {
  return a.count > b.count
})
gaCountList.sort(function compare(a, b) {
  return a.count > b.count
})

console.log('ipCount')
console.log(ipCountList)
console.log('gaCount')
console.log(gaCountList)