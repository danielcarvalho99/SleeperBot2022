require('dotenv').config()
const { Telegraf, session, Scenes:{ WizardScene, Stage}, Markup } = require('telegraf')

const axios = require('axios')
const express = require('express')
const app = express()

console.log(`SleeperBot 2022 running on PORT ${process.env.PORT}`)

app.listen(process.env.PORT || 5000)
const bot = new Telegraf(process.env.TOKEN)

const exit_keyboard = Markup.keyboard(['exit']).oneTime()
const remove_keyboard = Markup.removeKeyboard()

async function find_user_id(name){
    res = await axios.get(`https://api.sleeper.app/v1/user/${name}`)
    return res.data['user_id']
}

async function find_leagues_list(user_id){
    res = await axios.get(`https://api.sleeper.app/v1/user/${user_id}/leagues/nfl/2021`)
    
    let leagues = [] 
    for (let i of res.data) {
        leagues.push((i['id'], i['name']))
    }

    return leagues
}

function find_league_names(leagues){
    
    try{
        let response_str = `O usuário está disponível em ${(leagues.length)} ligas:\n$`
        
        for (let league of leagues) {
            response_str += `${league}\n`
        }
    
        return response_str
    }
    catch{
        return 'Não foi possível executar a operação'
    }   
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
    return res.data[id]
}

async function find_player_id(player_name){
    res = await axios.get('https://api.sleeper.app/v1/players/nfl')

    for (let i of Object.keys(res.data)) {
        if(res.data[i]['full_name'].toLowerCase() == player_name.toLowerCase()){
            //console.log(i)
            return i
        }
    }

    return 
}

const playerHandler = Telegraf.on('text', async(ctx) =>{

    ctx_aux = ctx
    ctx.scene.player = ctx.message.text

    await ctx.reply(`Buscando por ${ctx.scene.player}...`)
            .then(res => find_player_id(ctx.scene.player))
            .then(id => find_player_info(id))
            .then(info => ctx_aux.reply(show_player_info(info)))
        
    return ctx.scene.leave()
})


const nameHandler = Telegraf.on('text', async(ctx) =>{

    ctx_aux = ctx
    ctx.scene.name = ctx.message.text

    await find_user_id(ctx.scene.name)
        .then(id =>find_leagues_list(id))
        .then(leagues => find_league_names(leagues))
        .then(names => ctx_aux.reply(names))
        
    return ctx.wizard.next()
})

const ageHandler = Telegraf.hears(/^[0-9]*$/, async ctx => {
    ctx.session.name = ctx.scene.state.name
    ctx.session.age = ctx.message.text

    await ctx.reply('New info has been set!', remove_keyboard)
    return ctx.scene.leave()
})

const leaguesScene = new WizardScene('leaguesScene', nameHandler, ageHandler)
leaguesScene.enter(ctx => ctx.reply('Qual o seu nome?', exit_keyboard))

const findScene = new WizardScene('findScene', playerHandler)
findScene.enter(ctx => ctx.reply('Qual o jogador que deseja buscar?', exit_keyboard))

const stage = new Stage([leaguesScene, findScene])
stage.hears('exit', ctx => ctx.scene.leave())


bot.use(session());
bot.use(stage.middleware())

bot.start((ctx) => ctx.reply(`Bem-vindo ${ctx.from.first_name}, O SleeperBot2022 possui os seguintes comandos disponíveis:\n/find: busca pelo jogador\n/leagues para busca das ligas do usuário.`)
            .then(res =>console.log(ctx.from)))

bot.command('/leagues', ctx=> ctx.scene.enter('leaguesScene'))  
bot.command('/find', ctx=> ctx.scene.enter('findScene'))          

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))