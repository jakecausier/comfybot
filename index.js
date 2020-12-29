require('dotenv').config()

const Discord = require('discord.js')
const axios = require('axios')

const client = new Discord.Client()
const defaultProvider = {
  name: 'ComfyTheatre',
  url: 'https://comfytheatre.co.uk/'
}
const defaultColor = Discord.Util.resolveColor([241, 51, 51])

// Trigger command on message
client.on('message', (message) => {
  // Ignore other bots
  if (message.author.bot) {
    return
  }
  // Ensure the bot only replies when mentioned
  if (message.mentions.has(client.user, { ignoreRoles: true, ignoreEveryone: true })) {
    const args = message.content.split(' ')
    const author = message.author

    // Help reply
    if (args.includes('help')) {
      const commands = [
        `**help** - Shows this help message`,
        `**votes** - Show the current film votes`
      ]
      message.channel.send({
        content: `Hi <@${author.id}>, I'm Comfy-tan! Here are the commands you can use when mentioning me:${commands.map(val => `\n${val}`).join()}`,
      })
    }

    // Film votes reply
    if (args.includes('votes')) {
      axios.get(`${process.env.COMFYTHEATRE_API_URL}/votes`)
        .then(({ data }) => {
          if (data.success) {
            message.reply('Here are the current film votes...', {
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
            message.reply('No votes have been submitted yet. Come back later!')
          }
        }).catch((err) => {
          message.reply("I can't get that information at the moment. Go shout at Mic.")
        })
    }
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)