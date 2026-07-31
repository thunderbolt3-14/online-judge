import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  auth: (cb) => {
    cb({ token: localStorage.getItem('token') });
  },
});

export default socket;