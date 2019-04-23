/**
 *
 *
 *
 */

'use strict';

const promise = require('promise');

const dataContent = require('./dataContent');

let AuctionBot = {
    playerId: process.env.PLAYER_ID || 10000,
    playerName: 'Zeus',
    generatedAuctionCategories: [],
    auctionLootCount: 10,
    auctionLootList: {
        1: 100, // Hand to Hand
        2: 100, // Daggers
        3: 100, // Swords
        4: 100, // Great Swords
        5: 100, // Axes
        6: 100, // Great Axes
        7: 100, // Scythe
        8: 100, // Polearms
        9: 100, // Katana
        10: 100, // Great Katana
        11: 100, // Clubs
        12: 100, // Staves
        13: 100, // Ranged

        14: 50, // Instruments
        48: 50, // Pet Items
        47: 10, // Fishing Gear
        15: 50, // Ammunition
        62: 10, // Grips

        16: 100, // Shields
        17: 100, // Head
        22: 100, // Neck
        18: 100, // Body
        19: 100, // Hands
        23: 100, // Waist
        20: 100, // Legs
        21: 100, // Feet
        26: 100, // Back
        24: 100, // Earrings
        25: 100, // Rings

        28: 75, // White Mage
        29: 75, // Black Mage
        32: 75, // Songs
        31: 75, // Ninjutsu
        30: 75, // Summoning
        60: 75, // Dice

        33: 50, // Medicines

        34: 10, // Furnishings

        44: 25, // Alchemy
        63: 25, // Alchemy 2
        43: 25, // Woodworking
        42: 25, // Bonecraft
        41: 25, // Leathercraft
        40: 25, // Clothcraft
        39: 25, // Goldsmith
        38: 25, // Smithing

        52: 20, // Meat and Eggs
        53: 20, // Seafood
        54: 20, // Vegetables
        55: 20, // Soups
        56: 20, // Bread and Rice
        57: 20, // Sweets
        58: 20, // Drinks
        59: 50, // Ingredients
        51: 10, // Fish

        35: 15, // Crystals

        46: 10, // Misc
        64: 10, // Misc 2
        65: 10, // Misc 3 ??
        50: 10, // Beast-Made
        36: 10, // Cards
        49: 50, // Ninja Tools
        37: 10, // Cursed Items
        61: 25, // Automatons
    },
    init: function (charid) {
        dataContent.query('SELECT charname FROM chars WHERE charid = ' + parseInt(AuctionBot.playerId))
            .then(function (result) {
                if (result.length > 0) {
                    AuctionBot.playerName = result[0].charname;
                }
                // console.log(AuctionBot.playerName);
            })
            .then(function () {
                let lootGenerated = [];
                for (let loot in AuctionBot.auctionLootList) {
                    for (let i = 0; i < AuctionBot.auctionLootList[loot]; i++) {
                        lootGenerated.push(loot);
                    }
                }

                AuctionBot.generatedAuctionCategories = [];
                for (let i = 0; i < AuctionBot.auctionLootCount; i++) {
                    let lootPicked = Math.floor(Math.random() * lootGenerated.length);
                    AuctionBot.generatedAuctionCategories.push(lootGenerated[lootPicked]);
                }

                // console.log(AuctionBot.generatedAuctionCategories);
            })
            .then(function () {

                for (let i = 0; i < AuctionBot.generatedAuctionCategories.length; i++) {
                    let auctionItemQuery = 'select *, (BaseSell * 8) as RRP from item_basic where aH in (' + AuctionBot.generatedAuctionCategories[i] + ') AND NoSale = 0 and BaseSell > 0;';
                    // console.log(AuctionBot.generatedAuctionCategories[i]);
                    // console.log(auctionItemQuery);

                    dataContent.query(auctionItemQuery)
                        .then(function (auctionItemAvailable) {
                            AuctionBot.stockAuctionHouse(auctionItemAvailable);
                        })
                        .catch(function (err) {
                            console.log(err);
                        });

                }

            })
            .catch(function (err) {
                console.log(err);
            });
    },
    stockAuctionHouse: function (auctionItemAvailable) {
        let auctionList = [];
        let itemPicked = Math.floor(Math.random() * auctionItemAvailable.length);
        auctionList.push({
            itemid: auctionItemAvailable[itemPicked].itemid,
            stack: (auctionItemAvailable[itemPicked].stackSize == 1 ? 0 : auctionItemAvailable[itemPicked].stackSize),
            seller: AuctionBot.playerId,
            seller_name: AuctionBot.playerName,
            date: Math.floor(new Date().getTime() / 1000), // this should match c++ time() object
            price: Math.floor(auctionItemAvailable[itemPicked].BaseSell * ((Math.random() * 5) + 2))
        });
        // console.log(auctionList[0]);
        dataContent.insert('auction_house', auctionList[0]);

        console.log(`${AuctionBot.playerName} has placed an item on the auction house.`);
    }
};

var exports = module.exports = {
    init: AuctionBot.init
};
