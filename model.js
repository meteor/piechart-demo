Coins = new Meteor.Collection('coins');

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Coins.find().count() === 0) {
      Coins.insert({ _id: 'heads', count: 1 });
      Coins.insert({ _id: 'tails', count: 1 });
    }
  });

  Meteor.publish('coindata', function () {
    return Coins.find();
  });
}
