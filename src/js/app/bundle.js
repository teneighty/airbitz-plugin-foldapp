/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export reenter */
/* harmony export (immutable) */ __webpack_exports__["a"] = postWrapper;
var id = 0;
var callbacks = {}

function newCbId() {
  return (id++).toString();
};

function reenter(cbid, err, data) {
  if (callbacks[cbid]) {
    callback[cbid](err, data)
    delete callback[cbid]
    return true
  } else {
    return false
  }
}

function postWrapper(args) {
  var cbid = newCbId();
  args['cbid'] = cbid;
  return new Promise((resolve, reject) => {
    callbacks[cbid] = function(err, data) {
      if (err) {
        p.reject(err)
      } else {
        p.resolve(data)
      }
    }
    /* Send message to native or some other layer */
    window.postMessage(JSON.stringify(args))
  })
}



/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__ = __webpack_require__(2);


var CardsChanged = {
    NO : 0,
    YES : 1,
    VALUE_ONLY : 2
};

var fold_api = "https://api.foldapp.com/v1/";
var brand = __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["a" /* config */].get("BRAND");
var api_token = __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["a" /* config */].get("API-TOKEN");
var bizId = __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["a" /* config */].get("BIZID");
var logo_url = __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["a" /* config */].get("LOGO_URL");
var category = __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["a" /* config */].get("CATEGORY");
var statsKey = __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["a" /* config */].get('AIRBITZ_STATS_KEY');
var server_json_error = false;
var first_load = 1;
var force_refresh = 1;
var min_price_rate = 1;
var refund_enabled = 0;
var affiliate_address = null;
var affiliate_fee_percent = 0;

// TODO: get this number from the core
var DUST = 4000;

// Purchases over this amount are given a popup warning as 1 confirmation is required
// before card is available
var large_value_threshold = 50;

document.title = brand; // Set page's title to brand of gift card.

function resetAccount() {
    var x;
    if (confirm("Reset Account? This will delete all cards and create a new account with Fold") == true) {
        if (confirm("Reset Account? ARE YOU SURE. All cards from all vendors will be lost?") == true) {
            if (confirm("Reset Account? ARE YOU REALLY SURE?") == true) {
                Account.createWithHandler(function(){
                    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"New account creation for reset succeeded.");
                    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].exit();
                }, function(){
                    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("New Account Creation Failed", "New Account Creation Failed. Please check network or try again later");
                    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"New account creation for reset failed.");
                });
            }
        }
    }
}

function toggleUi() {
    $(".fold-loading").css("display", "none");
    $(".main").css("display", "inline");
    setInterval( function() {
        updateAllCards();
    }, 3000); // Refresh UI every 3 seconds
}

function updateAllCards() {
    user.updateUsersCards(function() {
        user.updateCardsForSale(function() {
            Account.pingCard(Account.current_card_id);
            if (server_json_error) {
                __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("Server Response Error", "Error in Server response. Please contact support");
                __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Error in Server response. Please contact support");
                server_json_error = false;
                first_load = 0;
            }
        }); // Start getting avaliable cards for sale.
    });
}

function supportsTemplate() {
    return 'content' in document.createElement('template');
}

function supportsImports() {
    return 'import' in document.createElement('link');
}
if (supportsTemplate()) {
    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Does support templates!");
} else {
    // Use old templating techniques or libraries.
    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Does not support templates.");
}
if (supportsImports()) {
    // Good to go!
    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Supports imports!");
} else {
    // Use other libraries/require systems to load files.
    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Does not support imports.");
}

var createAddress = function(wallet, label, amountSatoshi, amountFiat,
                             category, notes, resolve, reject) {
    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["b" /* core */].createReceiveRequest(wallet, {
        label: label,
        category: category,
        notes: notes,
        amountSatoshi: amountSatoshi,
        amountFiat: amountFiat,
        bizId: parseInt(bizId),
        success: function(data) {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["b" /* core */].finalizeReceiveRequest(wallet, data["requestId"]);
            resolve(data);
        },
        error: reject
    });
};

function updateWallet(wallet) {
    Account.abWallet = wallet;
}

function logStats(event, brand, amount) {
    var s = {};
    s['btc'] = 0;
    s['partner'] = 'Fold';
    s['country'] = 'USA';
    s['user'] = Account.username.substr(Account.username.length - 8);
    s['brand'] = brand;
    s['usd'] = amount;
    if (affiliate_address && affiliate_address.length >= 8) {
        s['afaddr'] = affiliate_address.substr(affiliate_address.length - 8);
    } else {
        s['afaddr'] = "none";
    }

    $.ajax({
        headers: {
            'Content-Type' : 'application/json',
            'Authorization': 'Token ' + statsKey,
        },
        'type' : 'POST',
        'url' : 'https://airbitz.co/api/v1/events',
        'data' : JSON.stringify({
            'event_type': event,
            'event_network' : 'mainnet',
            'event_text': JSON.stringify(s),
        }),
        'dataType': 'json',
        success : function(response) {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"logStats: recorded");
        }
    }).fail(function(xhr, textStatus, error) {
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"logStats: There was an error. Status: " + xhr.status);
    });
}

function sRequestHandler(url, json, handleReponse, handleError) {
    $.ajax({
        headers: {
            'Accept' : 'application/json',
            'Content-Type' : 'application/json',
            'X-CFC-PartnerToken': api_token,
        },
        'type' : 'POST',
        'url' : url,
        'data' : JSON.stringify(json),
        'dataType': 'json',
        success : function(response) {
            handleReponse(response);
        }
    }).fail(function(xhr, textStatus, error) {
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"There was an error. Status: " + xhr.status);
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,xhr.Message);
        handleError(xhr.status);
    });
}

var Account = {
    exists: $.Deferred(),
    logged_in: $.Deferred(),
    all_cards: [],
    owl: $("#user-cards"),
    owlSet: false, // Owl set
    numUpdates: 0,
    current_card_id: "", // The currently visible card id. used to ping Fold servers for balance update
    create: function() {
        Account.createWithHandler(function(){
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Account created successfully");
        },function(){
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("Account creation error", "Error creating account. Please try again later");
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].exit()
        });
    },

    createWithHandler: function(handleReponse, handleError) {
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Creating user.");
        var url = fold_api + "users";
        var newAcc = {"users": [{
            "random_username": true,
            "random_password": true
        }]}

        sRequestHandler(url, newAcc, function(r) {
            Account.username = r['users'][0]['username'];
            Account.pass = r['users'][0]['password'];
            Account.creds = {"users": [{
                "username": Account.username,
                "password": Account.pass
            }]};
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["b" /* core */].writeData("fold-username", Account.username);
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["b" /* core */].writeData("fold-pass", Account.pass);
            Account.exists.resolve();
            handleReponse();
        }, function(error) {
            handleError();
        });
    },

    login: function() {
        var url = fold_api + "my/session";
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,Account.creds);
        sRequestHandler(url, Account.creds, function(r) {
            //ui.debugLevel(1,"Logging in" + JSON.stringify(r));
            Account.logged_in.resolve(r);
        }, function(error) {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("Login error", "Error logging into account. Please try again later");
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].exit();
        });
        var affiliateInfo = __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["b" /* core */].getAffiliateInfo();
        if (affiliateInfo
              && affiliateInfo["affiliate_address"] 
              && affiliateInfo["affiliate_address"].length > 20) {
            for (var ic in affiliateInfo["objects"]) {
                if (affiliateInfo["objects"][ic]["key"] == "gift_card_affiliate_fee") {
                    affiliate_address = affiliateInfo["affiliate_address"];
                    affiliate_fee_percent = affiliateInfo["objects"][ic]["value"] / 100;
                    break;
                }
            }
        }

    },
    updateBalance: function() {
        this.getInfo("balances?currency=USD", function(balances) {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Balance: " + JSON.stringify(balances["balances"][0]["amount"]));
            $(".balance-amt").text("$" + balances["balances"][0]["amount"]);
        });
    },

    pingCard: function(cardid) {
        if (!cardid) {
          return;
        }
        var url = fold_api + "my/cards/" + cardid + "/ping";
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Pinging card " + cardid);
        sRequestHandler(url, "", function(r){
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Pinging card success");
        },
        function(e) {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Pinging card failed");
        });
    },

    updateWAddr: function(addr, handleResponse, handleError) { // Set the default BTC address
        var withdraw_url = fold_api + "my/default_withdraw_addresses";
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Setting default address to: " + addr.toString());
        var newAddr = {"default_withdraw_addresses": [{
            "currency": "BTC",
            "default_address": [{
                "address": addr.toString(),
                "address_type": "crypto"
            }]
        }]};
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,withdraw_url);
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,newAddr);
        sRequestHandler(withdraw_url, newAddr, function(response) {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Updated default_withdraw_address");
            handleResponse();
        }, function(error) {
            handleError();
        });
    },
    // Updates list of user's cards
    updateUsersCards: function(doneUpdating) {
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Resetting cards.");
        Account.getCards(function(cards) {
            Account.updateUsersCardsUI(cards, doneUpdating);
        });
    },
    clearOwl: function() {
        if(Account.owlSet) {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Clearing Owl");
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Owl size before:" + Account.owl.data("owlCarousel").owl.owlItems.length);

            var owlSize = Account.owl.data("owlCarousel").owl.owlItems.length;

            if (!owlSize) {
                return;
            }

            for(var i = 0; i < owlSize; i++) {
                __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Clearing Owl Item " + i);
                Account.owl.data('owlCarousel').removeItem();
            }
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Owl size after:" + Account.owl.data("owlCarousel").owl.owlItems.length);
        } else { Account.owlSet = true; }
    },
    getCards: function(callback) {
        user.getInfo("cards?brand_id=" + brand, function(all_card_info) {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"User's cards: " + JSON.stringify(all_card_info));

            /////////////////////////
            // Fake updating balances
//                for (var ic in all_card_info["cards"]) {
//                    var amt = 0;
//                    var num = "";
//                    if (typeof Account.all_cards[ic] === 'undefined') {
//                        amt = all_card_info["cards"][ic]["balance"][0]["amount"];
//                        num = all_card_info["cards"][ic]["code"];
//                    } else {
//                        amt = Account.all_cards[ic].bal;
//                        num = Account.all_cards[ic].num;
//                    }
//                    all_card_info["cards"][ic]["balance"][0]["amount"] = amt - 0.10;
//                    all_card_info["cards"][ic]["code"][0] = num + "h";
//                }
//
//                Account.numUpdates++;
//                if (Account.numUpdates == 5){
//                    all_card_info["cards"][0]["balance"][0]["amount"] = 1234.0;
//                    all_card_info["cards"][0]["code"][0] = "updated #1";
//                } else if (Account.numUpdates == 10) {
//                    all_card_info["cards"][1]["balance"][0]["amount"] = 2234.0;
//                    all_card_info["cards"][1]["code"][0] = "updated #2";
//                } else if (Account.numUpdates == 15) {
//                    all_card_info["cards"][2]["balance"][0]["amount"] = 3234.0;
//                    all_card_info["cards"][2]["code"][0] = "updated #3";
//                } else if (Account.numUpdates == 20) {
//                    all_card_info["cards"][3]["balance"][0]["amount"] = 4234.0;
//                    all_card_info["cards"][3]["code"][0] = "updated #4";
//                }
            /////////////////////////




            callback(all_card_info["cards"]);
        });
    },

    updateUsersCardsUI: function(cards, doneUpdating) { // Updates the UI with cards the user has purchased
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"updateUsersCardsUI: " + cards.length + " cards from all brands.");

        for (var c = 0; c < cards.length; c++) {
            // Check arrays values are defined
            if(typeof cards[c] === 'undefined') server_json_error = true;
            else if(typeof cards[c].id === 'undefined') server_json_error = true;
            else if(typeof cards[c].refundable === 'undefined') server_json_error = true;
            else if(typeof cards[c].code === 'undefined') server_json_error = true;
            else if(typeof cards[c].code[0] === 'undefined') server_json_error = true;
            else if(typeof cards[c].brand_id === 'undefined') server_json_error = true;
            else if(typeof cards[c].balance === 'undefined') server_json_error = true;
            else if(typeof cards[c].balance[0] === 'undefined') server_json_error = true;
            else if(typeof cards[c].balance[0]["amount"] === 'undefined') server_json_error = true;

            if (server_json_error == true) {
                doneUpdating();
                return;
            }
        }

        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"updateUsersCardsUI: brand: "+ brand + ": " + cards.length);
        if(!cards.length > 0) {
            var changed = Account.haveCardsChanged(cards);
            if(changed || (!Account.owlSet)) {
                Account.all_cards = [];
                __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"No cards. New acc!");
                if(typeof Account.owl.data("owlCarousel").owl === 'undefined') {
                    Account.setDummyCard();
                } else if(Account.owl.data("owlCarousel").owl.owlItems.length > 0) {
                    Account.setDummyCard();
                }
            }
        } else { // There's at least one card
            var changed = Account.haveCardsChanged(cards);

            if(changed == CardsChanged.YES) {
                __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"updateUsersCardsUI: brand: "+ brand + ": " + cards.length + " CARDS CHANGED");
                Account.all_cards = [];
                var needToClearOwl = true;

                var c = 0;
                for (c in cards) {

                    var card = new Card(
                            cards[c]["id"],
                            cards[c]["code"][0],
                            cards[c]["balance"][0]["amount"],// e.g. $5
                            cards[c]["refundable"]
                    );
                    Account.pingCard(card["id"]);
                    if (0 == c) {
                        Account.current_card_id = card["id"]; // Assign the current card to the first on the list
                    }
                    Account.all_cards[c] = card;
                    var tSource = $("#card-template").html();
                    var cardTemplate = Handlebars.compile(tSource);
                    if (!card.bal == 0) {
                        var floatBalance = parseFloat(card.bal);
                        //card_html.querySelector(".card-number").setAttribute("card", card.id);
                        var rText = "";
                        if (card.isRefundable /* && refund_enabled */) {
                            rText = "Refund Card"; // Make sure the info button shows up.
                        }
                        var thisCard = {
                            cardNumber: "<div class=\"card-number\" card=\"" + card.id + "\">" + card.num + "</div>",
                            cardAmount: "<div class=\"card-balance-amt\" card=\"" + card.id + "\">" + "$" + floatBalance.toFixed(2) + "</div>",
                            cardBarcode: "<img class=\"barcode \" src=\"" + fold_api + "my/cards/" + card.id + "/barcode/png" + "\"/>",
                            refundText: rText
                        }
                        var thisCardHTML = cardTemplate(thisCard);
                        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1, "Adding card: " + c + " card info: " + cards[c]);
                        if (needToClearOwl) {
                            Account.clearOwl();
                            needToClearOwl = false;
                        }

                        Account.owl.data('owlCarousel').addItem(thisCardHTML);
                        //document.querySelector("#user-cards").appendChild( document.importNode(card_html, true) );
                    }
                }
            } else if (changed == CardsChanged.VALUE_ONLY) {
                Account.all_cards = [];

                for (var c in cards) {
                    var card = new Card(
                            cards[c].id,
                            cards[c].code[0],
                            cards[c].balance[0].amount,// e.g. $5
                            cards[c].refundable
                    );
                    Account.all_cards[c] = card;

                    var amt = parseFloat(card.bal);
                    var amtString = "$" + amt.toFixed(2);

                    $("div.card-balance-amt[card=" + card.id + "]").text(amtString);
                    $("div.card-number[card=" + card.id + "]").text(card.num);
                }
            }
        }
        $('.materialboxed').materialbox();
        $(".card-refund").off().on('click', function() {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Refunding button");
            var thisCardId = $(this).parent().parent().children(".card-info-main").children(".card-balance-amt").attr("card");
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"This card: " + thisCardId);
            var thisCard = Account.getCardById(thisCardId);
            thisCard.refund();
        });
        doneUpdating();
    },
    haveCardsChanged: function(cards) { // Has different cards?
        var match = 0;
        if (force_refresh) {
            force_refresh = 0;
            return CardsChanged.YES;
        }
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"haveCardsChanged: oldcards:" + Account.all_cards.length + " newcards:" + cards.length);

        if(cards.length != Account.all_cards.length) {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"haveCardsChanged: return YES");
            return CardsChanged.YES;
        }
        var balance_changed = false;
        for(var ic in cards) {
            for(var iac in Account.all_cards) {
                if(cards[ic]["id"] == Account.all_cards[iac].id) {
                    match++;
                    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"haveCardsChanged: found id match:" + cards[ic]["id"]);
                    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"haveCardsChanged: oldbal:" + Account.all_cards[iac].bal);
                    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"haveCardsChanged: newbal:" + cards[ic]["balance"][0]["amount"]);
                    if(cards[ic]["balance"][0]["amount"] != Account.all_cards[ic].bal) {
                        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"haveCardsChanged: Balance changed card");
                        balance_changed = true;
                    }
                }
            }
        }

        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"haveCardsChanged: matched:" + match + " newlength:" + cards.length);
        if(match != cards.length) {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"haveCardsChanged: return YES");
            return CardsChanged.YES;
        }

        if (balance_changed) {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"haveCardsChanged: return VALUE_ONLY");
            return CardsChanged.VALUE_ONLY;
        } else {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"haveCardsChanged: return YES");
            return CardsChanged.NO;
        }
    },
    setLoadingCard: function() {
        var tSource = $("#card-template").html();
        var cardTemplate = Handlebars.compile(tSource);

        var thisCard = {
            cardNumber: "<div class=\"card-number\">" + "Loading..." + "</div>",
            cardAmount: "<div class=\"card-balance-amt\">" + "$0.00" + "</div>",
            cardBarcode: "",
            refundText: ""
        }
        var thisCardHTML = cardTemplate(thisCard);
        Account.clearOwl(); // Make sure there's only ever ONE grey card and no other cards at the same time.
        Account.owl.data('owlCarousel').addItem(thisCardHTML);
    },
    setDummyCard: function() {
        var tSource = $("#card-template").html();
        var cardTemplate = Handlebars.compile(tSource);

        var thisCard = {
            cardNumber: "<div class=\"card-number\">" + "6666 8888 4444 0000" + "</div>",
            cardAmount: "<div class=\"card-balance-amt\">" + "$0.00" + "</div>",
            cardBarcode: "<img class=\"barcode barcode-inactive\" src=\"https://airbitz.co/go/wp-content/uploads/2015/12/download.png\"/>",
            refundText: ""
        }
        var thisCardHTML = cardTemplate(thisCard);
        Account.clearOwl(); // Make sure there's only ever ONE grey card and no other cards at the same time.
        Account.owl.data('owlCarousel').addItem(thisCardHTML);
    },
    getCardById: function(cardId) {
        var cardFromId = Account.all_cards.filter(function( obj ) {
            return obj.id == cardId;
        });
        return cardFromId[0];
    },

    updateCardsForSale: function(doneListing) { // Updates the UI with cards avaliable to purchase from Fold.
        var numCardsToBuy = 0;
        this.getInfo("brands", function(cards_avil) {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,JSON.stringify(cards_avil) );
            var all_brands = cards_avil["brands"];
            var brands_cards = "";
            min_price_rate = 1.0;

            for(var ic in all_brands) {
                if(typeof all_brands[ic] === 'undefined') server_json_error = true;
                else if(typeof all_brands[ic]["id"] === 'undefined') server_json_error = true;
                else if(typeof all_brands[ic]["price_rate"] === 'undefined') server_json_error = true;
                else if(typeof all_brands[ic]["refund_enabled"] === 'undefined') server_json_error = true;

                if (server_json_error) break;

                if(all_brands[ic]["id"] == brand) {
                    if(parseFloat(all_brands[ic]["price_rate"]) < min_price_rate) {
                        min_price_rate = parseFloat(all_brands[ic]["price_rate"]);
                    }
                    refund_enabled = all_brands[ic]["refund_enabled"];

                    brands_cards = all_brands[ic];
                    break;
                }
            }
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"min_price_rate:" + min_price_rate);

            var maxDiscount = 100 * (1.0 - min_price_rate);
            maxDiscount = maxDiscount.toFixed(0);
            $(".brand-discount").text(maxDiscount + "%");

            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,JSON.stringify(brands_cards["card_values"]));
            user.getBal(function(total_bal) {
                user.total_bal = total_bal;
                if (brands_cards["soft_max_total"] && brands_cards["soft_max_total"].length > 0) {
                    var maxBal = parseInt(brands_cards["soft_max_total"][0]["amount"]);
                } else {
                    var maxBal = 0;
                }
                __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"User bal: " + user.total_bal);
                __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Max: " + maxBal);
                if(maxBal >= user.total_bal) {
                    var card_vals = brands_cards["card_values"];
                    $(".add-buttons").html(""); // Wipe out any cards that are currently there.
                    var addTemplateHtml = "";

                    if (card_vals) {
                      // Sort cards from lowest to highest
                      card_vals.sort(function(a, b){
                          return a["amount"] - b["amount"];
                      });

                      for(ic in card_vals) {
                          numCardsToBuy++;
                          var price_rate = parseFloat(card_vals[ic]["price_rate"]);

                          __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Listing card " + ic);
                          var source = $("#add-funds").html();
                          var addTemplate = Handlebars.compile(source);

                          var thisCard = {
                              cardValue: "<span class=\"card-value\" value=\"" + card_vals[ic]["amount"] + "\">" + card_vals[ic]["formatted"]["all_decimal_places"] + "</span>"
                          }
                          var addTemplateHtml = addTemplateHtml + addTemplate(thisCard);
                      }
                    }
                    $(".add-buttons").html(addTemplateHtml);
                    $(".buy-card").off().on('click', function() {
                        user.purchaseCard($(this).parent().parent().find(".card-value").attr("value"));
                    });
                }
                if (numCardsToBuy) {
                    $(".add-funds-header").text("Buy Gift Card");
                } else {
                    $(".add-funds-header").text("Sorry, no cards available");
                }

                doneListing();
            });
        }, "");
    },
    logRefunds: function() {
        Account.getInfo("refunds", function(refunds) {
            console.log(JSON.stringify(refunds));
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,JSON.stringify(refunds));
        });
    },
    getInfo: function(info, handleResponse, root) {
        root = typeof root !== 'undefined' ? root : "my/";
        $.get(fold_api + root + info).done(function(response) {
            handleResponse(response);
        });
    },
    getBal: function(handleResponse) { // Get total balance of user. Return 0 if user doesn't have bal.
        this.getInfo("balances?currency=USD", function(balances) {
            try {
                handleResponse(balances["balances"][0]["amount"]);
            }
            catch(err) {
                handleResponse(0);
            }
        });
    },
    purchaseCard: function(denomination, brand_id) {
        brand_id = typeof a !== 'undefined' ? a : brand;
        var newOrder = { "orders": [{
            "brand_id": String(brand_id),
            "value": { "amount": String(denomination), "currency": "USD" },
            "price": { "currency": "BTC" },
            "approved": true
        }],
            "cancel_all_others": true
        }
        var url = fold_api + "my/orders";
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Getting new order");
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert('', 'Creating Order', {'showSpinner': true});
        sRequestHandler(url, newOrder, function(r) {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Order: " + JSON.stringify(r));
            var amt = (r["orders"][0]["price"]["amount"] * 100000000);
            var toAddr = r["orders"][0]["payment"][0]["address"];
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Spending " + amt + " from wallet: " + user.abWallet + " to: " + toAddr);
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Fiat amt: " + denomination)
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].hideAlert();
            if (large_value_threshold < denomination) {
                __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("High Value Card", "You are purchasing a card over $50 in value. This requires one bitcoin network confirmation before your card will be available and may take over 10 minutes.");
            }
            var affiliateAmount = amt*affiliate_fee_percent;
            var tmpAddress = affiliate_address;
            if (affiliateAmount <= DUST) {
              affiliateAmount = 0;
              tmpAddress = null;
            }
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["b" /* core */].createSpendRequest2(Account.abWallet,
                    toAddr, amt, tmpAddress, affiliateAmount, {
                        label: brand,
                        category: category,
                        notes: brand + " $" + String(denomination) + " gift card.",
                        bizId: parseInt(bizId),
                        success: function(res) {
                            if (res && res.back) {
                                // User pressed backed button
                            } else {
                                __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("Card Purchased", "Card purchased. Your " + brand + " card should appear shortly.");
                                force_refresh = 1;
                                Account.clearOwl();
                                __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Funds were sent.");
                                logStats("purchase",brand,denomination);
                            }
                        },
                        error: function() {
                            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("Unable to send funds.", "Funds weren't sent");
                            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Funds were not sent.");
                        }
                    });
        }, function(error) {
            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("Server error", "Error making purchase. Please contact support");
        });
    }
}

function Card(id, num, bal, isRefundable) {
    isRefundable = typeof isRefundable !== 'undefined' ? isRefundable : false;
    this.id = id;
    this.num = num;
    this.bal = bal;
    this.isRefundable = isRefundable;
}

Card.prototype.refund = function() {
    if(this.isRefundable) {
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert('', 'Refunding card...', {'showSpinner': true});
        var url = fold_api + "my/refunds";
        var thisCard = this;
        var balance = this.bal;
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Refunding card " + this.id + " amount: " + this.bal);
        var refund = {"refunds": [{
            "card_id": this.id
        }]};
        createAddress(Account.abWallet, brand, 0, 0, category, "Refunded " + brand + " gift card.",
                function(data) {
                    Account.updateWAddr(data["address"], function() {
                        sRequestHandler(url, refund, function(response) {
                            Account.clearOwl();
                            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("Card Refunded", "Card Refunded. Please allow 8-15 minutes for refund.");
                            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,response);
                            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Done refunding!");
                            logStats("refund",brand,balance);
                            force_refresh = 1;
                        }, function(error) {
                            __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("Card Not Refunded", "Error refunding card. Please try again later. Error:sRequestHandler:refund");
                        });
                    }, function() {
                        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("Card Not Refunded", "Error refunding card. Please try again later. Error:updateWAddr");
                    });
                }, function(data) {
                    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("Card Not Refunded", "Error refunding card. Please try again later. Error:createAddress");
                    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,data);
                });

    } else {
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert('', 'Card is not refundable');
    }
}

Card.prototype.remove = function() { // Remove card from UI
    if(this.bal == 0) {

    }
}

Card.prototype.mockBal = function(bal) {
    var url = fold_api + "my/mock/cards";
    var thisCard = this;
    $.post(url,
            {"cards": [{
                "id": thisCard.id.toString(),
                "balance_amount": bal.toString()
            }]}
    ).done(function() {
        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Done mocking " + thisCard.id + " balance to: " + bal);
    });
}

// Main
var user = Object.create(Account);

__WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["b" /* core */].setupWalletChangeListener(updateWallet);
Account.username = __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["b" /* core */].readData("fold-username");
Account.pass = __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["b" /* core */].readData("fold-pass");
__WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert('', 'Loading account...', {
    'showSpinner': true
});

function main() {
  if(!(typeof Account.username === 'undefined' || Account.username == null)) {
      Account.creds = {"users": [{
          "username": Account.username,
          "password": Account.pass
      }]};
      __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"User pulled from memory.");
      user.exists.resolve();
  } else {
      user.create();
  }
  $.when(user.exists).done(function(data) {
      user.login();
  });
  $.when(user.logged_in).done(function(data) {
      __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Logged in");
      Account.owl.owlCarousel({ // Activate owl Carousel for cards.
          //navigation : true, // Show next and prev buttons
          slideSpeed : 300,
          paginationSpeed : 400,
          singleItem:true,
          afterMove: function(elem) {
              var current = this.currentItem;
              var card = elem.find(".owl-item").eq(current).find(".card-balance-amt").attr('card');
              __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Current card is " + card);
              Account.current_card_id = card;
              Account.pingCard(card);
          }

          // "singleItem:true" is a shortcut for:
          // items : 1,
          // itemsDesktop : false,
          // itemsDesktopSmall : false,
          // itemsTablet: false,
          // itemsMobile : false
      });
      Account.setLoadingCard();

//      Account.logRefunds();
      __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["b" /* core */].getSelectedWallet({
          success: function(wallet) {
            updateWallet(wallet);
            var withdrawal_address = __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["b" /* core */].readData("withdrawal-address");

            // If this is a new account. Set an initial refund address in case any purchases get botched
            if (!withdrawal_address || withdrawal_address.length < 20) {
                createAddress(Account.abWallet, brand, 0, 0, category, "Refunded " + brand + " gift card.", function(data) {
                    Account.updateWAddr(data["address"], function() {
                        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Setting withdrawal address:" + data["address"]);
                        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["b" /* core */].writeData("withdrawal-address", data["address"]);
                    }, function() {
                        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"WARNING: could not set withdrawal address");
                        __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,data);
                    });
                }, function(data) {
                    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,data);
                });
            } else {
                __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Withdrawal address already set:" + withdrawal_address);
            }
          },
          error: function() {
              __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Could not get selected wallet");
              __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("Wallet Error", "Error could not select wallet.");
          }
      });

      __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Updating UI");
      __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].hideAlert();

      updateAllCards();
      toggleUi();

      user.getInfo("profile", function(response) {
          //ui.debugLevel(1,response);
          //ui.debugLevel(1,response["logged_in"]);
          user.getInfo("orders", function(response) {
              //ui.debugLevel(1,response);
          });
          // Done loading.
      });
  });
  // UI stuff
  __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"logo: " + logo_url);
  $(".brand-name").text(brand);

  if (server_json_error) {
      __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("Server Response Error", "Error in Server response. Please contact support");
      __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1,"Error in Server response. Please contact support");
  }

  $(".brand-logo").attr("src", logo_url);
  $(".user-creds").html("Username: " + Account.username  + "<br>Password: " + Account.pass);
  $(".support-mail-link").html("<a href=\"mailto:support@foldapp.com?subject=Support%20Requested&body=" + "Username:" + Account.username + "\">support@foldapp.com.</a>");
}

window.onerror = function(message) {
  __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("Internal error", "Service is unavailable at this time. Please try again later.");
  __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].exit();
  __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1, message);
}

$(function() {
  try {
    main();
  } catch (e) {
    // handle any rogue exceptions
    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].showAlert("Internal error", "Service is unavailable at this time. Please try again later.");
    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].exit();
    __WEBPACK_IMPORTED_MODULE_0_airbitz_libplugin__["c" /* ui */].debugLevel(1, e.toString());
  }
});


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__core_js__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__config_js__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ui_js__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__utils_js__ = __webpack_require__(6);
/* harmony reexport (module object) */ __webpack_require__.d(__webpack_exports__, "b", function() { return __WEBPACK_IMPORTED_MODULE_0__core_js__; });
/* harmony reexport (module object) */ __webpack_require__.d(__webpack_exports__, "a", function() { return __WEBPACK_IMPORTED_MODULE_1__config_js__; });
/* harmony reexport (module object) */ __webpack_require__.d(__webpack_exports__, "c", function() { return __WEBPACK_IMPORTED_MODULE_2__ui_js__; });
/* unused harmony reexport utils */







/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["bitidAddress"] = bitidAddress;
/* harmony export (immutable) */ __webpack_exports__["bitidSignature"] = bitidSignature;
/* harmony export (immutable) */ __webpack_exports__["getSelectedWallet"] = getSelectedWallet;
/* harmony export (immutable) */ __webpack_exports__["wallets"] = wallets;
/* harmony export (immutable) */ __webpack_exports__["createReceiveRequest"] = createReceiveRequest;
/* harmony export (immutable) */ __webpack_exports__["finalizeReceiveRequest"] = finalizeReceiveRequest;
/* harmony export (immutable) */ __webpack_exports__["createSpendRequest"] = createSpendRequest;
/* harmony export (immutable) */ __webpack_exports__["createSpendRequest2"] = createSpendRequest2;
/* harmony export (immutable) */ __webpack_exports__["requestSign"] = requestSign;
/* harmony export (immutable) */ __webpack_exports__["broadcastTx"] = broadcastTx;
/* harmony export (immutable) */ __webpack_exports__["saveTx"] = saveTx;
/* harmony export (immutable) */ __webpack_exports__["writeData"] = writeData;
/* harmony export (immutable) */ __webpack_exports__["clearData"] = clearData;
/* harmony export (immutable) */ __webpack_exports__["getAffiliateInfo"] = getAffiliateInfo;
/* harmony export (immutable) */ __webpack_exports__["getBtcDenomination"] = getBtcDenomination;
/* harmony export (immutable) */ __webpack_exports__["satoshiToCurrency"] = satoshiToCurrency;
/* harmony export (immutable) */ __webpack_exports__["currencyToSatoshi"] = currencyToSatoshi;
/* harmony export (immutable) */ __webpack_exports__["formatSatoshi"] = formatSatoshi;
/* harmony export (immutable) */ __webpack_exports__["formatCurrency"] = formatCurrency;
/* harmony export (immutable) */ __webpack_exports__["setupWalletChangeListener"] = setupWalletChangeListener;
/* harmony export (immutable) */ __webpack_exports__["setDenominationChangeListener"] = setDenominationChangeListener;
/* harmony export (immutable) */ __webpack_exports__["removeExchangeRateListener"] = removeExchangeRateListener;
/* harmony export (immutable) */ __webpack_exports__["addExchangeRateListener"] = addExchangeRateListener;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__bridge_js__ = __webpack_require__(0);


/**
 * Returns a bitid address for the given uri and message
 * @return {string} bitid address
 */
function bitidAddress(uri, message) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({
    func:'bitidAddress', uri:uri, message:message
  })
}

/**
 * Returns a bitid signature for the given uri and message
 * @return {string} bitid signature
 */
function bitidSignature(uri, message) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({func:'bitidSignature', uri:uri, message:message})
}

/**
 * Returns the user's currently selected wallet
 * @return promise
 */
function getSelectedWallet(options) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({func:'getSelectedWallet', options:options})
}

/**
 * Returns a list of the wallets for this account, included archived wallets
 * @return {object} an array of wallets
 */
function wallets(options) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({func:'wallets', options:options})
}

/**
 * Create a receive request from the provided wallet.
 * @param {object} wallet - the wallet object
 * @return {object} an object with an address and requestId
 */
function createReceiveRequest(wallet, options) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({func:'createReceiveRequest', wallet:wallet, options:options})
}

/**
 * Finalizing a request marks the address as used and it will not be used for
 * future requests. The metadata will also be written for this address.  This
 * is useful so that when a future payment comes in, the metadata can be
 * auto-populated.
 * @return true if the request was successfully finalized.
 * @param {object} wallet - the wallet object
 * @param {string} requestId - the bitcoin address to finalize
 */
function finalizeReceiveRequest(wallet, requestId) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({func:'finalizeReceiveRequest', wallet:wallet, requestId:requestId})
}

/**
 * Request that the user spends.
 * @param {object} wallet - the wallet object
 * @param {string} toAddress - the recipient address
 * @param {number} amountSatoshi - how many satoshis to spend
 */
function createSpendRequest(wallet, toAddress, amountSatoshi, options) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({
    func:'createSpendRequest',
    wallet:wallet,toAddress:toAddress, 
    amountSatoshi:amountSatoshi, options:options
  })
}

/**
 * Request that the user spends to 2 outputs.
 * @param {object} wallet - the wallet object
 * @param {string} toAddress - the recipient address
 * @param {number} amountSatoshi - how many satoshis to spend
 * @param {string} toAddress2 - the recipient address
 * @param {number} amountSatoshi2 - how many satoshis to spend
 */
function createSpendRequest2(wallet, toAddress, amountSatoshi, toAddress2, amountSatoshi2, options) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({
    func:'createSpendRequest2',
    wallet:wallet,
    toAddress:toAddress, amountSatoshi:amountSatoshi, 
    toAddress2:toAddress2, amountSatoshi2:amountSatoshi2, 
    options:options
  })
}

/**
 * Rquest that the user creates and signs a transaction
 * @param {object} wallet - the wallet object
 * @param {string} toAddress - the recipient address
 * @param {number} amountSatoshi - how many satoshis to spend
 * @param {amountFiat} amountFiat - not required, but the fiat value at the time of the request
 */
function requestSign(wallet, toAddress, amountSatoshi, amountFiat, options) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({
    func:'requestSign',
    wallet:wallet,
    toAddress:toAddress, amountSatoshi:amountSatoshi, 
    toAddress2:toAddress2, amountSatoshi2:amountSatoshi2, 
    options:options
  })
}

/**
 * Broadcast a transaction to the bitcoin network.
 * @param {object} the wallet object
 * @param {string} the raw hex to be saved to the database
 */
function broadcastTx(wallet, rawtx) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({
    func:'broadcastTx',
    wallet:wallet,
    rawtx:rawtx
  })
}

/**
 * Save the transaction to transaction database This should only be called if
 * the transaction has been successfully broadcasted, either by using
 * #Airbitz.core.broadcastTx or by a third party.
 * @param {object} the wallet object
 * @param {string} the raw hex to be saved to the database
 */
function saveTx(wallet, rawtx) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({
    func:'saveTx',
    wallet:wallet,
    rawtx:rawtx
  })
}

/**
 * Launches the native OS's camera or file browser so the user can select a
 * file. The options.success callback will be triggered when complete.
 */
function requestFile(options) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({
    func:'requestFile',
    options:options
  })
}

/**
 * Securely persist data into the Airbitz core. Only the current plugin will
 * have access to that data.
 * @param {string} key - the key to access the data in the future
 * @param {object} data - the data to write, which will be encrypted and backed up
 */
function writeData(key, data) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({
    func:'writeData',
    key:key,
    data:data,
  })
}

/**
 * Clear all data in the Airbitz core, for the current plugin.
 */
function clearData() {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({func:'clearData'})
}

/**
 * Read the securely stored data from disk.
 * @param {string} key - the key to access the data.
 */
function readData(key) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({func:'readData', key:key})
}

/**
 * There is affiliate data only if the account was installed via an affiliate
 * link.
 * @return {object} dictionary of affiliate data
 */
function getAffiliateInfo() {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({func:'getAffiliateInfo'})
}

/**
 * Get the user's currently selected BTC denomination. It can be BTC, mBTC or
 * bits.
 * @return {string} a denomination string
 */
function getBtcDenomination() {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({func:'getBtcDenomination'})
}

/**
 * Convert satoshis to a fiat currency value.
 * @param {number} satoshis - the satoshi to convert
 * @param {number} currencyNum - the ISO 3166 currency code
 * @return {number} the converted fiat value
 */
function satoshiToCurrency(satoshi, currencyNum) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({
    func:'satoshiToCurrency',
    satoshi:satoshi,
    currencyNum:currencyNum
  })
}

/**
 * Convert a fiat currency value to a satoshi value.
 * @param {number} currency - the fiat currency to convert
 * @param {number} currencyNum - the ISO 3166 currency code
 * @return {number} the converted satoshi value
 */
function currencyToSatoshi(currency, currencyNum) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({
    func:'satoshiToCurrency',
    satoshi:satoshi,
    currencyNum:currencyNum
  })
}

/**
 * Formats satoshis to display to the user. This uses the user's BTC
 * denomination to format including the correct code and symbol.
 * @param {number} satoshi - the satoshi value to format
 * @param {boolean} withSymbol - whether to include a currency symbol when formatting
 * @return {string} the formatted satoshi value in either BTC, mBTC or bits.
 */
function formatSatoshi(satoshi, withSymbol) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({
    func:'formatSatoshi',
    satoshi:satoshi,
    withSymbol:withSymbol,
  })
}

/**
 * Formats currencies to display to the user. This uses the user's BTC
 * denomination to format including the correct code and symbol.
 * @param {number} currency - the satoshi value to format
 * @param {boolean} withSymbol - whether to include a currency symbol when formatting
 * @return {string} the formatted satoshi value in either BTC, mBTC or bits.
 */
function formatCurrency(currency, currencyNum, withSymbol) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({
    func:'formatCurrency',
    currency:currency,
    currencyNum:currencyNum,
    withSymbol:withSymbol,
  })
}

/**
 * Callback is called when wallet is changed AND every time plugin is created.
 * @param {function} callback - a function that will be called when the user
 * changes their currently selected wallet.
 */
function setupWalletChangeListener(callback) {
  /* TODO */
}

/**
 * Callback is called when the user has changed their BTC denomination.
 * @param {function} callback - a function that will be called when the user
 * changes their BTC denomination.
 */
function setDenominationChangeListener(callback) {
  /* TODO */
}

/**
 * Removes an exchange rate listener for a currency number
 * @param {number} currencyNum - the currency number
 * @param {function} callback - the callback to remove
 */
function removeExchangeRateListener(currencyNum, callback) {
  /* TODO */
}

/**
 * Add an exchange rate listener that will be called when the exchange rate
 * is updated.
 * @param {number} currencyNum - the currency number
 * @param {function} callback - the callback to respond to exchange rate updes
 */
function addExchangeRateListener (currencyNum, callback) {
  /* TODO */
}



/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["get"] = get;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__bridge_js__ = __webpack_require__(0);


/**
 * Fetch a configuration value. These are set in the native code, before the
 * webview is every loaded.
 * @param {key} key - the configuration key to fetch a value for
 * @return Promise with either string value on success or err on failure
 */
function get(key) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__bridge_js__["a" /* postWrapper */])({func:'get', key:key})
}



/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["showAlert"] = showAlert;
/* harmony export (immutable) */ __webpack_exports__["hideAlert"] = hideAlert;
/* harmony export (immutable) */ __webpack_exports__["title"] = title;
/* harmony export (immutable) */ __webpack_exports__["debugLevel"] = debugLevel;
/* harmony export (immutable) */ __webpack_exports__["back"] = back;
/* harmony export (immutable) */ __webpack_exports__["exit"] = exit;
/* harmony export (immutable) */ __webpack_exports__["launchExternal"] = launchExternal;
/* harmony export (immutable) */ __webpack_exports__["navStackClear"] = navStackClear;
/* harmony export (immutable) */ __webpack_exports__["navStackPush"] = navStackPush;
/* harmony export (immutable) */ __webpack_exports__["navStackPop"] = navStackPop;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__bridge_js__ = __webpack_require__(0);



/**
 * Launches a native alert dialog.
 * @param {string} title - the dialog title
 * @param {string} message - the message body of the dialog
 */
function showAlert(title, message, options) {
}

/**
 * Hide an alerts that are currently displayed.
 */
function hideAlert(title, message, options) {
}

/**
 * Set the title of the current view. This updates the native apps titlebar.
 * @param {string} title - the title string
 */
function title(s) {
}

/**
 * Log messages to the ABC core at a particular level.
 * @param {number} level - ERROR = 0, WARNING = 1, INFO = 2, DEBUG = 3;
 */
function debugLevel(level, text) {
}

/**
 * Go back in the navigation stack. 
 */
function back() {
}

/**
 * Exit the plugin. This pops the current fragment or view controller of the
 * stack and destroys the webview.
 */
function exit() {
}

/**
 * Launch an external web page or application.
 * @param {string} uri - the uri or url to open in a different app.
 */
function launchExternal(uri) {
}


/**
 * Clear the naviation stack. Helpful when overriding the behavior of the
 * back button.
 */
function navStackClear() {
}

/**
 * Push a new URL onto the nav stack.
 */
function navStackPush(path) {
}

/**
 * Pop a URL off the nav stack.
 */
function navStackPop() {
}


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
const COUNTRY_LIST = [
  {"name":"Afghanistan","codeAlpha3":"AFG","country-code":"004"},
  {"name":"Åland Islands","codeAlpha3":"ALA","country-code":"248"},
  {"name":"Albania","codeAlpha3":"ALB","country-code":"008"},
  {"name":"Algeria","codeAlpha3":"DZA","country-code":"012"},
  {"name":"American Samoa","codeAlpha3":"ASM","country-code":"016"},
  {"name":"Andorra","codeAlpha3":"AND","country-code":"020"},
  {"name":"Angola","codeAlpha3":"AGO","country-code":"024"},
  {"name":"Anguilla","codeAlpha3":"AIA","country-code":"660"},
  {"name":"Antarctica","codeAlpha3":"ATA","country-code":"010"},
  {"name":"Antigua and Barbuda","codeAlpha3":"ATG","country-code":"028"},
  {"name":"Argentina","codeAlpha3":"ARG","country-code":"032"},
  {"name":"Armenia","codeAlpha3":"ARM","country-code":"051"},
  {"name":"Aruba","codeAlpha3":"ABW","country-code":"533"},
  {"name":"Australia","codeAlpha3":"AUS","country-code":"036"},
  {"name":"Austria","codeAlpha3":"AUT","country-code":"040"},
  {"name":"Azerbaijan","codeAlpha3":"AZE","country-code":"031"},
  {"name":"Bahamas","codeAlpha3":"BHS","country-code":"044"},
  {"name":"Bahrain","codeAlpha3":"BHR","country-code":"048"},
  {"name":"Bangladesh","codeAlpha3":"BGD","country-code":"050"},
  {"name":"Barbados","codeAlpha3":"BRB","country-code":"052"},
  {"name":"Belarus","codeAlpha3":"BLR","country-code":"112"},
  {"name":"Belgium","codeAlpha3":"BEL","country-code":"056"},
  {"name":"Belize","codeAlpha3":"BLZ","country-code":"084"},
  {"name":"Benin","codeAlpha3":"BEN","country-code":"204"},
  {"name":"Bermuda","codeAlpha3":"BMU","country-code":"060"},
  {"name":"Bhutan","codeAlpha3":"BTN","country-code":"064"},
  {"name":"Bolivia (Plurinational State of)","codeAlpha3":"BOL","country-code":"068"},
  {"name":"Bonaire, Sint Eustatius and Saba","codeAlpha3":"BES","country-code":"535"},
  {"name":"Bosnia and Herzegovina","codeAlpha3":"BIH","country-code":"070"},
  {"name":"Botswana","codeAlpha3":"BWA","country-code":"072"},
  {"name":"Bouvet Island","codeAlpha3":"BVT","country-code":"074"},
  {"name":"Brazil","codeAlpha3":"BRA","country-code":"076"},
  {"name":"British Indian Ocean Territory","codeAlpha3":"IOT","country-code":"086"},
  {"name":"Brunei Darussalam","codeAlpha3":"BRN","country-code":"096"},
  {"name":"Bulgaria","codeAlpha3":"BGR","country-code":"100"},
  {"name":"Burkina Faso","codeAlpha3":"BFA","country-code":"854"},
  {"name":"Burundi","codeAlpha3":"BDI","country-code":"108"},
  {"name":"Cambodia","codeAlpha3":"KHM","country-code":"116"},
  {"name":"Cameroon","codeAlpha3":"CMR","country-code":"120"},
  {"name":"Canada","codeAlpha3":"CAN","country-code":"124"},
  {"name":"Cabo Verde","codeAlpha3":"CPV","country-code":"132"},
  {"name":"Cayman Islands","codeAlpha3":"CYM","country-code":"136"},
  {"name":"Central African Republic","codeAlpha3":"CAF","country-code":"140"},
  {"name":"Chad","codeAlpha3":"TCD","country-code":"148"},
  {"name":"Chile","codeAlpha3":"CHL","country-code":"152"},
  {"name":"China","codeAlpha3":"CHN","country-code":"156"},
  {"name":"Christmas Island","codeAlpha3":"CXR","country-code":"162"},
  {"name":"Cocos (Keeling) Islands","codeAlpha3":"CCK","country-code":"166"},
  {"name":"Colombia","codeAlpha3":"COL","country-code":"170"},
  {"name":"Comoros","codeAlpha3":"COM","country-code":"174"},
  {"name":"Congo","codeAlpha3":"COG","country-code":"178"},
  {"name":"Congo (Democratic Republic of the)","codeAlpha3":"COD","country-code":"180"},
  {"name":"Cook Islands","codeAlpha3":"COK","country-code":"184"},
  {"name":"Costa Rica","codeAlpha3":"CRI","country-code":"188"},
  {"name":"Côte d'Ivoire","codeAlpha3":"CIV","country-code":"384"},
  {"name":"Croatia","codeAlpha3":"HRV","country-code":"191"},
  {"name":"Cuba","codeAlpha3":"CUB","country-code":"192"},
  {"name":"Curaçao","codeAlpha3":"CUW","country-code":"531"},
  {"name":"Cyprus","codeAlpha3":"CYP","country-code":"196"},
  {"name":"Czech Republic","codeAlpha3":"CZE","country-code":"203"},
  {"name":"Denmark","codeAlpha3":"DNK","country-code":"208"},
  {"name":"Djibouti","codeAlpha3":"DJI","country-code":"262"},
  {"name":"Dominica","codeAlpha3":"DMA","country-code":"212"},
  {"name":"Dominican Republic","codeAlpha3":"DOM","country-code":"214"},
  {"name":"Ecuador","codeAlpha3":"ECU","country-code":"218"},
  {"name":"Egypt","codeAlpha3":"EGY","country-code":"818"},
  {"name":"El Salvador","codeAlpha3":"SLV","country-code":"222"},
  {"name":"Equatorial Guinea","codeAlpha3":"GNQ","country-code":"226"},
  {"name":"Eritrea","codeAlpha3":"ERI","country-code":"232"},
  {"name":"Estonia","codeAlpha3":"EST","country-code":"233"},
  {"name":"Ethiopia","codeAlpha3":"ETH","country-code":"231"},
  {"name":"Falkland Islands (Malvinas)","codeAlpha3":"FLK","country-code":"238"},
  {"name":"Faroe Islands","codeAlpha3":"FRO","country-code":"234"},
  {"name":"Fiji","codeAlpha3":"FJI","country-code":"242"},
  {"name":"Finland","codeAlpha3":"FIN","country-code":"246"},
  {"name":"France","codeAlpha3":"FRA","country-code":"250"},
  {"name":"French Guiana","codeAlpha3":"GUF","country-code":"254"},
  {"name":"French Polynesia","codeAlpha3":"PYF","country-code":"258"},
  {"name":"French Southern Territories","codeAlpha3":"ATF","country-code":"260"},
  {"name":"Gabon","codeAlpha3":"GAB","country-code":"266"},
  {"name":"Gambia","codeAlpha3":"GMB","country-code":"270"},
  {"name":"Georgia","codeAlpha3":"GEO","country-code":"268"},
  {"name":"Germany","codeAlpha3":"DEU","country-code":"276"},
  {"name":"Ghana","codeAlpha3":"GHA","country-code":"288"},
  {"name":"Gibraltar","codeAlpha3":"GIB","country-code":"292"},
  {"name":"Greece","codeAlpha3":"GRC","country-code":"300"},
  {"name":"Greenland","codeAlpha3":"GRL","country-code":"304"},
  {"name":"Grenada","codeAlpha3":"GRD","country-code":"308"},
  {"name":"Guadeloupe","codeAlpha3":"GLP","country-code":"312"},
  {"name":"Guam","codeAlpha3":"GUM","country-code":"316"},
  {"name":"Guatemala","codeAlpha3":"GTM","country-code":"320"},
  {"name":"Guernsey","codeAlpha3":"GGY","country-code":"831"},
  {"name":"Guinea","codeAlpha3":"GIN","country-code":"324"},
  {"name":"Guinea-Bissau","codeAlpha3":"GNB","country-code":"624"},
  {"name":"Guyana","codeAlpha3":"GUY","country-code":"328"},
  {"name":"Haiti","codeAlpha3":"HTI","country-code":"332"},
  {"name":"Heard Island and McDonald Islands","codeAlpha3":"HMD","country-code":"334"},
  {"name":"Holy See","codeAlpha3":"VAT","country-code":"336"},
  {"name":"Honduras","codeAlpha3":"HND","country-code":"340"},
  {"name":"Hong Kong","codeAlpha3":"HKG","country-code":"344"},
  {"name":"Hungary","codeAlpha3":"HUN","country-code":"348"},
  {"name":"Iceland","codeAlpha3":"ISL","country-code":"352"},
  {"name":"India","codeAlpha3":"IND","country-code":"356"},
  {"name":"Indonesia","codeAlpha3":"IDN","country-code":"360"},
  {"name":"Iran (Islamic Republic of)","codeAlpha3":"IRN","country-code":"364"},
  {"name":"Iraq","codeAlpha3":"IRQ","country-code":"368"},
  {"name":"Ireland","codeAlpha3":"IRL","country-code":"372"},
  {"name":"Isle of Man","codeAlpha3":"IMN","country-code":"833"},
  {"name":"Israel","codeAlpha3":"ISR","country-code":"376"},
  {"name":"Italy","codeAlpha3":"ITA","country-code":"380"},
  {"name":"Jamaica","codeAlpha3":"JAM","country-code":"388"},
  {"name":"Japan","codeAlpha3":"JPN","country-code":"392"},
  {"name":"Jersey","codeAlpha3":"JEY","country-code":"832"},
  {"name":"Jordan","codeAlpha3":"JOR","country-code":"400"},
  {"name":"Kazakhstan","codeAlpha3":"KAZ","country-code":"398"},
  {"name":"Kenya","codeAlpha3":"KEN","country-code":"404"},
  {"name":"Kiribati","codeAlpha3":"KIR","country-code":"296"},
  {"name":"Korea (Democratic People's Republic of)","codeAlpha3":"PRK","country-code":"408"},
  {"name":"Korea (Republic of)","codeAlpha3":"KOR","country-code":"410"},
  {"name":"Kuwait","codeAlpha3":"KWT","country-code":"414"},
  {"name":"Kyrgyzstan","codeAlpha3":"KGZ","country-code":"417"},
  {"name":"Lao People's Democratic Republic","codeAlpha3":"LAO","country-code":"418"},
  {"name":"Latvia","codeAlpha3":"LVA","country-code":"428"},
  {"name":"Lebanon","codeAlpha3":"LBN","country-code":"422"},
  {"name":"Lesotho","codeAlpha3":"LSO","country-code":"426"},
  {"name":"Liberia","codeAlpha3":"LBR","country-code":"430"},
  {"name":"Libya","codeAlpha3":"LBY","country-code":"434"},
  {"name":"Liechtenstein","codeAlpha3":"LIE","country-code":"438"},
  {"name":"Lithuania","codeAlpha3":"LTU","country-code":"440"},
  {"name":"Luxembourg","codeAlpha3":"LUX","country-code":"442"},
  {"name":"Macao","codeAlpha3":"MAC","country-code":"446"},
  {"name":"Macedonia (the former Yugoslav Republic of)","codeAlpha3":"MKD","country-code":"807"},
  {"name":"Madagascar","codeAlpha3":"MDG","country-code":"450"},
  {"name":"Malawi","codeAlpha3":"MWI","country-code":"454"},
  {"name":"Malaysia","codeAlpha3":"MYS","country-code":"458"},
  {"name":"Maldives","codeAlpha3":"MDV","country-code":"462"},
  {"name":"Mali","codeAlpha3":"MLI","country-code":"466"},
  {"name":"Malta","codeAlpha3":"MLT","country-code":"470"},
  {"name":"Marshall Islands","codeAlpha3":"MHL","country-code":"584"},
  {"name":"Martinique","codeAlpha3":"MTQ","country-code":"474"},
  {"name":"Mauritania","codeAlpha3":"MRT","country-code":"478"},
  {"name":"Mauritius","codeAlpha3":"MUS","country-code":"480"},
  {"name":"Mayotte","codeAlpha3":"MYT","country-code":"175"},
  {"name":"Mexico","codeAlpha3":"MEX","country-code":"484"},
  {"name":"Micronesia (Federated States of)","codeAlpha3":"FSM","country-code":"583"},
  {"name":"Moldova (Republic of)","codeAlpha3":"MDA","country-code":"498"},
  {"name":"Monaco","codeAlpha3":"MCO","country-code":"492"},
  {"name":"Mongolia","codeAlpha3":"MNG","country-code":"496"},
  {"name":"Montenegro","codeAlpha3":"MNE","country-code":"499"},
  {"name":"Montserrat","codeAlpha3":"MSR","country-code":"500"},
  {"name":"Morocco","codeAlpha3":"MAR","country-code":"504"},
  {"name":"Mozambique","codeAlpha3":"MOZ","country-code":"508"},
  {"name":"Myanmar","codeAlpha3":"MMR","country-code":"104"},
  {"name":"Namibia","codeAlpha3":"NAM","country-code":"516"},
  {"name":"Nauru","codeAlpha3":"NRU","country-code":"520"},
  {"name":"Nepal","codeAlpha3":"NPL","country-code":"524"},
  {"name":"Netherlands","codeAlpha3":"NLD","country-code":"528"},
  {"name":"New Caledonia","codeAlpha3":"NCL","country-code":"540"},
  {"name":"New Zealand","codeAlpha3":"NZL","country-code":"554"},
  {"name":"Nicaragua","codeAlpha3":"NIC","country-code":"558"},
  {"name":"Niger","codeAlpha3":"NER","country-code":"562"},
  {"name":"Nigeria","codeAlpha3":"NGA","country-code":"566"},
  {"name":"Niue","codeAlpha3":"NIU","country-code":"570"},
  {"name":"Norfolk Island","codeAlpha3":"NFK","country-code":"574"},
  {"name":"Northern Mariana Islands","codeAlpha3":"MNP","country-code":"580"},
  {"name":"Norway","codeAlpha3":"NOR","country-code":"578"},
  {"name":"Oman","codeAlpha3":"OMN","country-code":"512"},
  {"name":"Pakistan","codeAlpha3":"PAK","country-code":"586"},
  {"name":"Palau","codeAlpha3":"PLW","country-code":"585"},
  {"name":"Palestine, State of","codeAlpha3":"PSE","country-code":"275"},
  {"name":"Panama","codeAlpha3":"PAN","country-code":"591"},
  {"name":"Papua New Guinea","codeAlpha3":"PNG","country-code":"598"},
  {"name":"Paraguay","codeAlpha3":"PRY","country-code":"600"},
  {"name":"Peru","codeAlpha3":"PER","country-code":"604"},
  {"name":"Philippines","codeAlpha3":"PHL","country-code":"608"},
  {"name":"Pitcairn","codeAlpha3":"PCN","country-code":"612"},
  {"name":"Poland","codeAlpha3":"POL","country-code":"616"},
  {"name":"Portugal","codeAlpha3":"PRT","country-code":"620"},
  {"name":"Puerto Rico","codeAlpha3":"PRI","country-code":"630"},
  {"name":"Qatar","codeAlpha3":"QAT","country-code":"634"},
  {"name":"Réunion","codeAlpha3":"REU","country-code":"638"},
  {"name":"Romania","codeAlpha3":"ROU","country-code":"642"},
  {"name":"Russian Federation","codeAlpha3":"RUS","country-code":"643"},
  {"name":"Rwanda","codeAlpha3":"RWA","country-code":"646"},
  {"name":"Saint Barthélemy","codeAlpha3":"BLM","country-code":"652"},
  {"name":"Saint Helena, Ascension and Tristan da Cunha","codeAlpha3":"SHN","country-code":"654"},
  {"name":"Saint Kitts and Nevis","codeAlpha3":"KNA","country-code":"659"},
  {"name":"Saint Lucia","codeAlpha3":"LCA","country-code":"662"},
  {"name":"Saint Martin (French part)","codeAlpha3":"MAF","country-code":"663"},
  {"name":"Saint Pierre and Miquelon","codeAlpha3":"SPM","country-code":"666"},
  {"name":"Saint Vincent and the Grenadines","codeAlpha3":"VCT","country-code":"670"},
  {"name":"Samoa","codeAlpha3":"WSM","country-code":"882"},
  {"name":"San Marino","codeAlpha3":"SMR","country-code":"674"},
  {"name":"Sao Tome and Principe","codeAlpha3":"STP","country-code":"678"},
  {"name":"Saudi Arabia","codeAlpha3":"SAU","country-code":"682"},
  {"name":"Senegal","codeAlpha3":"SEN","country-code":"686"},
  {"name":"Serbia","codeAlpha3":"SRB","country-code":"688"},
  {"name":"Seychelles","codeAlpha3":"SYC","country-code":"690"},
  {"name":"Sierra Leone","codeAlpha3":"SLE","country-code":"694"},
  {"name":"Singapore","codeAlpha3":"SGP","country-code":"702"},
  {"name":"Sint Maarten (Dutch part)","codeAlpha3":"SXM","country-code":"534"},
  {"name":"Slovakia","codeAlpha3":"SVK","country-code":"703"},
  {"name":"Slovenia","codeAlpha3":"SVN","country-code":"705"},
  {"name":"Solomon Islands","codeAlpha3":"SLB","country-code":"090"},
  {"name":"Somalia","codeAlpha3":"SOM","country-code":"706"},
  {"name":"South Africa","codeAlpha3":"ZAF","country-code":"710"},
  {"name":"South Georgia and the South Sandwich Islands","codeAlpha3":"SGS","country-code":"239"},
  {"name":"South Sudan","codeAlpha3":"SSD","country-code":"728"},
  {"name":"Spain","codeAlpha3":"ESP","country-code":"724"},
  {"name":"Sri Lanka","codeAlpha3":"LKA","country-code":"144"},
  {"name":"Sudan","codeAlpha3":"SDN","country-code":"729"},
  {"name":"Suriname","codeAlpha3":"SUR","country-code":"740"},
  {"name":"Svalbard and Jan Mayen","codeAlpha3":"SJM","country-code":"744"},
  {"name":"Swaziland","codeAlpha3":"SWZ","country-code":"748"},
  {"name":"Sweden","codeAlpha3":"SWE","country-code":"752"},
  {"name":"Switzerland","codeAlpha3":"CHE","country-code":"756"},
  {"name":"Syrian Arab Republic","codeAlpha3":"SYR","country-code":"760"},
  {"name":"Taiwan, Province of China","codeAlpha3":"TWN","country-code":"158"},
  {"name":"Tajikistan","codeAlpha3":"TJK","country-code":"762"},
  {"name":"Tanzania, United Republic of","codeAlpha3":"TZA","country-code":"834"},
  {"name":"Thailand","codeAlpha3":"THA","country-code":"764"},
  {"name":"Timor-Leste","codeAlpha3":"TLS","country-code":"626"},
  {"name":"Togo","codeAlpha3":"TGO","country-code":"768"},
  {"name":"Tokelau","codeAlpha3":"TKL","country-code":"772"},
  {"name":"Tonga","codeAlpha3":"TON","country-code":"776"},
  {"name":"Trinidad and Tobago","codeAlpha3":"TTO","country-code":"780"},
  {"name":"Tunisia","codeAlpha3":"TUN","country-code":"788"},
  {"name":"Turkey","codeAlpha3":"TUR","country-code":"792"},
  {"name":"Turkmenistan","codeAlpha3":"TKM","country-code":"795"},
  {"name":"Turks and Caicos Islands","codeAlpha3":"TCA","country-code":"796"},
  {"name":"Tuvalu","codeAlpha3":"TUV","country-code":"798"},
  {"name":"Uganda","codeAlpha3":"UGA","country-code":"800"},
  {"name":"Ukraine","codeAlpha3":"UKR","country-code":"804"},
  {"name":"United Arab Emirates","codeAlpha3":"ARE","country-code":"784"},
  {"name":"United Kingdom of Great Britain and Northern Ireland","codeAlpha3":"GBR","country-code":"826"},
  {"name":"United States of America","codeAlpha3":"USA","country-code":"840"},
  {"name":"United States Minor Outlying Islands","codeAlpha3":"UMI","country-code":"581"},
  {"name":"Uruguay","codeAlpha3":"URY","country-code":"858"},
  {"name":"Uzbekistan","codeAlpha3":"UZB","country-code":"860"},
  {"name":"Vanuatu","codeAlpha3":"VUT","country-code":"548"},
  {"name":"Venezuela (Bolivarian Republic of)","codeAlpha3":"VEN","country-code":"862"},
  {"name":"Viet Nam","codeAlpha3":"VNM","country-code":"704"},
  {"name":"Virgin Islands (British)","codeAlpha3":"VGB","country-code":"092"},
  {"name":"Virgin Islands (U.S.)","codeAlpha3":"VIR","country-code":"850"},
  {"name":"Wallis and Futuna","codeAlpha3":"WLF","country-code":"876"},
  {"name":"Western Sahara","codeAlpha3":"ESH","country-code":"732"},
  {"name":"Yemen","codeAlpha3":"YEM","country-code":"887"},
  {"name":"Zambia","codeAlpha3":"ZMB","country-code":"894"},
  {"name":"Zimbabwe","codeAlpha3":"ZWE","country-code":"716"}
];
/* unused harmony export COUNTRY_LIST */



/***/ })
/******/ ]);