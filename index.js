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
    try{
        res = await axios.get(`https://api.sleeper.app/v1/user/${name}`)
        return res.data['user_id']
    }
    catch{
        throw new Error('Usuário não encontrado!')
    }
}

async function find_leagues_list(user_id){
    
    res = await axios.get(`https://api.sleeper.app/v1/user/${user_id}/leagues/nfl/2021`)

    let leagues = [] 
        for (let i of res.data) {
            leagues.push([i['league_id'], i['name']])
        }

        return leagues
    }
    

function find_league_names(leagues){
    
    let response_str = `O usuário está em ${(leagues.length)} ligas:\n$`
    
    for (let league of leagues) {
        response_str += `${league[1]}\n`
    }

    return response_str       
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
            return i
        }
    }
 
}

async function find_league_info(league_id){
    try{
        res = await axios.get(`https://api.sleeper.app/v1/league/${league_id}/rosters`)
        return res
    }
    catch{
        throw new Error('Erro!')
    }
}

async function is_player_available_in_league(res, player_id, league, leagues_list){

    for(let roster of res.data){
        for (let player of roster['players']){
            if(player_id == player) {
                return
            }
        }
    }

    leagues_list.push(league)
    return 
}

async function find_available_leagues_for_player(leagues, player_id, available_leagues_list){

    for(let league of leagues){
        await find_league_info(league[0])
        .then(res => is_player_available_in_league(res, player_id, league, available_leagues_list))
    }

    return available_leagues_list

}

function show_available_leagues_list(leagues_list, ctx){

    size = leagues_list.length

    if(size > 0){
        leagues_list_str = ''
        for(let league of leagues_list){
            leagues_list_str += `${league[1]}\n`
        }
        ctx.reply(`O jogador está disponivel em ${size} ligas:\n${leagues_list_str}`) 
               
    }
    else {
        ctx.reply('O jogador não está disponível em nenhuma liga!')
    }
    
}


const playerInfoHandler = Telegraf.on('text', async(ctx) =>{

    ctx_aux = ctx
    ctx.scene.player = ctx.message.text

    await ctx.reply(`Buscando por ${ctx.scene.player}...`)
            .then(res => find_player_id(ctx.scene.player))
            .then(id => find_player_info(id))
            .then(info => ctx_aux.reply(show_player_info(info)))
        
    return ctx.scene.leave()
})


const userHandler = Telegraf.on('text', async(ctx) =>{

    ctx_aux = ctx
    ctx.scene.name = ctx.message.text

    await find_user_id(ctx.scene.name)
        .then(id =>find_leagues_list(id))
        .then(leagues => find_league_names(leagues))
        .then(names => ctx.reply(names))
        
    return ctx.scene.leave()
})

const userLeaguesHandler = Telegraf.on('text', async(ctx) =>{

    ctx.scene.user = ctx.message.text
    
    await find_user_id(ctx.scene.user)
        .then(id =>find_leagues_list(id))
        .then(leagues => ctx.scene.state.leagues = leagues)
        .then(ctx.reply('Qual o nome completo do jogador que você deseja procurar?'))
    
    return ctx.wizard.next()
})

const playerAvailableLeaguesHandler = Telegraf.on('text', async(ctx) =>{

    ctx.scene.player = ctx.message.text
    let available_leagues_list = []

    await ctx.reply(`Buscando por ${ctx.scene.player}...`)
            .then(res => find_player_id(ctx.scene.player))
            .then(id => find_available_leagues_for_player(ctx.scene.state.leagues, id, available_leagues_list))
            .then(res=> show_available_leagues_list(res, ctx))
        
            
    return ctx.scene.leave()
})

const leaguesScene = new WizardScene('leaguesScene', userHandler)
leaguesScene.enter(ctx => ctx.reply('Qual o seu nome de usuário?'))

const playerScene = new WizardScene('playerScene', playerInfoHandler)
playerScene.enter(ctx => ctx.reply('Qual o nome completo do jogador que deseja buscar?\nEx: Aaron Rodgers', exit_keyboard))

const availableScene = new WizardScene('availableScene', userLeaguesHandler, playerAvailableLeaguesHandler)
availableScene.enter(ctx => ctx.reply('Qual o seu nome de usuário?'))

const stage = new Stage([leaguesScene, playerScene, availableScene])
stage.hears('exit', ctx => ctx.scene.leave())


bot.use(session());
bot.use(stage.middleware())

bot.start((ctx) => ctx.reply(`Bem-vindo ${ctx.from.first_name}, O SleeperBot2022 possui os seguintes comandos disponíveis:\n/find: busca pelo jogador\n/leagues: busca pelas ligas do usuário\n/available: busca em que ligas do usuário o jogador está disponível`)
            .then(res =>console.log(ctx.from)))

bot.command('/leagues', ctx=> ctx.scene.enter('leaguesScene'))  
bot.command('/player', ctx=> ctx.scene.enter('playerScene'))
bot.command('/available', ctx=> ctx.scene.enter('availableScene'))           

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))