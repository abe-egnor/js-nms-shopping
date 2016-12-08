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

Item.prototype.tally = function(sum) {
}

var SHOPPING = [];
var LABEL_NOSPACE = '__label_nospace__';
var LABEL = '__label__';

function onLoad() {
  var partSelect = document.getElementById('part');
  for (var part in PARTS) {
    var opt = document.createElement('option');
    opt.value = part;
    opt.appendChild(document.createTextNode(part));
    if (PARTS[part] == LABEL) {
      opt.disabled = true;
      var spacer = document.createElement('option');
      spacer.disabled = true;
      partSelect.appendChild(spacer);
    } else if (PARTS[part] == LABEL_NOSPACE) {
      opt.disabled = true;
    } else for (var dep in PARTS[part]) {
      if (!(dep in PARTS)) {
        alert('Part <' + part + '> has invalid dependency <' + dep + '>');
      }
    }
    partSelect.appendChild(opt);
    first = false;
  }

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

function redraw() {
  var content = document.getElementById('content');
  content.innerHTML = '';
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
    content.appendChild(topDiv);
    //content.appendChild(document.createElement('hr'));
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
