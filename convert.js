const fs = require('fs');

let rawdata = fs.readFileSync('scryfall-oracle-cards.json');
let scryfalldata = JSON.parse(rawdata);
let scryfallmap = {}
scryfalldata.forEach(d => scryfallmap[d.oracle_id] = d.id)

rawdata = fs.readFileSync('AllCards.json');
let cards = JSON.parse(rawdata);
let cardlist = []
for (let c in cards) {
    if(cards.hasOwnProperty(c)) {
        cardlist.push(cards[c])
    }
}
cardlist = cardlist
               .filter(c => c.types.includes("Creature"))
               .filter(c => c.legalities.hasOwnProperty("vintage"))
               .filter(c => c.legalities.vintage != "Banned")
cardlist.forEach(c => {
    delete c.rulings
    delete c.foreignData
    delete c.purchaseUrls
    delete c.edhrecRank
    delete c.legalities
    delete c.mtgstocksId
    delete c.types
    delete c.colorIdentity
    delete c.colors
    delete c.printings
    delete c.supertypes
    delete c.subtypes
    delete c.layout
    delete c.names
    delete c.isReserved
    delete c.mtgoFoilId
    delete c.mtgoId
    c['scryfallId'] = scryfallmap[c.scryfallOracleId]
    delete c.scryfallOracleId
})

let data = JSON.stringify(cardlist)
fs.writeFileSync("creatures.json", data)

