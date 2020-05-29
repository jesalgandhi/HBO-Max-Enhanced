// -------- utils -------- //

// restrict a number to a certain boundary
clamp = (num, min, max) => {
    return Math.min(Math.max(num, min), max);
}

// -------- globals -------- //

// dev (access different functions)
const dev = false;

// url with video/media in it
const mediaUrlRegex = RegExp('^https://play.hbo(now|max).com/(feature|episode|extra)/.+$');

// assets
const pauseIcon = 'assets/images/buttons/desktop/icn_player_pause.png';
const back10 = 'assets/images/player_controls/desktop/btn_10back_default.png'; // icon for rewinding video
const volHigh = 'assets/images/player_controls/desktop/btn_volume_2_default.png'; // icon for high volume
const volLow = 'assets/images/player_controls/desktop/btn_volume_0_default.png'; // icon for low volume

// elements
let videoElement = null; // video element
let videoParentElement = null; // dominating parent element that holds video and all related elements

// search
let searching      = true;
let searchInterval = null;

// -------- listening for changes -------- //

onChange = () => {
    let url = window.location.href;
    if (mediaUrlRegex.test(url)) {
        restartSearchInterval();
    }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === 'url-change') {
        if (dev) console.log('urlChange');
        onChange();
    }
});

// -------- search for elements -------- //

resetSearch = () => {
    clearInterval(searchInterval);
    searching = true;
    videoElement = null;
    videoParentElement = null;
}

allElementsFound = () => {
    return videoElement && videoParentElement;
}

stopSearch = () => {
    clearInterval(searchInterval);
    searching = false;
}

restartSearchInterval = () => {
    resetSearch();
    searchInterval = setInterval(() => {
        if (dev) console.log('searching...');

        // VIDEO ELEMENT
        if (!videoElement) {
            const videoElements = document.getElementsByTagName('video');
            if (videoElements.length === 1) videoElement = videoElements[0];
            else if (videoElements.length > 1) {
                console.error('Error: More than one video element in current DOM.');
            }
        }

        // VIDEO PARENT ELEMENT
        if (!videoParentElement) {
            videoParentElement = [...document.getElementsByClassName('default')].find(el => {
                return el.style['backgroundColor'] === 'rgb(0, 0, 0)' && el.style['userSelect'] === 'none';
            });
            addFadeIcons()
        }

        if (allElementsFound()) {
            if (dev) {
                console.log('videoElement', videoElement);
                console.log('videoParentElement', videoParentElement);
            }
            stopSearch();
        }

    }, 500);
}

// -------- key events -------- //

document.onkeydown = e => {
    const key = e.keyCode;

    if (dev) console.log('key', key);

    switch (key) {
        case 32: // space
            if (videoElement) e.preventDefault();
            break;
        case 37: // <-
            skip(-10);
            break;
        case 39: // ->
            skip(10);
            break;
        case 38: // up
            if (dev) alterVolume(e, 0.1);
            break;
        case 40: // down
            if (dev) alterVolume(e, -0.1);
            break;
        default:
            break;
    }
}

skip = (amt) => {
    if (videoElement) {
        const newTime = videoElement.currentTime + amt;
        videoElement.currentTime = clamp(newTime, 0, videoElement.duration);
    }
}

alterVolume = (e, amt) => {
    // changing this doesn't reflect what's displayed on screen!!
    if (videoElement) {
        e.preventDefault();
        const newVolume = videoElement.volume + amt;
        videoElement.volume = clamp(newVolume, 0, 1);
    }
}

addFadeIcons = () => {
    if (videoParentElement && dev) {

        // find already existing icon
        var pauseElement = [...videoParentElement.getElementsByClassName("default")].find(el => {
            return el.style['backgroundImage'] === 'url("' + pauseIcon + '")';
        })
        if (!pauseElement) return;

        var parentWithDims = pauseElement?.parentElement?.parentElement?.parentElement;
        if (!parentWithDims) return;

        var left = parentWithDims.style.left;
        var top = parentWithDims.style.top;
        var height = parentWithDims.style.height;
        var width = parentWithDims.style.width;

        var iconDiv = document.createElement("div");
        iconDiv.classList.add("iconInjected");

        iconDiv.style.left = left;
        iconDiv.style.top = top;
        iconDiv.style.height = height;
        iconDiv.style.width = width;

        videoParentElement.appendChild(iconDiv);
    }
}

// -------- start -------- //

onChange();
