import { core, config, ui } from 'airbitz-libplugin'
import $ from 'jquery'
import cardTemplate from '../templates/card-template.handlebars'
import addFunds from '../templates/add-funds.handlebars'

const CardsChanged = {
  NO: 0,
  YES: 1,
  VALUE_ONLY: 2
}

const foldApi = 'https://api.foldapp.com/v1/'
let brand, apiToken, bizId, logoUrl, category, statsKey
let serverJsonError = false
let forceRefresh = 1
let minPriceRate = 1
let affiliateAddress = null
let affiliateFeePercent = 0

// TODO: get this number from the core
const DUST = 4000

core.loaded(function () {
  core.debugLevel(1, 'Before config')
  config.get('BRAND').then((data) => { brand = data })
  config.get('API-TOKEN').then((data) => { apiToken = data })
  config.get('BIZID').then((data) => { bizId = data })
  config.get('LOGO_URL').then((data) => { logoUrl = data })
  config.get('CATEGORY').then((data) => { category = data })
  config.get('AIRBITZ-STATS-KEY').then((data) => { statsKey = data })
  core.debugLevel(1, 'After config')

  // Purchases over this amount are given a popup warning as 1 confirmation is required
  // before card is available
  const largeValueThreshold = 50

  document.title = brand // Set page's title to brand of gift card.

  $('#reset-account').click(function () {
    if (window.confirm('Reset Account? This will delete all cards and create a new account with Fold') === true) {
      if (window.confirm('Reset Account? ARE YOU SURE. All cards from all vendors will be lost?') === true) {
        if (window.confirm('Reset Account? ARE YOU REALLY SURE?') === true) {
          Account.createWithHandler(function () {
            core.debugLevel(1, 'New account creation for reset succeeded.')
            // ui.exit()
          }, function () {
            ui.showAlert('New Account Creation Failed', 'New Account Creation Failed. Please check network or try again later')
            core.debugLevel(1, 'New account creation for reset failed.')
          })
        }
      }
    }
  })

  function toggleUi () {
    $('.fold-loading').css('display', 'none')
    $('.main').css('display', 'inline')
    setInterval(function () {
      updateAllCards()
    }, 3000) // Refresh UI every 3 seconds
  }

  function updateAllCards () {
    user.updateUsersCards(function () {
      user.updateCardsForSale(function () {
        Account.pingCard(Account.current_card_id)
        if (serverJsonError) {
          ui.showAlert('Server Response Error', 'Error in Server response. Please contact support')
          core.debugLevel(1, 'Error in Server response. Please contact support')
          serverJsonError = false
        }
      }) // Start getting avaliable cards for sale.
    })
  }

  function supportsTemplate () {
    return 'content' in document.createElement('template')
  }

  function supportsImports () {
    return 'import' in document.createElement('link')
  }
  if (supportsTemplate()) {
    core.debugLevel(1, 'Does support templates!')
  } else {
    // Use old templating techniques or libraries.
    core.debugLevel(1, 'Does not support templates.')
  }
  if (supportsImports()) {
    // Good to go!
    core.debugLevel(1, 'Supports imports!')
  } else {
    // Use other libraries/require systems to load files.
    core.debugLevel(1, 'Does not support imports.')
  }

  const createAddress = function (wallet, label, amountSatoshi, amountFiat,
    category, notes, resolve, reject) {
    core.createReceiveRequest(wallet, {
      label: label,
      category: category,
      notes: notes,
      amountSatoshi: amountSatoshi,
      amountFiat: amountFiat,
      bizId: parseInt(bizId),
      success: function (data) {
        core.finalizeReceiveRequest(wallet, data['requestId'])
        resolve(data)
      },
      error: reject
    })
  }

  function updateWallet (wallet) {
    Account.abWallet = wallet
  }

  function logStats (event, brand, amount) {
    const s = {}
    s['btc'] = 0
    s['partner'] = 'Fold'
    s['country'] = 'USA'
    s['user'] = Account.username.substr(Account.username.length - 8)
    s['brand'] = brand
    s['usd'] = amount
    if (affiliateAddress && affiliateAddress.length >= 8) {
      s['afaddr'] = affiliateAddress.substr(affiliateAddress.length - 8)
    } else {
      s['afaddr'] = 'none'
    }

    $.ajax({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token ' + statsKey
      },
      'type': 'POST',
      'url': 'https://airbitz.co/api/v1/events',
      'data': JSON.stringify({
        'event_type': event,
        'event_network': 'mainnet',
        'event_text': JSON.stringify(s)
      }),
      'dataType': 'json',
      success: function (response) {
        core.debugLevel(1, 'logStats: recorded')
      }
    }).fail(function (xhr, textStatus, error) {
      core.debugLevel(1, 'logStats: There was an error. Status: ' + xhr.status)
    })
  }

  function sRequestHandler (url, json, handleReponse, handleError) {
    console.log('apiToken: ' + apiToken)
    $.ajax({
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CFC-PartnerToken': 'aa17e642-a33c-477d-8a02-7f6e8b4e4e85'
      },
      'type': 'POST',
      'url': url,
      'data': JSON.stringify(json),
      'dataType': 'json',
      success: function (response) {
        handleReponse(response)
      }
    }).fail(function (xhr, textStatus, error) {
      core.debugLevel(1, 'There was an error. Status: ' + xhr.status)
      core.debugLevel(1, xhr.Message)
      handleError(xhr.status)
    })
  }

  const Account = {
    exists: $.Deferred(),
    logged_in: $.Deferred(),
    all_cards: [],
    owl: $('#user-cards'),
    owlSet: false, // Owl set
    numUpdates: 0,
    current_card_id: '', // The currently visible card id. used to ping Fold servers for balance update
    create: function () {
      Account.createWithHandler(function () {
        core.debugLevel(1, 'Account created successfully')
      }, function () {
        ui.showAlert('Account creation error', 'Error creating account. Please try again later')
        // ui.exit()
      })
    },

    createWithHandler: function (handleReponse, handleError) {
      core.debugLevel(1, 'Creating user.')
      const url = foldApi + 'users'
      const newAcc = {'users': [{
        'random_username': true,
        'random_password': true
      }]}

      sRequestHandler(url, newAcc, function (r) {
        Account.username = r['users'][0]['username']
        Account.pass = r['users'][0]['password']
        Account.creds = {'users': [{
          'username': Account.username,
          'password': Account.pass
        }]}
        core.writeData('fold-username', Account.username)
        core.writeData('fold-pass', Account.pass)
        Account.exists.resolve()
        handleReponse()
      }, function (error) {
        handleError()
      })
    },

    login: function () {
      const url = foldApi + 'my/session'
      core.debugLevel(1, Account.creds)
      sRequestHandler(url, Account.creds, function (r) {
        // core.debugLevel(1,"Logging in" + JSON.stringify(r));
        Account.logged_in.resolve(r)
      }, function (error) {
        ui.showAlert('Login error', 'Error logging into account. Please try again later')
        // ui.exit()
      })
      const affiliateInfo = core.getAffiliateInfo()
      if (affiliateInfo &&
                affiliateInfo['affiliate_address'] &&
                affiliateInfo['affiliate_address'].length > 20) {
        for (const ic in affiliateInfo['objects']) {
          if (affiliateInfo['objects'][ic]['key'] === 'gift_card_affiliate_fee') {
            affiliateAddress = affiliateInfo['affiliate_address']
            affiliateFeePercent = affiliateInfo['objects'][ic]['value'] / 100
            break
          }
        }
      }
    },
    updateBalance: function () {
      this.getInfo('balances?currency=USD', function (balances) {
        core.debugLevel(1, 'Balance: ' + JSON.stringify(balances['balances'][0]['amount']))
        $('.balance-amt').text('$' + balances['balances'][0]['amount'])
      })
    },

    pingCard: function (cardid) {
      if (!cardid) {
        return
      }
      const url = foldApi + 'my/cards/' + cardid + '/ping'
      core.debugLevel(1, 'Pinging card ' + cardid)
      sRequestHandler(url, '', function (r) {
        core.debugLevel(1, 'Pinging card success')
      },
      function (e) {
        core.debugLevel(1, 'Pinging card failed')
      })
    },

    updateWAddr: function (addr, handleResponse, handleError) { // Set the default BTC address
      const withdrawUrl = foldApi + 'my/default_withdraw_addresses'
      core.debugLevel(1, 'Setting default address to: ' + addr.toString())
      const newAddr = {'default_withdraw_addresses': [{
        'currency': 'BTC',
        'default_address': [{
          'address': addr.toString(),
          'address_type': 'crypto'
        }]
      }]}
      core.debugLevel(1, withdrawUrl)
      core.debugLevel(1, newAddr)
      sRequestHandler(withdrawUrl, newAddr, function (response) {
        core.debugLevel(1, 'Updated default_withdraw_address')
        handleResponse()
      }, function (error) {
        handleError()
      })
    },
    // Updates list of user's cards
    updateUsersCards: function (doneUpdating) {
      core.debugLevel(1, 'Resetting cards.')
      Account.getCards(function (cards) {
        Account.updateUsersCardsUI(cards, doneUpdating)
      })
    },
    clearOwl: function () {
      if (Account.owlSet) {
        core.debugLevel(1, 'Clearing Owl')
        core.debugLevel(1, 'Owl size before:' + Account.owl.data('owlCarousel').owl.owlItems.length)

        const owlSize = Account.owl.data('owlCarousel').owl.owlItems.length

        if (!owlSize) {
          return
        }

        for (let i = 0; i < owlSize; i++) {
          core.debugLevel(1, 'Clearing Owl Item ' + i)
          Account.owl.data('owlCarousel').removeItem()
        }
        core.debugLevel(1, 'Owl size after:' + Account.owl.data('owlCarousel').owl.owlItems.length)
      } else { Account.owlSet = true }
    },
    getCards: function (callback) {
      user.getInfo('cards?brand_id=' + brand, function (allCardInfo) {
        core.debugLevel(1, "User's cards: " + JSON.stringify(allCardInfo))
        callback(allCardInfo['cards'])
      })
    },

    updateUsersCardsUI: function (cards, doneUpdating) { // Updates the UI with cards the user has purchased
      core.debugLevel(1, 'updateUsersCardsUI: ' + cards.length + ' cards from all brands.')

      for (let c = 0; c < cards.length; c++) {
        // Check arrays values are defined
        if (typeof cards[c] === 'undefined') serverJsonError = true
        else if (typeof cards[c].id === 'undefined') serverJsonError = true
        else if (typeof cards[c].refundable === 'undefined') serverJsonError = true
        else if (typeof cards[c].code === 'undefined') serverJsonError = true
        else if (typeof cards[c].code[0] === 'undefined') serverJsonError = true
        else if (typeof cards[c].brand_id === 'undefined') serverJsonError = true
        else if (typeof cards[c].balance === 'undefined') serverJsonError = true
        else if (typeof cards[c].balance[0] === 'undefined') serverJsonError = true
        else if (typeof cards[c].balance[0]['amount'] === 'undefined') serverJsonError = true

        if (serverJsonError === true) {
          doneUpdating()
          return
        }
      }

      core.debugLevel(1, 'updateUsersCardsUI: brand: ' + brand + ': ' + cards.length)
      if (!cards.length > 0) {
        const changed = Account.haveCardsChanged(cards)
        if (changed || (!Account.owlSet)) {
          Account.all_cards = []
          core.debugLevel(1, 'No cards. New acc!')
          if (typeof Account.owl.data('owlCarousel').owl === 'undefined') {
            Account.setDummyCard()
          } else if (Account.owl.data('owlCarousel').owl.owlItems.length > 0) {
            Account.setDummyCard()
          }
        }
      } else { // There's at least one card
        const changed = Account.haveCardsChanged(cards)

        if (changed === CardsChanged.YES) {
          core.debugLevel(1, 'updateUsersCardsUI: brand: ' + brand + ': ' + cards.length + ' CARDS CHANGED')
          Account.all_cards = []
          let needToClearOwl = true
          let c = 0
          for (c in cards) {
            const card = new Card(
              cards[c]['id'],
              cards[c]['code'][0],
              cards[c]['balance'][0]['amount'], // e.g. $5
              cards[c]['refundable']
            )
            Account.pingCard(card['id'])
            if (c === 0) {
              Account.current_card_id = card['id'] // Assign the current card to the first on the list
            }
            Account.all_cards[c] = card
            if (!card.bal === 0) {
              const floatBalance = parseFloat(card.bal)
              // card_html.querySelector(".card-number").setAttribute("card", card.id);
              let rText = ''
              if (card.isRefundable) {
                rText = 'Refund Card' // Make sure the info button shows up.
              }
              const thisCard = {
                cardNumber: '<div class="card-number" card="' + card.id + '">' + card.num + '</div>',
                cardAmount: '<div class="card-balance-amt" card="' + card.id + '">' + '$' + floatBalance.toFixed(2) + '</div>',
                cardBarcode: '<img class="barcode " src="' + foldApi + 'my/cards/' + card.id + '/barcode/png' + '"/>',
                refundText: rText
              }
              const thisCardHTML = cardTemplate(thisCard)
              core.debugLevel(1, 'Adding card: ' + c + ' card info: ' + cards[c])
              if (needToClearOwl) {
                Account.clearOwl()
                needToClearOwl = false
              }

              Account.owl.data('owlCarousel').addItem(thisCardHTML)
              // document.querySelector("#user-cards").appendChild( document.importNode(card_html, true) );
            }
          }
        } else if (changed === CardsChanged.VALUE_ONLY) {
          Account.all_cards = []

          for (const c in cards) {
            const card = new Card(
              cards[c].id,
              cards[c].code[0],
              cards[c].balance[0].amount, // e.g. $5
              cards[c].refundable
            )
            Account.all_cards[c] = card

            const amt = parseFloat(card.bal)
            const amtString = '$' + amt.toFixed(2)

            $('div.card-balance-amt[card=' + card.id + ']').text(amtString)
            $('div.card-number[card=' + card.id + ']').text(card.num)
          }
        }
      }
      $('.materialboxed').materialbox()
      $('.card-refund').off().on('click', function () {
        core.debugLevel(1, 'Refunding button')
        const thisCardId = $(this).parent().parent().children('.card-info-main').children('.card-balance-amt').attr('card')
        core.debugLevel(1, 'This card: ' + thisCardId)
        const thisCard = Account.getCardById(thisCardId)
        thisCard.refund()
      })
      doneUpdating()
    },
    haveCardsChanged: function (cards) { // Has different cards?
      let match = 0
      if (forceRefresh) {
        forceRefresh = 0
        return CardsChanged.YES
      }
      core.debugLevel(1, 'haveCardsChanged: oldcards:' + Account.all_cards.length + ' newcards:' + cards.length)

      if (cards.length !== Account.all_cards.length) {
        core.debugLevel(1, 'haveCardsChanged: return YES')
        return CardsChanged.YES
      }
      let balanceChanged = false
      for (const ic in cards) {
        for (const iac in Account.all_cards) {
          if (cards[ic]['id'] === Account.all_cards[iac].id) {
            match++
            core.debugLevel(1, 'haveCardsChanged: found id match:' + cards[ic]['id'])
            core.debugLevel(1, 'haveCardsChanged: oldbal:' + Account.all_cards[iac].bal)
            core.debugLevel(1, 'haveCardsChanged: newbal:' + cards[ic]['balance'][0]['amount'])
            if (cards[ic]['balance'][0]['amount'] !== Account.all_cards[ic].bal) {
              core.debugLevel(1, 'haveCardsChanged: Balance changed card')
              balanceChanged = true
            }
          }
        }
      }

      core.debugLevel(1, 'haveCardsChanged: matched:' + match + ' newlength:' + cards.length)
      if (match !== cards.length) {
        core.debugLevel(1, 'haveCardsChanged: return YES')
        return CardsChanged.YES
      }

      if (balanceChanged) {
        core.debugLevel(1, 'haveCardsChanged: return VALUE_ONLY')
        return CardsChanged.VALUE_ONLY
      } else {
        core.debugLevel(1, 'haveCardsChanged: return YES')
        return CardsChanged.NO
      }
    },
    setLoadingCard: function () {
      const thisCard = {
        cardNumber: '<div class="card-number">' + 'Loading...' + '</div>',
        cardAmount: '<div class="card-balance-amt">' + '$0.00' + '</div>',
        cardBarcode: '',
        refundText: ''
      }
      const thisCardHTML = cardTemplate(thisCard)
      Account.clearOwl() // Make sure there's only ever ONE grey card and no other cards at the same time.
      Account.owl.data('owlCarousel').addItem(thisCardHTML)
    },
    setDummyCard: function () {
      const thisCard = {
        cardNumber: '<div class="card-number">' + '6666 8888 4444 0000' + '</div>',
        cardAmount: '<div class="card-balance-amt">' + '$0.00' + '</div>',
        cardBarcode: '<img class="barcode barcode-inactive" src="https://airbitz.co/go/wp-content/uploads/2015/12/download.png"/>',
        refundText: ''
      }
      const thisCardHTML = cardTemplate(thisCard)
      Account.clearOwl() // Make sure there's only ever ONE grey card and no other cards at the same time.
      Account.owl.data('owlCarousel').addItem(thisCardHTML)
    },
    getCardById: function (cardId) {
      const cardFromId = Account.all_cards.filter(function (obj) {
        return obj.id === cardId
      })
      return cardFromId[0]
    },

    updateCardsForSale: function (doneListing) { // Updates the UI with cards avaliable to purchase from Fold.
      let numCardsToBuy = 0
      this.getInfo('brands', function (cardsAvail) {
        core.debugLevel(1, JSON.stringify(cardsAvail))
        const allBrands = cardsAvail['brands']
        let brandsCards = ''
        minPriceRate = 1.0

        for (const ic in allBrands) {
          if (typeof allBrands[ic] === 'undefined') serverJsonError = true
          else if (typeof allBrands[ic]['id'] === 'undefined') serverJsonError = true
          else if (typeof allBrands[ic]['price_rate'] === 'undefined') serverJsonError = true
          else if (typeof allBrands[ic]['refundEnabled'] === 'undefined') serverJsonError = true

          if (serverJsonError) break

          if (allBrands[ic]['id'] === brand) {
            if (parseFloat(allBrands[ic]['price_rate']) < minPriceRate) {
              minPriceRate = parseFloat(allBrands[ic]['price_rate'])
            }

            brandsCards = allBrands[ic]
            break
          }
        }
        core.debugLevel(1, 'minPriceRate:' + minPriceRate)

        let maxDiscount = 100 * (1.0 - minPriceRate)
        maxDiscount = maxDiscount.toFixed(0)
        $('.brand-discount').text(maxDiscount + '%')

        core.debugLevel(1, JSON.stringify(brandsCards['card_values']))
        user.getBal(function (totalBal) {
          user.total_bal = totalBal
          let maxBal = 0
          if (brandsCards['soft_max_total'] && brandsCards['soft_max_total'].length > 0) {
            maxBal = parseInt(brandsCards['soft_max_total'][0]['amount'])
          }
          core.debugLevel(1, 'User bal: ' + user.total_bal)
          core.debugLevel(1, 'Max: ' + maxBal)
          let addTemplateHtml = ''
          if (maxBal >= user.total_bal) {
            const cardVals = brandsCards['card_values']
            $('.add-buttons').html('') // Wipe out any cards that are currently there.
            if (cardVals) {
              // Sort cards from lowest to highest
              cardVals.sort(function (a, b) {
                return a['amount'] - b['amount']
              })

              for (const ic in cardVals) {
                numCardsToBuy++
                core.debugLevel(1, 'Listing card ' + ic)
                const thisCard = {
                  cardValue: '<span class="card-value" value="' + cardVals[ic]['amount'] + '">' + cardVals[ic]['formatted']['all_decimal_places'] + '</span>'
                }
                addTemplateHtml = addTemplateHtml + addFunds(thisCard)
              }
            }
            $('.add-buttons').html(addTemplateHtml)
            $('.buy-card').off().on('click', function () {
              user.purchaseCard($(this).parent().parent().find('.card-value').attr('value'))
            })
          }
          if (numCardsToBuy) {
            $('.add-funds-header').text('Buy Gift Card')
          } else {
            $('.add-funds-header').text('Sorry, no cards available')
          }

          doneListing()
        })
      }, '')
    },
    logRefunds: function () {
      Account.getInfo('refunds', function (refunds) {
        console.log(JSON.stringify(refunds))
        core.debugLevel(1, JSON.stringify(refunds))
      })
    },
    getInfo: function (info, handleResponse, root) {
      root = typeof root !== 'undefined' ? root : 'my/'
      $.get(foldApi + root + info).done(function (response) {
        handleResponse(response)
      })
    },
    getBal: function (handleResponse) { // Get total balance of user. Return 0 if user doesn't have bal.
      this.getInfo('balances?currency=USD', function (balances) {
        try {
          handleResponse(balances['balances'][0]['amount'])
        } catch (err) {
          handleResponse(0)
        }
      })
    },
    purchaseCard: function (denomination, brandId) {
      brandId = typeof a !== 'undefined' ? a : brand
      const newOrder = { 'orders': [{
        'brand_id': String(brandId),
        'value': { 'amount': String(denomination), 'currency': 'USD' },
        'price': { 'currency': 'BTC' },
        'approved': true
      }],
      'cancel_all_others': true
      }
      const url = foldApi + 'my/orders'
      core.debugLevel(1, 'Getting new order')
      ui.showAlert('', 'Creating Order', {'showSpinner': true})
      sRequestHandler(url, newOrder, function (r) {
        core.debugLevel(1, 'Order: ' + JSON.stringify(r))
        const amt = (r['orders'][0]['price']['amount'] * 100000000)
        const toAddr = r['orders'][0]['payment'][0]['address']
        core.debugLevel(1, 'Spending ' + amt + ' from wallet: ' + user.abWallet + ' to: ' + toAddr)
        core.debugLevel(1, 'Fiat amt: ' + denomination)
        ui.hideAlert()
        if (largeValueThreshold < denomination) {
          ui.showAlert('High Value Card', 'You are purchasing a card over $50 in value. This requires one bitcoin network confirmation before your card will be available and may take over 10 minutes.')
        }
        let affiliateAmount = amt * affiliateFeePercent
        let tmpAddress = affiliateAddress
        if (affiliateAmount <= DUST) {
          affiliateAmount = 0
          tmpAddress = null
        }
        core.createSpendRequest2(Account.abWallet,
          toAddr, amt, tmpAddress, affiliateAmount, {
            label: brand,
            category: category,
            notes: brand + ' $' + String(denomination) + ' gift card.',
            bizId: parseInt(bizId),
            success: function (res) {
              if (res && res.back) {
                // User pressed backed button
              } else {
                ui.showAlert('Card Purchased', 'Card purchased. Your ' + brand + ' card should appear shortly.')
                forceRefresh = 1
                Account.clearOwl()
                core.debugLevel(1, 'Funds were sent.')
                logStats('purchase', brand, denomination)
              }
            },
            error: function () {
              ui.showAlert('Unable to send funds.', "Funds weren't sent")
              core.debugLevel(1, 'Funds were not sent.')
            }
          })
      }, function (error) {
        ui.showAlert('Server error', 'Error making purchase. Please contact support')
      })
    }
  }

  function Card (id, num, bal, isRefundable) {
    isRefundable = typeof isRefundable !== 'undefined' ? isRefundable : false
    this.id = id
    this.num = num
    this.bal = bal
    this.isRefundable = isRefundable
  }

  Card.prototype.refund = function () {
    if (this.isRefundable) {
      ui.showAlert('', 'Refunding card...', {'showSpinner': true})
      const url = foldApi + 'my/refunds'
      const balance = this.bal
      core.debugLevel(1, 'Refunding card ' + this.id + ' amount: ' + this.bal)
      const refund = {'refunds': [{
        'card_id': this.id
      }]}
      createAddress(Account.abWallet, brand, 0, 0, category, 'Refunded ' + brand + ' gift card.',
        function (data) {
          Account.updateWAddr(data['address'], function () {
            sRequestHandler(url, refund, function (response) {
              Account.clearOwl()
              ui.showAlert('Card Refunded', 'Card Refunded. Please allow 8-15 minutes for refund.')
              core.debugLevel(1, response)
              core.debugLevel(1, 'Done refunding!')
              logStats('refund', brand, balance)
              forceRefresh = 1
            }, function (error) {
              ui.showAlert('Card Not Refunded', 'Error refunding card. Please try again later. Error:sRequestHandler:refund')
            })
          }, function () {
            ui.showAlert('Card Not Refunded', 'Error refunding card. Please try again later. Error:updateWAddr')
          })
        }, function (data) {
          ui.showAlert('Card Not Refunded', 'Error refunding card. Please try again later. Error:createAddress')
          core.debugLevel(1, data)
        })
    } else {
      ui.showAlert('', 'Card is not refundable')
    }
  }

  Card.prototype.remove = function () { // Remove card from UI
    if (this.bal === 0) {
    }
  }

  Card.prototype.mockBal = function (bal) {
    const url = foldApi + 'my/mock/cards'
    const thisCard = this
    $.post(url,
      {'cards': [{
        'id': thisCard.id.toString(),
        'balance_amount': bal.toString()
      }]}
    ).done(function () {
      core.debugLevel(1, 'Done mocking ' + thisCard.id + ' balance to: ' + bal)
    })
  }

  // Main
  const user = Object.create(Account)
  core.readData('fold-username').then((data) => {
    Account.username = data
    return core.readData('fold-pass')
  }).then((data) => {
    Account.password = data
  })
  ui.showAlert('', 'Loading account...', {
    'showSpinner': true
  })

  function main () {
    if (!(typeof Account.username === 'undefined' || Account.username == null)) {
      Account.creds = {'users': [{
        'username': Account.username,
        'password': Account.pass
      }]}
      core.debugLevel(1, 'User pulled from memory.')
      user.exists.resolve()
    } else {
      user.create()
    }
    $.when(user.exists).done(function (data) {
      user.login()
    })
    $.when(user.logged_in).done(function (data) {
      core.debugLevel(1, 'Logged in')
      Account.owl.owlCarousel({ // Activate owl Carousel for cards.
        // navigation : true, // Show next and prev buttons
        slideSpeed: 300,
        paginationSpeed: 400,
        singleItem: true,
        afterMove: function (elem) {
          const current = this.currentItem
          const card = elem.find('.owl-item').eq(current).find('.card-balance-amt').attr('card')
          core.debugLevel(1, 'Current card is ' + card)
          Account.current_card_id = card
          Account.pingCard(card)
        }

        // "singleItem:true" is a shortcut for:
        // items : 1,
        // itemsDesktop : false,
        // itemsDesktopSmall : false,
        // itemsTablet: false,
        // itemsMobile : false
      })
      Account.setLoadingCard()

      //      Account.logRefunds();
      core.getSelectedWallet({
        success: function (wallet) {
          updateWallet(wallet)
          const withdrawalAddress = core.readData('withdrawal-address')

          // If this is a new account. Set an initial refund address in case any purchases get botched
          if (!withdrawalAddress || withdrawalAddress.length < 20) {
            createAddress(Account.abWallet, brand, 0, 0, category, 'Refunded ' + brand + ' gift card.', function (data) {
              Account.updateWAddr(data['address'], function () {
                core.debugLevel(1, 'Setting withdrawal address:' + data['address'])
                core.writeData('withdrawal-address', data['address'])
              }, function () {
                core.debugLevel(1, 'WARNING: could not set withdrawal address')
                core.debugLevel(1, data)
              })
            }, function (data) {
              core.debugLevel(1, data)
            })
          } else {
            core.debugLevel(1, 'Withdrawal address already set:' + withdrawalAddress)
          }
        },
        error: function () {
          core.debugLevel(1, 'Could not get selected wallet')
          ui.showAlert('Wallet Error', 'Error could not select wallet.')
        }
      })

      core.debugLevel(1, 'Updating UI')
      ui.hideAlert()

      updateAllCards()
      toggleUi()

      user.getInfo('profile', function (response) {
        // core.debugLevel(1,response);
        // core.debugLevel(1,response["logged_in"]);
        user.getInfo('orders', function (response) {
          // core.debugLevel(1,response);
        })
        // Done loading.
      })
    })
    // UI stuff
    core.debugLevel(1, 'logo: ' + logoUrl)
    $('.brand-name').text(brand)

    if (serverJsonError) {
      ui.showAlert('Server Response Error', 'Error in Server response. Please contact support')
      core.debugLevel(1, 'Error in Server response. Please contact support')
    }

    $('.brand-logo').attr('src', logoUrl)
    $('.user-creds').html('Username: ' + Account.username + '<br>Password: ' + Account.pass)
    $('.support-mail-link').html('<a href="mailto:support@foldapp.com?subject=Support%20Requested&body=' + 'Username:' + Account.username + '">support@foldapp.com.</a>')
  }

  window.onerror = function (message) {
    ui.showAlert('Internal error', 'Service is unavailable at this time. Please try again later.')
    // ui.exit()
    core.debugLevel(1, message)
  }

  try {
    main()
  } catch (e) {
    // handle any rogue exceptions
    ui.showAlert('Internal error', 'Service is unavailable at this time. Please try again later.')
    // ui.exit()
    core.debugLevel(1, e.toString())
  }
})
