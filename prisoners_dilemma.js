if (Meteor.isClient) {

  // Old stuff
  // // counter starts at 0
  // Session.setDefault('counter', 0);

  // Template.results.helpers({
  //   counter: function () {
  //     return Session.get('counter');
  //   }
  // });

  // Template.results.events({
  //   'click button': function () {
  //     // increment the counter when button is clicked
  //     Session.set('counter', Session.get('counter') + 1);
  //   }
  // });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
