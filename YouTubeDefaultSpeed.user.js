// ==UserScript==
// @name        YoutubeDefaultSpeed
// @namespace   youtubedefaultspeed
// @description Set a default playback rate for YouTube videos.
// @include     https://www.youtube.com/*
// @include     http://www.youtube.com/*
// @version     1
// @grant       none
// @require     https://greasyfork.org/scripts/10208-gm-api-script/code/GM%20API%20script.js?version=54964
// @run-at      document-end
// ==/UserScript==

// Needs to emulate Greasemonkey APIs since specifying a "grant" other than none will enable the sandbox,
// which blocks access to the movie_player YouTube object

(function() {
  var RATE_OPTIONS = ["0.25", "0.5", "1", "1.25", "1.5", "2", "2.2", "2.5", "2.7", "3"];
  
  function getMoviePlayer(callback) {
    if (typeof movie_player === "undefined" ||
        typeof movie_player.setPlaybackRate !== "function") {
      window.setTimeout(function() { getMoviePlayer(callback); }, 5000);
    }
    else {
      callback(movie_player);
    }
  }

  function setPlaybackRate(r) {
    getMoviePlayer(function (player) {
      console.log("playback rate: " + r);
      player.setPlaybackRate(r);
    });

    (function force(r) {
      var es = document.getElementsByClassName("video-stream");
      if (es.length < 1 || es[0] === undefined || es[0].playbackRate === undefined) {
        setTimeout(function(){force(r);}, 1000);
        return;
      }
      es[0].playbackRate = r;
    })(r);
  }

  function setPlaybackRateToPreference() {
      var r = GM_getValue("playbackRate", 1);
      setPlaybackRate(r);
  }

  function onElementSourceUpdate(target, callback) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        callback();
      });
    });
    observer.observe(target, {attributes: true, attributeFilter: ["src"]});
  }
  
  function getVideoElement(callback) {
    var videoElements = document.getElementsByTagName("video");
    if (videoElements.Length <= 0 || typeof videoElements[0] === "undefined") {
      window.setTimeout(function() { getVideoElement(callback); }, 500);
    }
    else {
      callback(videoElements[0]);
    }
  }
  
  function handleRateButtonClick(rate) {
    // save as new default
    GM_setValue("playbackRate", rate);
    
    // set playback rate
    setPlaybackRate(rate);
  }
  
  function injectButtons() {
    var head = document.getElementById("yt-masthead-user");
    
    var form = document.createElement("form");
    
    RATE_OPTIONS.forEach(function (rate) {
      var input = document.createElement("input");
      input.type = "radio";
      input.name = "playbackRate";
      input.id = "playbackRate" + rate;
      input.onclick = function () { handleRateButtonClick(rate); };
      input.checked = (rate == GM_getValue("playbackRate", 1));
      var label = document.createElement("label");
      label.htmlFor = "playbackRate" + rate;
      label.innerHTML = rate;
      label.style = "margin-right: 5px";
      form.appendChild(input);
      form.appendChild(label);
    });
    
    head.appendChild(form);
  }
  
  function main() {
    if (window.self != window.top) return;
    
    // add buttons
    injectButtons();
    
    // immediately try to change playback rate
    setPlaybackRateToPreference();
    
    // apply playback rate again if video changes
    getVideoElement(function (video) {
      if (video.hasAttribute("src")) console.log("video source changed: " + video.src);
      onElementSourceUpdate(video, function () { 
        console.log("video source changed: " + video.src);
        setPlaybackRateToPreference();
      });
    });
  }

  try {
    main();
  }
  catch (e) {
    console.log(e);
  }

})();
