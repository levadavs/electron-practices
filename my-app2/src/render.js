const videoSelectBtn = document.getElementById('videoSelectBtn');
/*lv mark3*/
const openBtn = document.getElementById('openBtn');
/*end lv mark3*/
const { desktopCapturer, remote } = require('electron');
const { Menu } = remote;
const videoElement = document.querySelector('video');
const { writeFile } = require("fs");
const { dialog } = remote;
let mediaRecorder;
const recordedChunks = [];
async function selectSource(source) {
    videoSelectBtn.innerText = source.name;
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };
    try{
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        videoElement.srcObject = stream;
        await videoElement.play();

        const options = {mimeType: 'video/webm; codecs=vp9'};
        /*lv mark1*/
        mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleStop;
        /*end lv mark1*/
    } catch(err) {
        console.log("There is an error with stream");
    }
}
videoSelectBtn.onclick = getVideoSources;

/*lv mark3*/
openBtn.onclick = getFileToPlay;
async function getFileToPlay() {
    dialog.showOpenDialog({
        properties: ['openFile']
    }).then(result => {
        let assetURL = result.filePaths;
        let mimeCodec = 'video/webm; codecs=vp9"';

        if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
            let mediaSource = new MediaSource();
            //console.log(mediaSource.readyState); // closed
            videoElement.src = URL.createObjectURL(mediaSource);
            mediaSource.addEventListener('sourceopen', sourceOpen);
        } else {
            console.error('Unsupported MIME type or codec: ', mimeCodec);
        }

        function sourceOpen (_) {
            //console.log(this.readyState); // open
            let mediaSource = this;
            let sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
            fetchAB(assetURL, function (buf) {
                sourceBuffer.addEventListener('updateend', function (_) {
                    mediaSource.endOfStream();
                    videoElement.play();
                    //console.log(mediaSource.readyState); // ended
                });
                sourceBuffer.appendBuffer(buf);
            });
        };

        function fetchAB (url, cb) {
            //console.log(url);
            let xhr = new XMLHttpRequest;
            xhr.open('get', url);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function () {
                cb(xhr.response);
            };
            xhr.send();
        };
        //console.log(result.filePaths);
    }).catch(err => {
        console.log(err);
    });
}
/*end lv mark3*/

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types:['window', 'screen']
    });
    console.log(inputSources);
    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );
    videoOptionsMenu.popup();
}

/*lv mark2*/
const startBtn = document.getElementById("startBtn");
startBtn.onclick = e => {
    mediaRecorder.start();
    startBtn.classList.add("is-danger");
    startBtn.innerText = "Запись";
};

const stopBtn = document.getElementById("stopBtn");

stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove("is-danger");
    startBtn.innerText = "Старт";
};

// Captures all recorded chunks
function handleDataAvailable(e) {
    console.log("Видео записано!");
    recordedChunks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: "video/webm; codecs=vp9"
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: "Save video",
        defaultPath: `vid-${Date.now()}.webm`
    });

    console.log(filePath);

    writeFile(filePath, buffer, () => console.log("video saved successfully!"));
}
/*end lv mark2*/