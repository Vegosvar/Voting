var votes = require('./detailedVotes.json')

var ipCount = {}
var gaCount = {}
var combinedGaAndIPCount = {}

var yesCount = 0
var noCount = 0
var maybeCount = 0
var totalCount = 0

// Todo, compare subnets?

votes.forEach(function (vote) {
  if (ipCount[vote.ip] == null) {
    ipCount[vote.ip] = { count: 1, votes: [vote.vote] }
  } else {
    ipCount[vote.ip].count++
    ipCount[vote.ip].votes.push(vote.vote)
    if (vote.vote == 'yes') {
      yesCount++
    } else if (vote.vote == 'maybe') {
      maybeCount++
    } else if (vote.vote == 'no') {
      noCount++
    }
    totalCount++
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
  if (ipCount[ip].count > 1) {
    ipCountList.push({ ip: ip, count: ipCount[ip].count, votes: ipCount[ip].votes })
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
console.log('noCount: %s', noCount)
console.log('yesCount: %s', yesCount)
console.log('maybeCount: %s', maybeCount)
console.log('totalCount: %s', totalCount)
console.log('gaCount')
console.log(gaCountList)