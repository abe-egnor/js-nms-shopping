var Item = function(json) {
  if ('name' in json) {
    this.name = json.name;
  } else {
    this.name = '???';
  }
  if ('count' in json) {
    this.count = json.count;
  } else {
    this.count = 1;
  }
  if ('done' in json) {
    this.done = json.done;
  } else {
    this.done = false;
  }
  if ('note' in json) {
    this.note = json.note;
  } else {
    this.note = '';
  }
  if ('deps' in json) {
    this.deps = [];
    var len = json.deps.length;
    for (var i = 0; i < len; ++i) {
      this.deps.push(new Item(json.deps[i]));
    }
  } else {
    this.deps = [];
    for (var dep in PARTS[this.name]) {
      this.deps.push(new Item({'name': dep, 'count': this.count*PARTS[this.name][dep]}));
    }
  }
}

Item.prototype.toJSON = function() {
  var json = {
    'name': this.name,
    'count': this.count,
    'done': this.done,
    'note': this.note,
    'deps': [],
  };
  var len = this.deps.length;
  for (var i = 0; i < len; ++i) {
    json.deps.push(this.deps[i].toJSON());
  }
  return json;
}

Item.prototype.markDone = function(value) {
  this.done = value;
  var len = this.deps.length;
  for (var i = 0; i < len; ++i) {
    this.deps[i].markDone(value);
  }
}

Item.prototype.renderTo = function(container) {
  var nameElt;
  if (this.done) {
    var s = document.createElement('s');
    container.appendChild(s);
    nameElt = s;
  } else {
    nameElt = container;
  }
  nameElt.appendChild(document.createTextNode(this.count + '\u00D7 ' + this.name));
  if (this.note) {
    var i = document.createElement('i');
    i.appendChild(document.createTextNode(' (' + this.note + ')'));
    nameElt.appendChild(i);
  }
  var len = this.deps.length;
  if (len > 0) {
    var deplist = document.createElement('ul');
    for (var i = 0; i < len; ++i) {
      var b = document.createElement('button');
      b.appendChild(document.createTextNode('\u2713'));
      b.addEventListener('click', function(dep) { return function() {
        console.log('Tick');
        dep.markDone(!dep.done);
        redraw();
      }}(this.deps[i]));
      var depItem = document.createElement('li');
      depItem.appendChild(b);
      this.deps[i].renderTo(depItem);
      deplist.appendChild(depItem);
    }
    container.appendChild(deplist);
  }
}

Item.prototype.tally = function(sum, skipDone) {
  if (skipDone && this.done) {
    return sum;
  }
  var len = this.deps.length;
  if (len == 0) {
    if (!(this.name in sum)) {
      sum[this.name] = 0;
    }
    sum[this.name] += this.count;
  } else {
    for (var ix = 0; ix < len; ++ix) {
      this.deps[ix].tally(sum, skipDone);
    }
  }
  return sum;
}

var SHOPPING = [];
var LABEL_NOSPACE = '__label_nospace__';
var LABEL = '__label__';

function onLoad() {
  for (var part in PARTS) {
    if (PARTS[part] != LABEL && PARTS[part] != LABEL_NOSPACE) {
      for (var dep in PARTS[part]) {
        if (!(dep in PARTS)) {
          alert('Part <' + part + '> has invalid dependency <' + dep + '>');
        }
      }
    }
  }

  var completions = [];
  for (var part in PARTS) {
    if (PARTS[part] == LABEL || PARTS[part] == LABEL_NOSPACE) {
      continue;
    }
    completions.push(part);
  }
  var partInput = document.getElementById('part');
  new Awesomplete(partInput, {
    list: completions,
    maxItems: 100,
    sort: function() { return 0; },
  });

  var shoppingStr = localStorage.getItem('shopping');
  if (shoppingStr) {
    var shoppingJSON = JSON.parse(shoppingStr);
    var len = shoppingJSON.list.length;
    for (var i = 0; i < len; ++i) {
      SHOPPING.push(new Item(shoppingJSON.list[i]));
    }
  }

  redraw();
}

function tallyText(sum) {
  var text = [];
  for (var elt in sum) {
    text.push(sum[elt] + '\u00D7 ' + elt);
  }
  return text.join(', ');
}

function isEmpty(obj) {
  for (key in obj) {
    return false;
  }
  return true;
}

function textDiv(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div;
}

function renderTally(total, remaining, prefix) {
  if (!prefix) {
    prefix = '';
  }

  var countBox = document.createElement('div');
  countBox.className = 'countBox';

  var nameCol = document.createElement('div');
  nameCol.className = 'countColumn';
  nameCol.appendChild(textDiv(prefix + 'Total:'));
  if (!isEmpty(remaining)) {
    nameCol.appendChild(textDiv(prefix + 'Remaining:'));
  }
  countBox.appendChild(nameCol);

  var valCol = document.createElement('div');
  valCol.className = 'countColumn';
  valCol.appendChild(textDiv(tallyText(total)));
  if (!isEmpty(remaining)) {
    valCol.appendChild(textDiv(tallyText(remaining)));
  }
  countBox.appendChild(valCol);

  return countBox;
}

function redraw() {
  var content = document.getElementById('content');
  content.innerHTML = '';

  var allTotal = {};
  var allRemaining = {};
  var len = SHOPPING.length;
  for (var i = 0; i < len; ++i) {
    var del = document.createElement('button');
    del.addEventListener('click', function(delIx) { return function() {
      console.log('Del ' + delIx);
      SHOPPING.splice(delIx, 1);
      redraw();
    } }(i));
    del.appendChild(document.createTextNode('-'));
    var topDiv = document.createElement('div');
    topDiv.className = 'top';
    topDiv.appendChild(del);
    SHOPPING[i].renderTo(topDiv);

    SHOPPING[i].tally(allTotal);
    SHOPPING[i].tally(allRemaining, true);
    var itemTotal = SHOPPING[i].tally({});
    var itemRemaining = SHOPPING[i].tally({}, true);
    topDiv.appendChild(renderTally(itemTotal, itemRemaining));

    content.appendChild(topDiv);
  }

  if (!isEmpty(allTotal)) {
    var allDiv = document.createElement('div');
    allDiv.className = 'top';
    allDiv.appendChild(renderTally(allTotal, allRemaining, 'All '));
    content.appendChild(allDiv);
  }

  var shoppingJSON = {'list':[]};
  for (var i = 0; i < len; ++i) {
    shoppingJSON.list.push(SHOPPING[i].toJSON());
  }
  localStorage.setItem('shopping', JSON.stringify(shoppingJSON));
}

function addItem() {
  console.log('Add Item');
  var spec = {
    'name': document.getElementById('part').value,
    'count': parseInt(document.getElementById('count').value),
    'note': document.getElementById('note').value,
  };
  SHOPPING.push(new Item(spec));
  redraw();
}
