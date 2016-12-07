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
    'deps': [],
  };
  var len = this.deps.length;
  for (var i = 0; i < len; ++i) {
    json.deps.push(this.deps[i].toJSON());
  }
  return json;
}

Item.prototype.render = function(widget) {
  var out = document.createElement('li');
  if (widget) {
    out.appendChild(widget);
  }
  var nameElt;
  if (this.done) {
    var s = document.createElement('s');
    out.appendChild(s);
    nameElt = s;
  } else {
    nameElt = out;
  }
  nameElt.appendChild(document.createTextNode(this.count + 'x ' + this.name));
  var len = this.deps.length;
  if (len > 0) {
    var deplist = document.createElement('ul');
    for (var i = 0; i < len; ++i) {
      var b = document.createElement('button');
      b.appendChild(document.createTextNode('\u2713'));
      var dep = this.deps[i];
      b.addEventListener('click', function() {
	console.log('Tick');
	dep.done = !dep.done;
	redraw();
      });
      deplist.appendChild(dep.render(b));
    }
    out.appendChild(deplist);
  }
  return out;
}

var SHOPPING = [];

function onLoad() {
  var partSelect = document.getElementById('part');
  for (var part in PARTS) {
    var opt = document.createElement('option');
    opt.value = part;
    opt.appendChild(document.createTextNode(part));
    partSelect.appendChild(opt);
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
  var topList = document.createElement('ul');
  var len = SHOPPING.length;
  for (var i = 0; i < len; ++i) {
    var del = document.createElement('button');
    var delIx = i;
    del.addEventListener('click', function() {
      console.log('Del ' + delIx);
      SHOPPING.splice(delIx, 1);
      redraw();
    });
    del.appendChild(document.createTextNode('-'));
    topList.appendChild(SHOPPING[i].render(del));
  }
  content.appendChild(topList);

  var shoppingJSON = {'list':[]};
  for (var i = 0; i < len; ++i) {
    shoppingJSON.list.push(SHOPPING[i].toJSON());
  }
  localStorage.setItem('shopping', JSON.stringify(shoppingJSON));
}

function addItem() {
  console.log('Add Item');
  SHOPPING.push(new Item({'name': document.getElementById('part').value, 'count': parseInt(document.getElementById('count').value)}));
  redraw();
}
