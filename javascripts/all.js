function ready(a){"loading"!=document.readyState?a():document.addEventListener("DOMContentLoaded",a)}function assignRootClassForBgImage(){var a=document.querySelector("html#root");if(a){var n="image-"+(Math.floor(4*Math.random())+1);a.classList?a.classList.add(n):a.className+=" "+n}}function fillRandSpans(){for(var a=document.querySelectorAll("[rel=rand]"),n=0;n<a.length;n++){var e=Math.floor(Math.random()*a[n].children.length);a[n].innerHTML=a[n].children[e].innerHTML}}ready(function(){assignRootClassForBgImage(),fillRandSpans()});