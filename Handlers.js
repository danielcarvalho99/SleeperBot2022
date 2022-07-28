const { Telegraf, session, Scenes:{ WizardScene, Stage}, Markup } = require('telegraf')
const requests = require('./Requests')

const playerInfoHandler = Telegraf.on('text', async(ctx) =>{

    ctx_aux = ctx
    ctx.scene.player = ctx.message.text

    await ctx.reply(`Buscando por ${ctx.scene.player}...`)
            .then(res => requests.find_player_id(ctx.scene.player))
            .then(id => requests.find_player_info(id))
            .then(info => ctx_aux.reply(requests.show_player_info(info)))
        
    return ctx.scene.leave()
})

const userHandler = Telegraf.on('text', async(ctx) =>{

    ctx_aux = ctx
    ctx.scene.name = ctx.message.text

    await requests.find_user_id(ctx.scene.name)
        .then(id =>requests.find_leagues_list(id))
        .then(leagues => requests.find_league_names(leagues))
        .then(names => ctx.reply(names))
        
    return ctx.scene.leave()
})

const userLeaguesHandler = Telegraf.on('text', async(ctx) =>{

    ctx.scene.user = ctx.message.text
    
    await requests.find_user_id(ctx.scene.user)
        .then(id =>requests.find_leagues_list(id))
        .then(leagues => ctx.scene.state.leagues = leagues)
        .then(ctx.reply('Qual o nome completo do jogador que você deseja procurar?'))
    
    return ctx.wizard.next()
})

const playerAvailableLeaguesHandler = Telegraf.on('text', async(ctx) =>{

    ctx.scene.player = ctx.message.text
    let available_leagues_list = []

    await ctx.reply(`Buscando por ${ctx.scene.player}...`)
            .then(res => requests.find_player_id(ctx.scene.player))
            .then(id => requests.find_available_leagues_for_player(ctx.scene.state.leagues, id, available_leagues_list))
            .then(res=> requests.show_available_leagues_list(res, ctx))
        
            
    return ctx.scene.leave()
})

module.exports = {playerInfoHandler, userHandler, userLeaguesHandler, playerAvailableLeaguesHandler}