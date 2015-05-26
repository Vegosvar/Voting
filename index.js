var fs = require('fs')
var cookie = require('cookie')
var express = require('express')
var app = express()
var http = require('http')
var server = http.createServer(app)
var moment = require('moment')
var cors = require('cors')
var io = require('socket.io')(server)
var config = require('./config')

var setup_votes = function () {
  Object.keys(config.sites).forEach(function (site) {
    if (!votes[site]) {
      votes[site] = {
        total: 0,
        choices: {}
      }

      config.sites[site].forEach(function (choice) {
        votes[site].choices[choice] = 0
      })
    }
  })
}

try {
  var votes = require('./votes.json')

  setup_votes()
} catch (error) {
  var votes = {}

  setup_votes()
}

var setup_recent_votes = function () {
  Object.keys(config.sites).forEach(function (site) {
    if (!recent_votes[site]) {
      recent_votes[site] = []
    }
  })
}

try {
  var recent_votes = require('./recent_votes.json')

  setup_recent_votes()
} catch (error) {
  var recent_votes = {}

  setup_recent_votes()
}

try {
  var detailed_votes = require('./detailed_votes.json')
} catch (e) {
  var detailed_votes = []
}

var recent_ips = {}

Object.keys(config.sites).forEach(function (site) {
  recent_ips[site] = {}
})

io.on('connection', function (socket) {
  var client = {
    voted: false,
    ip: socket.handshake.headers['x-forwarded-for'] || socket.handshake.address,
    cookies: socket.handshake.headers.cookie ? cookie.parse(socket.handshake.headers.cookie) : {}
  }

  var has_voted = function () {
    if ((client.cookies && (client.cookies.hasVoted == true || (recent_votes[client.id] && recent_votes[client.id].indexOf(client.cookies._ga) > -1))) || recent_ips[client.id][client.ip] != null) {
      client.voted = true
    }
  }

  socket.on('initial', function (data) {
    if (!config.sites[data.id]) {
      return
    }

    client.id = data.id

    has_voted()

    socket.emit('initial', { voted: client.voted })
    socket.emit('votes', votes)
  })
  
  socket.on('vote', function (data) {
    if (!client.id) {
      return
    }

    has_voted()

    if (client.voted) {
      return socket.emit('voteresult', { error: 'You have already voted' })
    }

    if (data == null || data.vote == null || config.sites[client.id].indexOf(data.vote) === -1)  {
      return socket.emit('voteresult', { error: 'Invalid vote!' })
    }

    recent_ips[client.id][client.ip] = { ts: new Date(), vote: data.vote }
    
    if (client.cookies._ga != null) {
      recent_votes[client.id].push(client.cookies._ga)
    }

    detailed_votes.push({ id: client.id, ts: new Date(), ip: client.ip, vote: data.vote, ga: client.cookies._ga })

    votes[client.id].choices[data.vote]++
    votes[client.id].total++

    socket.emit('votes', votes)
    socket.emit('voteresult', { error: false })
  })
})

setInterval(function () {
  io.emit('votes', votes)
  
  Object.keys(recent_ips).forEach(function (site) {
    var voters = recent_ips[site]

    Object.keys(voters).forEach(function (voter) {
      var item = voters[voter]

      if (moment(new Date()).diff(item.ts, 'seconds') > 120) {
        delete recent_ips[site][voter]
      }
    })
  })

  fs.writeFile('./votes.json', JSON.stringify(votes), 'utf8', function (err) {})
  fs.writeFile('./detailed_votes.json', JSON.stringify(detailed_votes), 'utf8', function (err) {})
  fs.writeFile('./recent_votes.json', JSON.stringify(recent_votes), 'utf8', function (err) {})
}, 5000)

app.use(cors())

app.use(express.static('public'))

app.get('/', function (req, res, next) {
  res.jsonp(votes)
})

app.get('*', function (req, res, next) {
  res.status(404)
  res.send({ error: 'Resource not found' })
})

server.listen(config.server.port, config.server.host)