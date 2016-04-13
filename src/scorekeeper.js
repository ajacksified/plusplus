var ScoreKeeper = function (robot) {
  var base;

  this.robot = robot;
  this.storage = (base = this.robot.brain.data._private).plusPlus || (base.plusPlus = {
    scores: {},
    log: {},
    reasons: {},
    last: {}
  });

  if (typeof this.storage.last === "string") {
    this.storage.last = {};
  }
};

ScoreKeeper.prototype.getUser = function(user) {
  var base, base1;
  (base = this.storage.scores)[user] || (base[user] = 0);
  (base1 = this.storage.reasons)[user] || (base1[user] = {});

  return user;
};

ScoreKeeper.prototype.saveUser = function(user, from, room, reason) {
  this.saveScoreLog(user, from, room, reason);

  return [this.storage.scores[user], this.storage.reasons[user][reason] || "none"];
};

ScoreKeeper.prototype.add = function(user, from, room, reason) {
  var base, base1;
  if (this.validate(user, from)) {
    user = this.getUser(user);
    this.storage.scores[user]++;
    (base = this.storage.reasons)[user] || (base[user] = {});
    if (reason) {
      (base1 = this.storage.reasons[user])[reason] || (base1[reason] = 0);
      this.storage.reasons[user][reason]++;
    }
    return this.saveUser(user, from, room, reason);
  } else {
    return [null, null];
  }
};

ScoreKeeper.prototype.subtract = function(user, from, room, reason) {
  var base, base1;
  if (this.validate(user, from)) {
    user = this.getUser(user);
    this.storage.scores[user]--;
    (base = this.storage.reasons)[user] || (base[user] = {});
    if (reason) {
      (base1 = this.storage.reasons[user])[reason] || (base1[reason] = 0);
      this.storage.reasons[user][reason]--;
    }
    return this.saveUser(user, from, room, reason);
  } else {
    return [null, null];
  }
};

ScoreKeeper.prototype.erase = function(user, from, room, reason) {
  user = this.getUser(user);
  if (reason) {
    delete this.storage.reasons[user][reason];
    this.saveUser(user, from.name, room);
    return true;
  } else {
    delete this.storage.scores[user];
    delete this.storage.reasons[user];
    return true;
  }
  return false;
};

ScoreKeeper.prototype.scoreForUser = function(user) {
  user = this.getUser(user);
  return this.storage.scores[user];
};

ScoreKeeper.prototype.reasonsForUser = function(user) {
  user = this.getUser(user);
  return this.storage.reasons[user];
};

ScoreKeeper.prototype.saveScoreLog = function(user, from, room, reason) {
  if (typeof this.storage.log[from] !== "object") {
    this.storage.log[from] = {};
  }
  this.storage.log[from][user] = new Date();
  return this.storage.last[room] = {
    user: user,
    reason: reason
  };
};

ScoreKeeper.prototype.last = function(room) {
  var last;
  last = this.storage.last[room];
  if (typeof last === 'string') {
    return [last, ''];
  } else {
    return [last.user, last.reason];
  }
};

ScoreKeeper.prototype.isSpam = function(user, from) {
  var base, date, dateSubmitted, messageIsSpam;
  (base = this.storage.log)[from] || (base[from] = {});
  if (!this.storage.log[from][user]) {
    return false;
  }
  dateSubmitted = this.storage.log[from][user];
  date = new Date(dateSubmitted);
  messageIsSpam = date.setSeconds(date.getSeconds() + 5) > new Date();
  if (!messageIsSpam) {
    delete this.storage.log[from][user];
  }
  return messageIsSpam;
};

ScoreKeeper.prototype.validate = function(user, from) {
  return user !== from && user !== "" && !this.isSpam(user, from);
};

ScoreKeeper.prototype.length = function() {
  return this.storage.log.length;
};

ScoreKeeper.prototype.top = function(amount) {
  var name, ref, score, tops;
  tops = [];
  ref = this.storage.scores;
  for (name in ref) {
    score = ref[name];
    tops.push({
      name: name,
      score: score
    });
  }
  return tops.sort(function(a, b) {
    return b.score - a.score;
  }).slice(0, amount);
};

ScoreKeeper.prototype.bottom = function(amount) {
  var all;
  all = this.top(this.storage.scores.length);
  return all.sort(function(a, b) {
    return b.score - a.score;
  }).reverse().slice(0, amount);
};

ScoreKeeper.prototype.normalize = function(fn) {
  var scores;
  scores = {};
  _.each(this.storage.scores, function(score, name) {
    scores[name] = fn(score);
    if (scores[name] === 0) {
      return delete scores[name];
    }
  });
  this.storage.scores = scores;
};

module.exports = ScoreKeeper;

