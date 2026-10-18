/* 原生 App 化锁定：阻止 iOS 捏合/双击缩放、非滚动区整页拖动；注册 SW */
(function(){
  var opt={passive:false};
  ['gesturestart','gesturechange','gestureend'].forEach(function(t){document.addEventListener(t,function(e){e.preventDefault()},opt)});
  document.addEventListener('dblclick',function(e){e.preventDefault()},opt);
  var lastEnd=0;
  document.addEventListener('touchend',function(e){var n=Date.now();if(n-lastEnd<300&&e.cancelable&&!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)){e.preventDefault();var t=e.target;if(t&&t.click)t.click()}lastEnd=n},opt);
  function scrollable(el,dx,dy){
    for(;el&&el!==document.body&&el.nodeType===1;el=el.parentElement){
      var cs=getComputedStyle(el);
      if(/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))return true;
      if(dy&&/(auto|scroll)/.test(cs.overflowY)&&el.scrollHeight>el.clientHeight+1)return true;
      if(dx&&/(auto|scroll)/.test(cs.overflowX)&&el.scrollWidth>el.clientWidth+1)return true;
      if(cs.touchAction==='none')return true;
    }
    return false;
  }
  var sx=0,sy=0;
  document.addEventListener('touchstart',function(e){if(e.touches.length===1){sx=e.touches[0].clientX;sy=e.touches[0].clientY}},{passive:true});
  document.addEventListener('touchmove',function(e){
    if(e.touches.length>1){e.preventDefault();return}
    var dx=Math.abs(e.touches[0].clientX-sx),dy=Math.abs(e.touches[0].clientY-sy);
    if(!scrollable(e.target,dx>dy,dy>=dx)&&e.cancelable)e.preventDefault();
  },opt);
  if('serviceWorker' in navigator&&location.protocol!=='file:')addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
})();
