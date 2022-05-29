require('dotenv').config()
const { Telegraf } = require('telegraf')
const axios = require('axios')
const express = require('express')
const app = express()

app.listen(process.env.PORT, () => {
    console.log(`Bot listening on port ${process.env.PORT}`)
  })

const bot = new Telegraf(process.env.TOKEN)

async function find_user_id(name){
    res = await axios.get(`https://api.sleeper.app/v1/user/${name}`)
    return res
}

async function find_leagues(result){
    res = await axios.get(`https://api.sleeper.app/v1/user/${result.data['user_id']}/leagues/nfl/2021`)
    
    let leagues = [] 
    for (let i of res.data) {
        leagues.push([i['league_id'],i['name']])
    }

    return leagues
}

function show_player_info(data){
    const infos = ['full_name','weight','height','birth_date','team','position','injury_status','college','number']
    let info_str = ''
    
    for(let info of infos){
        info_str += `${info}: ${data[info]}\n`
    }
    return info_str

}

async function find_player_info(id){
    res = await axios.get('https://api.sleeper.app/v1/players/nfl')
    return show_player_info(res.data[id])
}

async function find_player_id(player_name){
    res = await axios.get('https://api.sleeper.app/v1/players/nfl')

    for (let i of Object.keys(res.data)) {
        if(res.data[i]['full_name'] == player_name){
            return i
        }
    }
}

bot.start((ctx) => ctx.reply(`Bem-vindo ${ctx.from.first_name}, Utilizando o comando /find você poderá encontrar os dados do jogador desejado`)
            .then(res =>console.log(ctx.from)
            ))


bot.help((ctx) => ctx.reply('Os comandos disponíveis são:\n/find para encontrar um jogador\n'))

bot.command('find', (ctx) =>  ctx.reply('Escolha o nome do jogador')
        .then(bot.on('text',async function(ctx) {
            ctx.reply(`Buscando por ${ctx.message['text']}...`)
            find_player_id(ctx.message['text'])
                .then((id) => find_player_info(id))
                .then((res) => ctx.reply(res))
            }
        ))
    )

bot.command('leagues', (ctx) => ctx.reply('Digite seu nome de usuário')
        .then(bot.on('text', async function (ctx){
            ctx.reply(`Buscando pelas ligas de ${ctx.message['text']}`)
            find_user_id(ctx.message['text'])
                .then(res => find_leagues(res))
                .catch(err => console.log('Não encontrado'))
                .then(res => ctx.reply(res))
        })
))



bot.launch()
