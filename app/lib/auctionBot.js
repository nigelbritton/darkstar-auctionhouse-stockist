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
    playerName: 'PlayerUnknown',
    auctionItemLimit: process.env.AUCTION_ITEM_LIMIT || 10000,
    generatedAuctionCategories: [],
    auctionLootCount: 10,
    auctionLootList: {
        1: 50, // Hand to Hand
        2: 50, // Daggers
        3: 50, // Swords
        4: 50, // Great Swords
        5: 50, // Axes
        6: 50, // Great Axes
        7: 50, // Scythe
        8: 50, // Polearms
        9: 50, // Katana
        10: 50, // Great Katana
        11: 50, // Clubs
        12: 50, // Staves
        13: 50, // Ranged

        14: 25, // Instruments
        48: 25, // Pet Items
        47: 25, // Fishing Gear
        15: 50, // Ammunition
        62: 10, // Grips

        16: 50, // Shields
        17: 50, // Head
        22: 50, // Neck
        18: 50, // Body
        19: 50, // Hands
        23: 50, // Waist
        20: 50, // Legs
        21: 50, // Feet
        26: 50, // Back
        24: 50, // Earrings
        25: 50, // Rings

        28: 50, // White Mage
        29: 50, // Black Mage
        32: 50, // Songs
        31: 50, // Ninjutsu
        30: 50, // Summoning
        60: 50, // Dice

        33: 50, // Medicines

        34: 10, // Furnishings

        44: 65, // Alchemy
        63: 65, // Alchemy 2
        43: 65, // Woodworking
        42: 65, // Bonecraft
        41: 65, // Leathercraft
        40: 65, // Clothcraft
        39: 65, // Goldsmith
        38: 65, // Smithing

        52: 20, // Meat and Eggs
        53: 20, // Seafood
        54: 20, // Vegetables
        55: 20, // Soups
        56: 20, // Bread and Rice
        57: 20, // Sweets
        58: 20, // Drinks
        59: 75, // Ingredients
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
    init: function () {
        let _self = this;
        dataContent.query('SELECT charname FROM chars WHERE charid = ' + parseInt(AuctionBot.playerId))
            .then(function (result) {
                if (result.length > 0) {
                    AuctionBot.playerName = result[0].charname;
                }
                // console.log(AuctionBot.playerName);
            })
            .then(function () {
                AuctionBot.stockRefreshCycle();
            })
            .catch(function (err) {
                console.log(err);
            });
    },
    stockRefreshCycle: function () {
        let auctionItemLimitReached = false;

        dataContent.query('select count(*) as item_count from auction_house where sell_date = 0 and seller = ' +  + parseInt(AuctionBot.playerId) + ';')
            .then(function (result) {
                if (result.length > 0) {
                    if (result[0].item_count >= AuctionBot.auctionItemLimit) { auctionItemLimitReached = true; }
                }
            })
            .then(function () {
                if (auctionItemLimitReached === false) {
                    AuctionBot.generateStock();
                } else {
                    console.log(`${AuctionBot.playerName} did not place any items on the auction house. ` + new Date().toISOString());
                    setTimeout(function(){
                        AuctionBot.stockRefreshCycle();
                    }, 120000);
                }
            })
            .catch(function (err) {
                console.log(err);
            });
    },
    generateStock: function () {
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

        setTimeout(function(){
            AuctionBot.stockRefreshCycle();
        }, 120000);
    },
    stockAuctionHouse: function (auctionItemAvailable) {
        let _self = this;
        let auctionList = [];
        let itemPicked = Math.floor(Math.random() * auctionItemAvailable.length);
        let markUpValue = (auctionItemAvailable[itemPicked].stackSize == 1 ? 5 : 2); // single vs stacked
        auctionList.push({
            itemid: auctionItemAvailable[itemPicked].itemid,
            stack: (auctionItemAvailable[itemPicked].stackSize == 1 ? 0 : auctionItemAvailable[itemPicked].stackSize),
            seller: AuctionBot.playerId,
            seller_name: AuctionBot.playerName,
            date: Math.floor(new Date().getTime() / 1000), // this should match c++ time() object
            price: Math.floor((auctionItemAvailable[itemPicked].BaseSell * auctionItemAvailable[itemPicked].stackSize) * ((Math.random() * markUpValue) + 1))
        });

        // console.log(auctionList[0]);
        dataContent.insert('auction_house', auctionList[0]);

        console.log(`${AuctionBot.playerName} has placed an item on the auction house. ` + new Date().toISOString());
    }
};

var exports = module.exports = {
    init: AuctionBot.init
};
