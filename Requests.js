const axios = require('axios')

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

async function find_player_info(id){
    res = await axios.get('https://api.sleeper.app/v1/players/nfl')
    return res.data[id]
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

module.exports = {find_player_info, find_leagues_list, find_user_id,
                  find_league_names, show_player_info, find_player_id,
                  find_league_info, is_player_available_in_league,
                  find_available_leagues_for_player, show_available_leagues_list} 