var fs = require('fs')
var cookie = require('cookie')
var express = require('express')
var app = express()
var http = require('http')
var server = http.createServer(app)
var moment = require('moment')
var io = require('socket.io')(server)
try {
  var votes = require('./votes.json')
} catch (e) {
  var votes = { yes: 0, no: 0, maybe: 0 }
}

try {
  var detailedVotes = require('./detailedVotes.json')
} catch (e) {
  var detailedVotes = []
}

try {
  var recentVoters = require('./recentVoters.json')
} catch (e) {
  var recentVoters = []
}

var recentVoterIPs = {}

app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

io.on('connection', function (socket) {
  var clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address
  var cookies = socket.handshake.headers.cookie ? cookie.parse(socket.handshake.headers.cookie) : null
  socket.emit('votes', votes)
  var voted = false;
  if (cookies != null) {
    console.log('RecentVoters: %s', recentVoters.indexOf(cookies._ga) > 1)
    console.log('RecentVoterIPs: %s', recentVoterIPs[clientIp] != null)
    voted = (recentVoters.indexOf(cookies._ga) > -1 || recentVoterIPs[clientIp] != null) 
  }
  console.log('clientIP: %s', clientIp);
  console.log('Voted: %s', voted);
  console.log('Cookies:')
  console.log(cookies);
  socket.emit('initial', { voted: voted })
  socket.on('vote', function (data) {
    if (cookies == null || cookies._ga == null || recentVoters.indexOf(cookies._ga) > -1 || recentVoterIPs[clientIp] != null || data == null || data.vote == null || (data.vote != 'yes' && data.vote != 'no' && data.vote != 'maybe')) {
      return socket.emit('voteresult', { error: 'You have already voted' })
    }
    recentVoterIPs[clientIp] = { ts: new Date(), vote: data.vote }
    recentVoters.push(cookies._ga);
    detailedVotes.push({ ts: new Date(), ip: clientIp, vote: data.vote, ga: cookies._ga })
    votes[data.vote]++
    socket.emit('votes', votes)
    socket.emit('voteresult', { error: false})
  })
})

setInterval(function () {
  io.emit('votes', votes)
  Object.keys(recentVoterIPs).forEach(function (voter) {
    var item = recentVoterIPs[voter]
    if (moment(new Date()).diff(item.ts, 'seconds') > 30) {
      delete recentVoterIPs[voter]
    }
  })
  fs.writeFile('./votes.json', JSON.stringify(votes), 'utf8', function (err) {});
  fs.writeFile('./detailedVotes.json', JSON.stringify(detailedVotes), 'utf8', function (err) {});
  fs.writeFile('./recentVoters.json', JSON.stringify(recentVoters), 'utf8', function (err) {});
}, 5000, 5000)

app.get('/', function (req, res, next) {
  res.jsonp(votes)
})

app.get('*', function (req, res, next) {
  res.status(404)
  res.send({ error: 'Resource not found' })
})

server.listen(process.env.PORT || 7000, 'localhost');