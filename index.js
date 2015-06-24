var createVNode = require('virtual-dom/h');
var svg = require('virtual-dom/virtual-hyperscript/svg');
var htmltree = require("htmltree");
var camel = require('to-camel-case');

module.exports = virtualHTML;

function virtualHTML (html, callback) {
  callback = callback || defaultCb;
  if (typeof html == 'function') html = html();
  var res = null;

  htmltree(html, function (err, dom) {
    if (err) return callback(err);
    res = vnode(dom.root[0]);
    callback(undefined, res);
  });

  return res;

  function defaultCb (err) {
    if (err) throw new Error(err);
  }
}

function vnode(parent, svgParent) {
  if (parent.type == "text") return parent.data;
  if (parent.type != "tag") return;

  var isSVG = parent.name === 'svg' || svgParent;
  var children;
  var child;
  var len;
  var i;

  if (parent.children.length) {
    children = [];
    len = parent.children.length;
    i = -1;

    while (++i < len) {
      child = vnode(parent.children[i], isSVG);
      if (!child) continue;
      children.push(child);
    }
  }

  var properties = createProperties(parent.attributes);
  if (isSVG) {
    return svg(parent.name, properties, children, true);
  }
  return createVNode(parent.name, properties, children);
}

function style (raw) {
  if (!raw) return {};

  var result = {};
  var fields = raw.split(/;\s?/);
  var len = fields.length;
  var i = -1;
  var s;
  var field;

  while (++i < len) {
    field = fields[i].trim();
    if (!field) continue;
    s = field.indexOf(':');
    result[field.slice(0, s)] = field.slice(s + 1).trim();
  }

  return result;
}

function createProperties (attributes) {
  var properties = {};
  var attrs = {};

  for (var key in attributes) {
    if (!attributes.hasOwnProperty(key)) continue;

    switch (key) {
    case 'style':
      properties.style = style(attributes.style);
      break;
    case 'class':
      properties.className = attributes['class'];
      break;
    case 'for':
      properties.htmlFor = attributes['for'];
      break;
    default:
      if (key.indexOf('data-') === 0) {
        addDataSet(properties, key, attributes[key]);
      } else {
        attrs[key] = attributes[key];
      }
    }
  }

  properties.attributes = attrs;

  return properties;
}

function addDataSet (properties, key, value) {
  properties.dataset || (properties.dataset = {});
  properties.dataset[camel(key.slice(5))] = value;
}
