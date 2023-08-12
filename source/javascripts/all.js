// MCCOLIN.com 2016

/**
 * Non-jQuery ready() loader
 * http://youmightnotneedjquery.com/
 **/
function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

/**
 * On page ready, perform initializations.
 **/
ready( function() {
  assignRootClassForBgImage();
  fillRandSpans();
});

/**
 * If on the root page, assign an image class from a random set
 * to allow for custom CSS background declarations.
 **/
function assignRootClassForBgImage() {
  var rootHtml = document.querySelector('html#root');
  if (rootHtml) {
    var className = "image-"+(Math.floor(Math.random() * 9) + 1);
    if (rootHtml.classList)
      rootHtml.classList.add(className);
    else
      rootHtml.className += ' ' + className;
  }
}

/**
 * Select a single span of content to render from the internals
 * of any span with rel=rand.
 **/
function fillRandSpans() {
  var rands = document.querySelectorAll('[rel=rand]');
  for (var i=0; i < rands.length; i++) {
    var idx = Math.floor(Math.random() * rands[i].children.length);
    rands[i].innerHTML = rands[i].children[idx].innerHTML;
  }
}
