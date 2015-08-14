var ROUNDS = 100;
var NEGINF = -1000000000;

Bots = new Mongo.Collection('bots'); // [{userId, name, code, score, failed}]
Games = new Mongo.Collection('games'); // [{participants@[bot1Id, bot2Id], bot1Score, bot2Score, evaluated, counter}]

function cooperateBot(choice, state) {
    return {
        'choice': true,
        'state': {},
    }
}

function defectBot(choice, state) {
    return {
        'choice': false,
        'state': {},
    }
}

function botFromString(code) {
    try {        
        var f;
        eval('f = ' + code);
        return f;
    } catch (exception) {
        return null;
    }
}

function payoff(myChoice, theirChoice) {
    if (myChoice && theirChoice) {
        // Two cooperations
        return 50;
    } else if (myChoice && !theirChoice) {
        // They defect against me
        return -50;
    } else if (!myChoice && theirChoice) {
        // I defect against them
        return 100;
    } else if (!myChoice && !theirChoice) {
        // We both defect :(
        return 0;
    } else {
        alert("Error: Choices must be true (cooperate) or false (defect)");
    }
}

function compete(me, them, numRounds) {
    // Compete me against them, over numRounds rounds.
    // Return the total payoff to both me and them.
    
    if ((me === null) || (them === null)) {
        return {
            me: (me === null) ? null : 0,
            them: (them === null) ? null : 0
        }
    }
    
    var payoffToMe = 0;
    var payoffToThem = 0;

    var myLastChoice = null;
    var themLastChoice = null;

    var myState = null;
    var themState = null;

    for (var i=0; i<numRounds; i++) {
        try {
            var myNext = me(myLastChoice, myState);
        } catch (exception) {
            return {
                me: null,
                them: 0
            }
        }
        
        try {
            var themNext = them(themLastChoice, themState);
        } catch (exception) {
            return {
                me: 0,
                them: null
            }
        }

        themState = themNext.state;
        themLastChoice = themNext.choice;
        myState = myNext.state;
        myLastChoice = myNext.choice;

        payoffToMe += payoff(myLastChoice, themLastChoice);
        payoffToThem += payoff(themLastChoice, myLastChoice);
    }

    return {
        'me': payoffToMe,
        'them': payoffToThem,
    }
}

if (Meteor.isClient) {
    var updateLeaderboard = function () {
        var res = Meteor.call('getLeaderboard', function (error, res) {
            if (error !== undefined) {
                alert('Sorry, something went wrong!');
                return;
            }
            
            Session.set('queueSize', res.queue);
            Session.set('bots', res.bots);
        });
    }

    Session.setDefault('cooperateBotStats', 'No data yet.');
    Session.setDefault('defectBotStats', 'No data yet.');
    Session.setDefault('yourselfBotStats', 'No data yet.');
    Session.setDefault('queueSize', '0');
    Session.setDefault('leaderboard', 'No data yet.')

    Template.testingStats.helpers({
        cooperateBotStats: function() {
            return Session.get('cooperateBotStats');
        },
        defectBotStats: function() {
            return Session.get('defectBotStats');
        },
        yourselfBotStats: function() {
            return Session.get('yourselfBotStats');
        }
    });
    
    Template.results.helpers({
        queueSize: function() {
            return Session.get('queueSize');
        },
        bots: function() {
            return Session.get('bots');
        }
    });
    
    updateLeaderboard();

    Template.body.events({
        'click #runTesting': function(e) {
            var userCode = $('textarea#userCode').val();

            var me = botFromString(userCode);
            var numRounds = 20;

            var cooperatePayoffs = compete(me, cooperateBot, numRounds);
            Session.set('cooperateBotStats', 'You earned '+cooperatePayoffs.me+' and CooperateBot earned '+cooperatePayoffs.them+' over '+numRounds+' rounds.');

            var defectPayoffs = compete(me, defectBot, numRounds);
            Session.set('defectBotStats', 'You earned '+defectPayoffs.me+' and DefectBot earned '+defectPayoffs.them+' over '+numRounds+' rounds.');

            var yourselfPayoffs = compete(me, me, numRounds);
            Session.set('yourselfBotStats', 'Playing against yourself, You #1 earned '+yourselfPayoffs.me+' and You #2 earned '+yourselfPayoffs.them+' over '+numRounds+' rounds.');

        },
        'submit .submission': function(e) {
            e.preventDefault();
            
            var form = e.target;
            Meteor.call('submitBot', e.target.userId.value, e.target.name.value, $('textarea#userCode').val(), function (error, result) {
                if (error === undefined) {
                    alert('Your code has been submitted, refresh the leaderboard to check your results.');
                } else {
                    alert('Sorry, something went wrong!');
                }
            });
        },
        'click #refresh': function(e) {
            updateLeaderboard();
        }
    });
}

if (Meteor.isServer) {
    var evaluateGame = function (game) {
        var bot1 = Bots.findOne(game.participants[0]);
        var bot2 = Bots.findOne(game.participants[1]);
        console.log('ev', bot1.name, bot2.name);
        
        if (bot1.failed || bot2.failed) {
            var res = {me: 0, them: 0};
        } else {
            var res = compete(botFromString(bot1.code), botFromString(bot2.code), ROUNDS);
        }
        
        if (res.me === null) {
            Bots.update(bot1._id, {$set: {failed: true}});
            res.me = 0;
        }
        
        if (res.them === null) {
            Bots.update(bot2._id, {$set: {failed: true}});
            res.them = 0;
        }
        
        Bots.update(bot1._id, {
            $inc: {score: res.me}
        });
        Bots.update(bot2._id, {
            $inc: { score: res.them}
        });
        
        Games.update(game._id, {
            $set: {
                bot1Score: res.me,
                bot2Score: res.them,
                evaluated: true
            }
        });
    }
    
    Meteor.startup(function () {
        Games.find({evaluated: false}).observe({
            changed: function (newGame, oldGame) {
                evaluateGame(newGame);
            },
            added: function (game) {
                var bot1 = Bots.findOne(game.participants[0]);
                var bot2 = Bots.findOne(game.participants[1]);

                var res = compete(botFromString(bot1.code), botFromString(bot2.code), 100);

                Bots.update(bot1._id, {
                    $set: {score: bot1.score + res.me}
                });
                Bots.update(bot2._id, {
                    $set: { score: bot2.score + res.them}
                });

                Games.update(game._id, {
                    $set: {
                        bot1Score: res['me'],
                        bot2Score: res['them'],
                        evaluated: true
                    }
                });
            }
        });
    });
}

Meteor.methods({
    submitBot: function (userId, name, code) {
        var prevBot = Bots.findOne({userId: userId});

        if ((prevBot === null) || (prevBot === undefined)) {
            // creating new bot
            var botId = Bots.insert({
                userId: userId,
                name: name,
                code: code,
                score: 0,
                failed: false
            });

            Bots.find({
                _id: {$ne: botId}
            }).forEach(function (otherBot, index, cursor) {
                Games.insert({
                    participants: [botId, otherBot._id],
                    evaluated: false,
                    counter: 0
                });
            });
        } else {
            // updating an existing one
            Bots.update(prevBot._id, {
                $set: {
                    name: name,
                    code: code,
                    failed: false
                }
            });
            
            Games.find({participants: prevBot._id}).forEach(function (game, index, cursor) {
                Bots.update(game.participants[0], {$inc: {score: -game.bot1Score}});
                Bots.update(game.participants[1], {$inc: {score: -game.bot2Score}});
                Games.update(game._id, {$set: {evaluated: false}, $inc: {counter: 1}});
            });
        }
    },
    getLeaderboard: function () {
        var bots = Bots.find({}, {sort: [['failed', 'asc'], ['score', 'desc'], ['userId', 'asc']]});
        var leaderboard = bots.map(function (bot, index, cursor) {
            return {
                userId: bot.userId,
                name: bot.name,
                score: bot.failed ? NEGINF : bot.score
            };
        })

        return {
            bots: leaderboard,
            queue: Games.find({evaluated: false}).count()
        };
    }
});

/*
function runTests() {
    Games.remove({});
    Bots.remove({});
    
    Meteor.call('submitBot', 1, 'Coop', 'function (a,b) {return {choice: true, state: 0}}');
    Meteor.call('submitBot', 2, 'Def', 'function (a,b) {return {choice: false, state: 0}}');
    Meteor.call('submitBot', 3, 'Rand', 'function (a,b) {return {choice: Math.random() < 0.5, state: 0}}');
    Meteor.call('submitBot', 4, 'SyntErr', 'asdfg');
    Meteor.call('submitBot', 5, 'RuntimeExcp', 'function (a,b) {throw "tantrum"}');
    Meteor.call('submitBot', 6, 'ErrFixed', 'asdfg');
    Meteor.call('submitBot', 6, 'ErrFixed', 'function (a,b) {return {choice: true, state: 0}}');
}
*/
