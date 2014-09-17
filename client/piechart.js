// XXX Should this really be a global?
CoinsSub = Meteor.subscribe('coindata');

PieSegmentOptions = {
  'heads': { label: 'Heads', color: '#68d2f9' /* bluish */ },
  'tails': { label: 'Tails', color: '#25bb29' /* greenish */ }
};

/// Template.piechart

Template.piechart.pieSegments = function () {
  // Returns the values of PieSegmentOptions, extended with `_id`
  var result = [];
  for (var id in PieSegmentOptions) {
    result.push(_.extend({ _id: id }, PieSegmentOptions[id]));
  }
  return result;
};

Template.piechart.getCount = function (id) {
  // Return the `.count` of a document by `_id`.  Guard against
  // the document not being loaded yet.
  var doc = Coins.findOne(id);
  return doc ? doc.count : 0;
};

Template.piechart.events({
  'click .increment-button': function (evt) {
    var id = evt.target.getAttribute("data-id");
    Coins.update(id, { $inc: { count: 1 } });
  },
  'click .reset-button': function (evt) {
    // Set all counts to 1.  Setting them to 0 seems to break
    // the chart library.
    _.each(PieSegmentOptions, function (opts, id) {
      Coins.update(id, { $set: { count: 1 } });
    });
  }
});

Template.piechart.dataLoaded = function () {
  return CoinsSub.ready();
};

/// Template.piecanvas

Template.piecanvas.rendered = function () {
  var template = this;

  var ctx = template.find('#piechart').getContext("2d");
  var chart = new Chart(ctx).Doughnut([], {
    animationEasing: "easeOutQuart"
  });
  template.chart = chart;

  var observeCallbacks = {
    addedAt: function (doc, index) {
      chart.addData(_.extend({},
                             PieSegmentOptions[doc._id] || { label: doc._id },
                             { value: doc.count }),
                    index);
    },
    changedAt: function (newDoc, oldDoc, index) {
      chart.segments[index].value = newDoc.count;
      chart.update();
    },
    removedAt: function (oldDoc, index) {
      chart.removeData(index);
    },
    movedTo: function (doc, fromIndex, toIndex) {
      observeCallbacks.removedAt(doc, fromIndex);
      observeCallbacks.addedAt(doc, toIndex);
    }
  };

  template.observeHandle = Coins.find().observe(observeCallbacks);
};

Template.piecanvas.destroyed = function () {
  if (this.observeHandle) {
    this.observeHandle.stop();
    this.observeHandle = null;
  }
};
