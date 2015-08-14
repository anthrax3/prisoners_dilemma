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

function payoff(myChoice, theirChoice) {
    if (myChoice && theirChoice) {
        // Two cooperations
        return 50;
    } else if (myChoice && !theirChoice) {
        // They defect against me
        return -100;
    } else if (!myChoice && theirChoice) {
        // I defect against them
        return 100;
    } else if (!myChoice && !theirChoice) {
        // We both defect :(
        return -50;
    } else {
        alert("Error: Choices must be true (cooperate) or false (defect)");
    }
}

function compete(me, them, numRounds) {
    // Compete me against them, over numRounds rounds.
    // Return the total payoff to both me and them.
    var payoffToMe = 0;
    var payoffToThem = 0;

    var myLastChoice = null;
    var themLastChoice = null;

    var myState = null;
    var themState = null;

    for (var i=0; i<numRounds; i++) {
        var myNext = me(myLastChoice, myState);
        var themNext = them(themLastChoice, themState);

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

    Session.setDefault('cooperateBotStats', 'No data yet.');
    Session.setDefault('defectBotStats', 'No data yet.');
    Session.setDefault('yourselfBotStats', 'No data yet.');

    Template.testingStats.helpers({
        cooperateBotStats: function() {
            return Session.get('cooperateBotStats');
        },
        defectBotStats: function() {
            return Session.get('defectBotStats');
        },
        yourselfBotStats: function() {
            return Session.get('yourselfBotStats');
        },
    });

    Template.body.events({
        'click button': function(e) {
            var userCode = $('textarea#userCode').val();

            var me = cooperateBot; //TODO -- put my bot here, using userCode
            var numRounds = 20;

            var cooperatePayoffs = compete(me, cooperateBot, numRounds);
            Session.set('cooperateBotStats', 'You earned '+cooperatePayoffs.me+' and CooperateBot earned '+cooperatePayoffs.them+' over '+numRounds+' rounds.');

            var defectPayoffs = compete(me, defectBot, numRounds);
            Session.set('defectBotStats', 'You earned '+defectPayoffs.me+' and DefectBot earned '+defectPayoffs.them+' over '+numRounds+' rounds.');

            var yourselfPayoffs = compete(me, me, numRounds);
            Session.set('yourselfBotStats', 'Playing against yourself, You #1 earned '+yourselfPayoffs.me+' and You #2 earned '+yourselfPayoffs.them+' over '+numRounds+' rounds.');

        }
    });


    // Old stuff
    // // counter starts at 0
    // Session.setDefault('counter', 0);

    // Template.results.helpers({
    //     counter: function () {
    //         return Session.get('counter');
    //     }
    // });

    // Template.results.events({
    //     'click button': function () {
    //         // increment the counter when button is clicked
    //         Session.set('counter', Session.get('counter') + 1);
    //     }
    // });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}
