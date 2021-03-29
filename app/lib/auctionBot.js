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

        44: 35, // Alchemy
        63: 35, // Alchemy 2
        43: 35, // Woodworking
        42: 35, // Bonecraft
        41: 35, // Leathercraft
        40: 35, // Clothcraft
        39: 35, // Goldsmith
        38: 35, // Smithing

        52: 10, // Meat and Eggs
        53: 10, // Seafood
        54: 10, // Vegetables
        55: 10, // Soups
        56: 10, // Bread and Rice
        57: 10, // Sweets
        58: 10, // Drinks
        59: 25, // Ingredients
        51: 25, // Fish

        35: 15, // Crystals

        46: 10, // Misc
        64: 10, // Misc 2
        65: 10, // Misc 3 ??
        50: 10, // Beast-Made
        36: 10, // Cards
        49: 10, // Ninja Tools
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
                AuctionBot.flushDeliveryBox();
                AuctionBot.stockRefreshCycle();
                AuctionBot.stockPurchaseCycle();
            })
            .catch(function (err) {
                console.log(err);
            });
    },
    flushDeliveryBox: function () {
        dataContent.query('DELETE FROM delivery_box WHERE itemid <> 65535 AND senderid = 0 AND charid = ' + parseInt(AuctionBot.playerId) + ';')
            .then(function () {
                console.log(`${AuctionBot.playerName} has emptied the delivery box. ` + new Date().toISOString());
                setTimeout(function () {
                    AuctionBot.flushDeliveryBox();
                }, 600000);
            })
            .catch(function (err) {
                console.log(err);
            });
    },
    stockRefreshCycle: function () {
        let auctionItemLimitReached = false;

        dataContent.query('select count(*) as item_count from auction_house where sell_date = 0 and seller = ' + + parseInt(AuctionBot.playerId) + ';')
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
                    setTimeout(function () {
                        AuctionBot.stockRefreshCycle();
                    }, 120000);
                }
            })
            .catch(function (err) {
                console.log(err);
            });
    },
    stockPurchaseCycle: function () {
        // let auctionItemQuery = 'select auction_house.id, auction_house.itemid, auction_house.stack, auction_house.seller, auction_house.seller_name, item_basic.name, seller, price, stackSize, BaseSell as total_rrp from auction_house join item_basic on auction_house.itemid = item_basic.itemid where sell_date = 0 and ((price <= (BaseSell * stackSize) and stackSize > 1) or (price <= (BaseSell * stackSize) and stackSize = 1)) and seller <> ' + parseInt(AuctionBot.playerId) + ' limit 1000;';
        let auctionItemQuery = 'select auction_house.id, auction_house.itemid, auction_house.stack, auction_house.seller, auction_house.seller_name, item_basic.name, seller, price, stackSize, BaseSell, (BaseSell * stackSize) as BaseSell_Stack from auction_house join item_basic on auction_house.itemid = item_basic.itemid where sell_date = 0 and seller <> ' + parseInt(AuctionBot.playerId) + ' limit 1000;';
        dataContent.query(auctionItemQuery)
            .then(function (result) {
                if (result.length > 0) {
                    let itemPicked = Math.floor(Math.random() * result.length);
                    let randomAuctionListing = result[itemPicked];
                    let priceSingle = randomAuctionListing.BaseSell;
                    let priceStack = randomAuctionListing.BaseSell_Stack;
                    let priceBid = 0;

                    if (randomAuctionListing.stack == 0) {
                        priceBid = Math.floor(priceSingle * ((Math.random() * 5) + 1));
                    } else if (randomAuctionListing.stack == 1) {
                        priceBid = Math.floor(priceStack * ((Math.random() * 5) + 5));
                    }

                    if (priceBid >= randomAuctionListing.price) {
                        AuctionBot.updateAuctionItemListing(randomAuctionListing.id, priceBid);
                        console.log(`PlayerUnknownBot purchased an item from the auction house. ` + new Date().toISOString());
                    } else {
                        console.log(`PlayerUnknownBot failed to bid on an auction item. ` + new Date().toISOString());
                    }

                    setTimeout(function () {
                        AuctionBot.stockPurchaseCycle();
                    }, 30000);
                } else {
                    console.log(`PlayerUnknownBot could not find anything to purchased from the auction house. ` + new Date().toISOString());

                    setTimeout(function () {
                        AuctionBot.stockPurchaseCycle();
                    }, 30000);
                }
            })
            .catch(function (err) {
                console.log(err);
            });
    },
    updateAuctionItemListing: function (auctionItemId, salePrice) {
        const currentDate = Math.floor(new Date().getTime() / 1000);
        dataContent.update('auction_house',
            [
                { field: 'buyer_name', value: 'PlayerUnknown' },
                { field: 'sale', value: salePrice },
                { field: 'sell_date', value: currentDate }
            ],
            [
                { field: 'id', value: auctionItemId }
            ]
        );
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

        setTimeout(function () {
            AuctionBot.stockRefreshCycle();
        }, 120000);
    },
    stockAuctionHouse: function (auctionItemAvailable) {
        let _self = this;
        let auctionList = [];
        let itemPicked = Math.floor(Math.random() * auctionItemAvailable.length);
        let markUpValue = (Math.random() * 2) + 1;
        let sellAsStack = (auctionItemAvailable[itemPicked].stackSize == 1 ? 0 : (Math.round(Math.random() * 100) > 75 ? 0 : 1));

        if (auctionItemAvailable[itemPicked].flags >= 32000) {
            markUpValue += ((Math.random() * 4) + 6);
        } else if (auctionItemAvailable[itemPicked].name.indexOf('+1') > -1) {
            markUpValue += ((Math.random() * 2) + 1);
        }

        auctionList.push({
            itemid: auctionItemAvailable[itemPicked].itemid,
            stack: sellAsStack,
            seller: AuctionBot.playerId,
            seller_name: AuctionBot.playerName,
            date: Math.floor(new Date().getTime() / 1000), // this should match c++ time() object
            price: Math.floor((auctionItemAvailable[itemPicked].BaseSell * auctionItemAvailable[itemPicked].stackSize) * markUpValue)
        });

        // console.log(auctionList[0]);
        dataContent.insert('auction_house', auctionList[0]);

        console.log(`${AuctionBot.playerName} has placed an item on the auction house. ` + new Date().toISOString());
    }
};

var exports = module.exports = {
    init: AuctionBot.init
};
