const fs = require('fs');

let scryfalldata = require('./scryfall-oracle-cards.json');
let scryfallmap = {}
scryfalldata.forEach(d => scryfallmap[d.oracle_id] = d.id)

let cards = require('./AllCards.json');
let cardlist = []
for (let c in cards) {
    if(cards.hasOwnProperty(c)) {
        cardlist.push(cards[c])
    }
}
cardlist = cardlist
               .filter(c => c.type_line && (c.type_line.match(" Creature ") || c.type_line.startsWith("Creature")))
               .filter(c => c.legalities.hasOwnProperty("vintage"))
               .filter(c => c.legalities.vintage == "legal")
               .filter(c => !c.hasOwnProperty("side") || c.side == "a")
let newcardlist = []
cardlist.forEach(c => {
    const newCard = {
      scryfallId: scryfallmap[c.oracle_id],
      cmc: c.cmc,
      image_uris: c.image_uris,
      card_faces: c.card_faces,
    }
    newcardlist.push(newCard);
    // delete c.rulings
    // delete c.foreignData
    // delete c.purchaseUrls
    // delete c.edhrecRank
    // delete c.legalities
    // delete c.mtgstocksId
    // delete c.types
    // delete c.colorIdentity
    // delete c.colors
    // delete c.printings
    // delete c.supertypes
    // delete c.subtypes
    // delete c.layout
    // delete c.names
    // delete c.isReserved
    // delete c.mtgoFoilId
    // delete c.mtgoId
    // delete c.related_uris
    // delete c.purchase_uris
    // delete c.prices
    // delete c.rulings_uri
    // delete c.set_search_uri
    // delete c.scryfall_set_uri
    // delete c.prints_search_uri
    // c['scryfallId'] = scryfallmap[c.oracle_id]
    // delete c.scryfallOracleId
})

let data = JSON.stringify(newcardlist)
fs.writeFileSync("creatures.json", data)
