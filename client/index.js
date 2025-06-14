import { io } from 'socket.io-client';

// Global State
let peer;
const myVideo = document.getElementById('my-video');
const strangerVideo = document.getElementById('video');
const sendButton = document.getElementById('send');
const chatInput = document.getElementById('chat-input');
const stopButton = document.getElementById('stop-call');
const messagesContainer = document.querySelector('.messages-container .wrapper');
const modal = document.querySelector('.modal');

let remoteSocket;
let type;
let roomid;


// starts media capture
function start() {
  console.log('Attempting to get user media...');
  navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    .then(stream => {
      console.log('User media stream obtained:', stream);
      if (peer) {
        myVideo.srcObject = stream;
        myVideo.muted = true;
        stream.getTracks().forEach(track => {
          peer.addTrack(track, stream);
          console.log('Added track to peer connection:', track);
        });
      }
    })
    .catch(ex => {
      console.error('Error accessing user media:', ex);
    });
}

// connect ot server
const socket = io('http://localhost:8000');


// disconnectin event
socket.on('disconnected', () => {
  location.href = `/?disconnect`
})

// Handle stop button click
stopButton.onclick = () => {
  socket.emit('disconnect-call', roomid);
  // Optionally, reset UI or redirect after disconnecting
  location.href = '/';
};


/// --------- Web rtc related ---------

// Start 
modal.style.display = 'flex'; // Show modal when starting to search
socket.emit('start', (person) => {
  type = person;

  // create a peer conncection
  peer = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // Using a public free TURN server from OpenRelayProject.org
      { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' }
    ]
  });

  // Handle incoming remote tracks
  peer.ontrack = e => {
    console.log('Received remote track:', e.track, 'from stream:', e.streams[0]);
    strangerVideo.srcObject = e.streams[0];
    strangerVideo.play();
  }

  // on negociation needed 
  peer.onnegotiationneeded = async e => {
    // webrtc(); // Removed direct call here
  }

  // send ice candidates to remotesocket
  peer.onicecandidate = e => {
    if (e.candidate && remoteSocket) { // Only emit if candidate exists and remoteSocket is known
      socket.emit('ice:send', { candidate: e.candidate, to: remoteSocket });
    } else if (e.candidate) {
      console.warn('ICE candidate generated, but remoteSocket is not yet known. Candidate:', e.candidate);
    }
  }

  // start media capture
  start();

});


// Get remote socket

socket.on('remote-socket', (id) => {
  remoteSocket = id;

  // hide the spinner
  modal.style.display = 'none'; // Hide modal only when a remote socket is found

  // The peer connection and media capture should already be set up by the 'start' event.
  // For p1, create offer now that remoteSocket is known
  if (type == 'p1') {
    webrtc();
  }
});


// creates offer if 'type' = p1
async function webrtc() {

  if (type == 'p1') {
    if (!remoteSocket) {
      console.warn('Cannot create offer: remoteSocket not yet known. Retrying when remoteSocket is set.');
      return; // Do not proceed if remoteSocket is not set
    }
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit('sdp:send', { sdp: peer.localDescription, to: remoteSocket });
  }

}


// recive sdp sent by remote socket 
socket.on('sdp:reply', async ({ sdp, from }) => {
  console.log(`Received SDP reply (type: ${sdp.type}) from: ${from}`);
  // set remote description 
  await peer.setRemoteDescription(new RTCSessionDescription(sdp));

  // if type == p2, create answer
  if (type == 'p2') {
    if (!remoteSocket) { // Also check for remoteSocket before sending answer
      console.warn('Cannot create answer: remoteSocket not yet known. Retrying when remoteSocket is set.');
      return;
    }
    const ans = await peer.createAnswer();
    await peer.setLocalDescription(ans);
    socket.emit('sdp:send', { sdp: peer.localDescription, to: remoteSocket });
  }
});


// recive ice-candidate form remote socket
socket.on('ice:reply', async ({ candidate, from }) => {
  console.log(`Received ICE candidate from: ${from}`, candidate);
  await peer.addIceCandidate(candidate);
});




/// ----------- Handel Messages Logic -----------


// get room id
socket.on('roomid', id => {
  roomid = id;
})

// handel send button click
sendButton.onclick = e => {

  // get input and emit
  let input = chatInput.value;
  if (input.trim() === '') return; // Prevent sending empty messages
  socket.emit('send-message', input, type, roomid);

  // set input in local message box as 'YOU'
  let msghtml = `
  <div class="msg sent">
  ${input}
  </div>
  `
  messagesContainer.innerHTML += msghtml;

  // clear input
  chatInput.value = '';
  messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom
}

// on get message
socket.on('get-message', (input, type) => {

  // set recived message from server in chat box
  let msghtml = `
  <div class="msg received">
  ${input}
  </div>
  `
  messagesContainer.innerHTML += msghtml;
  messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom

})