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

if (Meteor.isClient) {

    Session.setDefault('cooperateBotStats', 'No data yet.');

    Template.cooperateBotStats.helpers({
        cooperateBotStats: function() {
            return Session.get('cooperateBotStats');
        }
    });

    Template.body.events({
        'click button': function(e) {
            var userCode = $('textarea#userCode').val();
            Session.set('cooperateBotStats', userCode);
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
