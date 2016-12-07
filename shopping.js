var Item = function(name, count) {
  this.name = name;
  this.count = count;
  this.done = false;
  this.deps = [];
  for (var dep in PARTS[this.name]) {
    this.deps.push(new Item(dep, count*PARTS[this.name][dep]));
  }
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

function onLoad() {
  var partSelect = document.getElementById('part');
  for (var part in PARTS) {
    var opt = document.createElement('option');
    opt.value = part;
    opt.appendChild(document.createTextNode(part));
    partSelect.appendChild(opt);
  }
  redraw();
}

var SHOPPING = [];

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
}

function addItem() {
  console.log('Add Item');
  SHOPPING.push(new Item(document.getElementById('part').value, document.getElementById('count').value));
  redraw();
}
