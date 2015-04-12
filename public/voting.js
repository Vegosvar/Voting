var Voting = {
  config: {},

  init: function (config) {
    Voting.config = config

    Voting.register_listeners()

    Voting.socket = io.connect(Voting.config.url)

    Voting.socket.on('connect', function () {
      Voting.socket.emit('initial', { id: Voting.config.id })
    })

    Voting.socket.on('initial', function (data) {
      if (data.voted) {
        Voting.display_success()
      }
    })

    Voting.socket.on('votes', function (data) {
      Voting.display_results(data[config.id])
    })

    Voting.socket.on('voteresult', function (data) {
      $.cookie('hasVoted', true)

      if (data.error) {
        Voting.display_error()
      } else {
        Voting.display_success()
      }
    })
  },

  register_listeners: function () {
    Object.keys(Voting.config.choices).forEach(function (choice) {
      $(Voting.config.choices[choice].button).click(function () {
        Voting.socket.emit('vote', { vote: choice })
      })
    })
  },

  display_success: function () {
    $(Voting.config.elements.success).html(Voting.config.messages.success)
  },

  display_error: function () {
    $(Voting.config.elements.error).html(Voting.config.messages.error)
  },

  display_results: function (data) {
    $(Voting.config.elements.total_votes).html(Voting.config.messages.total_votes.replace('{{VOTES}}', data.total))

    Object.keys(data.choices).forEach(function (choice) {
      var percentage = Math.floor(data.choices[choice] / data.total * 100) || 0

      $(Voting.config.choices[choice].result).css('height', percentage + '%')
      $(Voting.config.choices[choice].result_percentage).text(percentage + '%')
    })
  }
}