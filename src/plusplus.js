var _ = require('underscore');
var clark = require('clark');
var querystring = require('querystring');
var ScoreKeeper = require('./scorekeeper');

module.exports = function(robot) {
  var scoreKeeper = new ScoreKeeper(robot);
  var scoreKeyword = process.env.HUBOT_PLUSPLUS_KEYWORD || 'score';

  //# sweet regex bro
  //  robot.hear ///
  //  # from beginning of line
  //  ^
  //  # the thing being upvoted, which is any number of words and spaces
  //  ([\s\w'@.\-:]*)
  //  # allow for spaces after the thing being upvoted (@user ++)
  //  \s*
  //  # the increment/decrement operator ++ or --
  //  (\+\+|--|—)
  //  # optional reason for the plusplus
  //  (?:\s+(?:for|because|cause|cuz|as)\s+(.+))?
  //  $ # end of line
  //  ///i, (msg) ->

  //   <name>++ [<reason>] - Increment score for a name (for a reason)
  //   <name>-- [<reason>] - Decrement score for a name (for a reason)
  robot.hear(/^([\s\w'@.\-:<>]*)\s*(\+\+|--|—)(?:\s+(?:for|because|cause|cuz|as)\s+(.+))?$/i, function(msg, done) {
    var dummy, from, lastReason, message, name, operator, reason, reasonScore, ref, ref1, ref2, room, score;
    ref = msg.match, dummy = ref[0], name = ref[1], operator = ref[2], reason = ref[3];
    from = msg.message.user.name.toLowerCase();
    room = msg.message.room;
    reason = reason != null ? reason.trim().toLowerCase() : void 0;

    name = name.replace(/:/, '').trim();

    if (!((name != null) && name !== '')) {
      ref1 = scoreKeeper.last(room), name = ref1[0], lastReason = ref1[1];
      if ((reason == null) && (lastReason != null)) {
        reason = lastReason;
      }
    }
    ref2 = operator === "++" ? scoreKeeper.add(name, from, room, reason) : scoreKeeper.subtract(name, from, room, reason), score = ref2[0], reasonScore = ref2[1];

    if (score != null) {
      message = reason != null ? reasonScore === 1 || reasonScore === -1 ? name + " has " + score + " points, " + reasonScore + " of which is for " + reason + "." : name + " has " + score + " points, " + reasonScore + " of which are for " + reason + "." : score === 1 ? name + " has " + score + " point" : name + " has " + score + " points";
      msg.send(message, done);
    }
  });

  robot.respond(/(?:erase)([\s\w'@.\-:<>]+?)(?:\s+(?:for|because|cause|cuz)\s+(.+))?$/i, function(msg, done) {
    var __, erased, from, isAdmin, message, name, reason, ref, ref1, ref2, room;
    ref = msg.match, __ = ref[0], name = ref[1], reason = ref[2];
    from = msg.message.user.name.toLowerCase();
    room = msg.message.room;
    reason = reason != null ? reason.trim().toLowerCase() : void 0;
    name = name.replace(/:/, '').trim();

    erased = scoreKeeper.erase(name, from, room, reason);

    if (erased != null) {
      message = reason != null ? "Erased the following reason from " + name + ": " + reason : "Erased points for " + name;
      msg.send(message, done);
    }
  });

  robot.respond(new RegExp("(?:" + scoreKeyword + ") (for\s)?(.*)", "i"), function(msg, done) {
    var name, reasonString, reasons, score;
    name = msg.match[2].trim().toLowerCase();
    if (name) {
      if (name.charAt(0) === ':') {
        name = name.replace(/(^\s*@)|([,\s]*$)/g, '');
      } else {
        name = name.replace(/(^\s*@)|([,:\s]*$)/g, '');
      }
    }

    score = scoreKeeper.scoreForUser(name);
    reasons = scoreKeeper.reasonsForUser(name);
    reasonString = typeof reasons === 'object' && Object.keys(reasons).length > 0 ? (name + " has " + score + " points. here are some raisins:") + _.reduce(reasons, function(memo, val, key) {
      return memo += "\n" + key + ": " + val + " points";
    }, "") : name + " has " + score + " points.";

    msg.send(reasonString, done);
  });

  robot.respond(/(top|bottom) (\d+)/i, function(msg, done) {
    var amount, graphSize, i, j, message, ref, tops;
    amount = parseInt(msg.match[2]) || 10;
    message = [];
    tops = scoreKeeper[msg.match[1]](amount);
    if (tops.length > 0) {
      for (i = j = 0, ref = tops.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
        message.push((i + 1) + ". " + tops[i].name + " : " + tops[i].score);
      }
    } else {
      message.push("No scores to keep track of yet!");
    }
    if (msg.match[1] === "top") {
      graphSize = Math.min(tops.length, Math.min(amount, 20));
      message.splice(0, 0, clark(_.first(_.pluck(tops, "score"), graphSize)));
    }

    msg.send(message.join("\n"), done);
  });
};
