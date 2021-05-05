require('dotenv').config()

const Discord = require('discord.js')
const express = require('express')
const parser = require('body-parser')
const axios = require('axios')
const _ = require('lodash')
const config = require('./config.json')


const app = express()
app.use(parser.json())

const client = new Discord.Client({
  disableEveryone: false,
})
const defaultProvider = {
  name: 'ComfyTheatre',
  url: 'https://comfytheatre.co.uk/'
}
const defaultColor = Discord.Util.resolveColor([241, 51, 51])

// Listen for webhook to endpoints
app.post("/announce", (req, res) => {
  const channel = client.channels.cache.get(config.discord.announcement_channel_id)

  if (channel) {
    channel.send(`${req.body.type}: ${req.body.name} starting now! ${req.body.stream ? req.body.stream : null} @${req.body.target ? req.body.target : 'here'}`, {
      embed: new Discord.MessageEmbed({
        title: req.body.name,
        description: req.body.description,
        image: req.body.poster ? { url: req.body.poster } : null,
        provider: defaultProvider,
        color: defaultColor,
        url: req.body.stream,
        footer: {
          text: req.body.stream
        }
      })
    })
  }

  res.status(200).end()
})

// Trigger command on message
client.on('message', (message) => {

  // Ignore other bots
  if (message.author.bot) {
    return
  }

  // Ensure the bot only replies when the input command is used
  if (message.content.startsWith(config.prefix)) {
    const args = message.content.slice(1).split(' ')
    const action = args[0]
    const author = message.member

    // Help reply
    if (action === 'help') {
      const commands = [
        `**${config.prefix}help** - Shows this help message`,
        `**${config.prefix}votes** - Show the current film votes`,
        `**${config.prefix}roll #number** - Roll a random number between 1 and #number`
      ]
      return message.channel.send(`Hi ${author}, I'm Comfy-tan! Here are the commands you can use when mentioning me:${commands.map(val => `\n${val}`).join()}`)
    }

    // Film votes reply
    if (action === 'votes') {
      axios.get(`${process.env.COMFYTHEATRE_API_URL}/votes`)
        .then(({ data }) => {
          if (data.success) {
            message.channel.send(`Here are the current film votes for you, ${author}...`, {
              embed: new Discord.MessageEmbed({
                title: 'Film Votes',
                description: `Currently winning: **${data.data[0].title}** with ${data.data[0].votes} votes`,
                thumbnail: {
                  url: data.data[0].poster
                },
                provider: defaultProvider,
                color: defaultColor,
                fields: data.data.map((item) => {
                  return {
                    name: item.title,
                    value: `${item.votes} votes`,
                  }
                })
              })
            })
          } else {
            message.reply('No votes have been submitted yet, or film voting is closed. Come back later!')
          }
        }).catch((err) => {
          message.reply("I can't get that information at the moment. Go shout at Mic.")
        })
      return
    }

    // Dice roll
    if (action === 'roll') {
      let value = args[1]
      const min = 2
      const max = 10000
      const specialRolls = config.commands.roll.specialRolls

      if (!value || Number.isNaN(value)) {
        return message.channel.send(`Please enter a valid number as the first parameter (ie. **${config.prefix}roll 6**)`)
      }

      value = Math.max(Number.parseInt(value))
      if (value < min || value > max) {
        return message.channel.send(`I can't roll ${value}! Must be between ${min} and ${max}.`)
      }

      const result = 666 // Math.floor(Math.random() * value)
      message.channel.send(`I am currently rigged...`)

      if (specialRolls && specialRolls.length > 0) {
        const valueMatch = _.find(specialRolls, { number: result })
        if (typeof valueMatch !== 'undefined') {
          // author.roles.add([valueMatch.grantRole])
          //   .catch((err) => {
          //     return message.channel.send(`Could not automatically add role. Go shout at Mic.`)
          //   })
          return message.channel.send(`${author} rolled **${result}**!!!`)
        }
      }
      return message.channel.send(`${author} rolled **${result}**`)
    }
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)
app.listen(process.env.EXPRESS_PORT, () => {
  console.log(`Express server running on port ${process.env.EXPRESS_PORT}`)
})