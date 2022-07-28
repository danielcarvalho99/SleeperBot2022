require('dotenv').config()
const { Telegraf, session, Scenes:{ WizardScene, Stage}, Markup } = require('telegraf')
const handlers = require('./Handlers')
const express = require('express')
const app = express()

console.log(`SleeperBot 2022 running on PORT ${process.env.PORT}`)

app.listen(process.env.PORT || 5000)
const bot = new Telegraf(process.env.TOKEN)

const exit_keyboard = Markup.keyboard(['exit']).oneTime()
const remove_keyboard = Markup.removeKeyboard()

// Scenes
const leaguesScene = new WizardScene('leaguesScene', handlers.userHandler)
leaguesScene.enter(ctx => ctx.reply('Qual o seu nome de usuário?'))

const playerScene = new WizardScene('playerScene', handlers.playerInfoHandler)
playerScene.enter(ctx => ctx.reply('Qual o nome completo do jogador que deseja buscar?\nEx: Aaron Rodgers', exit_keyboard))

const availableScene = new WizardScene('availableScene', handlers.userLeaguesHandler, handlers.playerAvailableLeaguesHandler)
availableScene.enter(ctx => ctx.reply('Qual o seu nome de usuário?'))

const stage = new Stage([leaguesScene, playerScene, availableScene])
stage.hears('exit', ctx => ctx.scene.leave())


// Bot commands
bot.use(session());
bot.use(stage.middleware())

bot.start((ctx) => ctx.reply(`Bem-vindo ${ctx.from.first_name}, O SleeperBot2022 possui os seguintes comandos disponíveis:\n/player: busca pelo jogador\n/leagues: busca pelas ligas do usuário\n/available: busca em que ligas do usuário o jogador está disponível`)
            .then(res =>console.log(ctx.from)))

bot.command('/leagues', ctx=> ctx.scene.enter('leaguesScene'))  
bot.command('/player', ctx=> ctx.scene.enter('playerScene'))
bot.command('/available', ctx=> ctx.scene.enter('availableScene'))           

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))