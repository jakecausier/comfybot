const { Client, Intents, MessageEmbed } = require('discord.js')
const express = require('express')
const parser = require('body-parser')
const axios = require('axios')
const config = require('./config.json')

const app = express()
app.use(parser.json())

const client = new Client({
  allowedMentions: {
    parse: [
      'everyone'
    ],
    replied_user: true
  },
  intents: [
    Intents.FLAGS.GUILD_MESSAGES
  ]
})
const defaultProvider = {
  name: 'ComfyTheatre',
  url: 'https://comfytheatre.co.uk/'
}
const defaultColor = Discord.Util.resolveColor([241, 51, 51])

// Define API key middleware
app.use((req, res, next) => {
  if (req.path === '/') {
    res.redirect('https://comfytheatre.co.uk/');
  }
  if (config.token !== null && config.token !== '' && req.header('X-Auth-Token') === config.token) {
    next()
  }
  res.status(401).json('Missing "X-Auth-Token" header').end()
})

// Listen to endpoint to announce on Discord
app.post("/announce", (req, res) => {
  const channel = client.channels.cache.get(config.discord.announcement_channel_id) || null
  const title = req.body.title || null
  const message = req.body.message || null
  const shouldAnnounce = req.body.announce || false
  const targetAnnounce = req.body.target || 'here'
  const url = req.body.url || null
  const img = req.body.image || null

  if (channel && message) {
    channel.send({
      content: `${message}${shouldAnnounce ? ` @${targetAnnounce}` : ''}`,
      embeds: [
        new MessageEmbed({
          url,
          title,
          description: message,
          image: img ? {
            url: img
          } : null,
          provider: defaultProvider,
          color: defaultColor,
          footer: {
            text: title
          }
        })
      ]
    })
    console.log('Sent announcement to Discord!')
  }

  res.status(200).json({ status: 'OK' }).end()
})

// Trigger command on message
client.on('message', (message) => {

  // Ignore other bots
  if (message.author.bot) {
    return
  }

  const prefix = config?.discord?.prefix || '='

  // Ensure the bot only replies when the input command is used
  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(1).split(' ')
    const action = args[0]
    const author = message.member
    const reply = {
      messageReference: message.id
    }

    // Help reply
    if (action === 'help') {
      const commands = [
        `**${prefix}help** - Shows this help message`,
        // `**${prefix}votes** - Show the current film votes`,
        `**${prefix}roll #number** - Roll a random number between 1 and #number`
      ]
      return message.channel.send({
        content: `Hi ${author}, I'm Comfy-tan! Here are the commands you can use when mentioning me:${commands.map(val => `\n${val}`).join()}`,
        reply
      })
    }

    // Film votes reply
    // if (action === 'votes') {
    //   axios.get(`${process.env.COMFYTHEATRE_API_URL}/votes`)
    //     .then(({ data }) => {
    //       if (data.success) {
    //         message.channel.send(`Here are the current film votes for you, ${author}...`, {
    //           embed: new MessageEmbed({
    //             title: 'Film Votes',
    //             description: `Currently winning: **${data.data[0].title}** with ${data.data[0].votes} votes`,
    //             thumbnail: {
    //               url: data.data[0].poster
    //             },
    //             provider: defaultProvider,
    //             color: defaultColor,
    //             fields: data.data.map((item) => {
    //               return {
    //                 name: item.title,
    //                 value: `${item.votes} votes`,
    //               }
    //             })
    //           })
    //         })
    //       } else {
    //         message.reply('No votes have been submitted yet, or film voting is closed. Come back later!')
    //       }
    //     }).catch((err) => {
    //       message.reply("I can't get that information at the moment. Go shout at Mic.")
    //     })
    //   return
    // }

    // Dice roll
    if (action === 'roll') {
      let value = args[1] || null
      const min = 2
      const max = 10000

      if (!value || Number.isNaN(value)) {
        return message.channel.send({
          content: `Please enter a valid number as the first parameter (ie. **${prefix}roll 6**)`,
          reply
        })
      }

      value = Math.max(Number.parseInt(value))
      if (value < min || value > max) {
        return message.channel.send({
          content: `I can't roll ${value}! Must be between ${min} and ${max}.`,
          reply
        })
      }

      const result = Math.floor(Math.random() * value)
      return message.channel.send({
        content: `${author} rolled **${result}**`,
        reply
      })
    }
  }
})

client.login(config.discord.token)
app.listen(config.port || 3000, () => {
  console.log(`Express server running on port ${config.port || 3000}`)
})
