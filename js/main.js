/*
 * Copyright (c) 2013 Alex Gibson
 * Released under MIT license
 * http://alxgbsn.co.uk
 */

/*global clearInterval: false, clearTimeout: false, document: false, event: false, frames: false, history: false, Image: false, location: false, name: false, navigator: false, Option: false, parent: false, screen: false, setInterval: false, setTimeout: false, window: false, XMLHttpRequest: false, console: false */
/*global webkitAudioContext: false, AudioContext: false, requestAnimationFrame: false */

var myApp = (function () {

	'use strict';

	var nodes = {},                         //nodes object
        myAudioContext,                     //web audio context
        myAudioAnalyser,					//audio analyser
        mySpectrum,                         //audio apectrum graph
        myAudioBuffer,						//audio buffer data
        mySoundFile = 'loop.wav',	        //sound file
        mySound;							//sound source

	return {

		init: function () {
			var doc = document;

			//create an audio context
            if ('webkitAudioContext' in window) {
                myAudioContext = new webkitAudioContext();
            } else if ('AudioContext' in window) {
                myAudioContext = new AudioContext();
            } else {
                alert('Your device does not yet support the Web Audio API, sorry!');
                return;
            }

            myApp.loadSoundFile('sounds/' + mySoundFile);

            //creat master volume gain node
            nodes.volume = myAudioContext.createGainNode();
            nodes.volume.gain.value = 0.2;

            //create audio analyser node
            myAudioAnalyser = myAudioContext.createAnalyser();
            myAudioAnalyser.smoothingTimeConstant = 0.85;

            //animate spectrum analyser
            myApp.animateSpectrum();
		},

		/**
         * Helper method to request a sound file and call initialise on load
         * @param url (string)
         */
        loadSoundFile: function (url) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function (e) {
                console.log('Sound file loaded: ', url);
                myApp.initSound(this.response); // this.response is an ArrayBuffer.
            };
            xhr.send();
        },

        /**
         * Initialise audioBuffers by decoding mp3 audio data
         * @param arrayBuffer (arrayBuffer)
         */
        initSound: function (arrayBuffer) {
            myAudioContext.decodeAudioData(arrayBuffer, function (buffer) {
                myAudioBuffer = buffer;
                console.log('Sound file decoded: ', buffer);
                myApp.initControls();
            }, function (e) {
                //something went wrong loading the sounds, log an error
                console.error('Error decoding file', e);
            });
        },

        initControls: function () {
        	document.getElementById('play').addEventListener('click', myApp.playSound, false);
            document.getElementById('stop').addEventListener('click', myApp.stopSound, false);
            document.getElementById('track').innerHTML = 'Track: ' + mySoundFile;
            document.getElementById('duration').innerHTML = '(' + Math.round(myAudioBuffer.duration * 10) / 10 + 's)';
        },

        routeSound: function () {
			mySound = myAudioContext.createBufferSource();
            mySound.buffer = myAudioBuffer;
            mySound.loop = true;
        	mySound.connect(nodes.volume);

        	//connect master gain node to audio analyser
            nodes.volume.connect(myAudioAnalyser);

            //connect audio analyser to the speakers
            myAudioAnalyser.connect(myAudioContext.destination);
        },

        playSound: function () {
        	if (myAudioContext.activeSourceCount > 0) {
                mySound.noteOff(0);
            }
			myApp.routeSound();
            mySound.noteOn(0);
        },

        stopSound: function () {
            mySound.noteOff(0);
        },

        animateSpectrum: function () {
        	mySpectrum = requestAnimationFrame(myApp.animateSpectrum, document.getElementById('output'));
            myApp.drawSpectrum();
        },

        drawSpectrum: function () {
        	var canvas = document.querySelector('canvas'),
                ctx = canvas.getContext('2d'),
                width = 300,
                height = 300,
                bar_width = 10,
                barCount = Math.round(width / bar_width),
                freqByteData = new Uint8Array(myAudioAnalyser.frequencyBinCount),
                magnitude,
                i;

            canvas.width = width;
            canvas.height = height;

            ctx.clearRect(0, 0, width, height);
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            ctx.fillStyle = 'rgba(163, 227, 246, 0.7)';

            myAudioAnalyser.getByteFrequencyData(freqByteData);

            for (i = 0; i < barCount; i += 1) {
                magnitude = freqByteData[i];
                // some values need adjusting to fit on the canvas
                ctx.fillRect(bar_width * i, height, bar_width - 1, -magnitude * 1.15);
            }
        }
	};
}());

window.addEventListener("DOMContentLoaded", myApp.init, true);