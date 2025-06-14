import { v4 as uuidv4 } from 'uuid';
import { GetTypesResult, room } from './types';

export function handelStart(roomArr: Array<room>, socket: any, cb: Function, io: any): void {
  console.log(`handelStart called for socket: ${socket.id}`);
  console.log(`Current roomArr size: ${roomArr.length}`);

  // check available rooms
  let availableroom = checkAvailableRoom();
  if (availableroom.is) {
    console.log(`Found available room: ${availableroom.roomid}. Joining as p2.`);
    socket.join(availableroom.roomid);
    cb('p2');
    closeRoom(availableroom.roomid);
    if (availableroom?.room) {
      console.log(`Emitting remote-socket to p1: ${availableroom.room.p1.id} and p2: ${socket.id}`);
      io.to(availableroom.room.p1.id).emit('remote-socket', socket.id);
      socket.emit('remote-socket', availableroom.room.p1.id);
      socket.emit('roomid', availableroom.room.roomid);
    }
  }
  // if no available room, create one
  else {
    let roomid = uuidv4();
    console.log(`No available room. Creating new room: ${roomid}. Joining as p1.`);
    socket.join(roomid);
    roomArr.push({
      roomid,
      isAvailable: true,
      p1: {
        id: socket.id,
      },
      p2: {
        id: null,
      }
    });
    cb('p1');
    socket.emit('roomid', roomid);
  }




  /**
   * 
   * @param roomid 
   * @desc search though roomArr and 
   * make isAvailable false, also se p2.id 
   * socket.id
   */
  function closeRoom(roomid: string): void {
    console.log(`closeRoom called for room: ${roomid}, by socket: ${socket.id}`);
    for (let i = 0; i < roomArr.length; i++) {
      if (roomArr[i].roomid == roomid) {
        console.log(`Closing room ${roomid}. Setting p2.id to ${socket.id} and isAvailable to false.`);
        roomArr[i].isAvailable = false;
        roomArr[i].p2.id = socket.id;
        break;
      }
    }
  }


  /**
   * 
   * @returns Object {is, roomid, room}
   * is -> true if foom is available
   * roomid -> id of the room, could be empth
   * room -> the roomArray, could be empty 
   */
  function checkAvailableRoom(): { is: boolean, roomid: string, room: room | null } {
    console.log(`checkAvailableRoom called.`);
    for (let i = 0; i < roomArr.length; i++) {
      if (roomArr[i].isAvailable) {
        console.log(`Found available room: ${roomArr[i].roomid}`);
        return { is: true, roomid: roomArr[i].roomid, room: roomArr[i] };
      }
      if (roomArr[i].p1.id == socket.id || roomArr[i].p2.id == socket.id) {
        console.log(`Socket ${socket.id} is already in a room.`);
        return { is: false, roomid: "", room: null };
      }
    }

    console.log(`No available rooms found.`);
    return { is: false, roomid: '', room: null };
  }
}

/**
 * @desc handels disconnceition event
 */
export function handelDisconnect(disconnectedId: string, roomArr: Array<room>, io: any) {
  console.log(`handelDisconnect called for socket: ${disconnectedId}`);
  for (let i = 0; i < roomArr.length; i++) {
    if (roomArr[i].p1.id == disconnectedId) {
      console.log(`Disconnected socket ${disconnectedId} was p1 in room ${roomArr[i].roomid}.`);
      io.to(roomArr[i].p2.id).emit("disconnected");
      if (roomArr[i].p2.id) {
        console.log(`Moving p2 (${roomArr[i].p2.id}) to p1 slot in room ${roomArr[i].roomid}.`);
        roomArr[i].isAvailable = true;
        roomArr[i].p1.id = roomArr[i].p2.id;
        roomArr[i].p2.id = null;
      }
      else {
        console.log(`Room ${roomArr[i].roomid} is empty. Removing room.`);
        roomArr.splice(i, 1);
      }
    } else if (roomArr[i].p2.id == disconnectedId) {
      console.log(`Disconnected socket ${disconnectedId} was p2 in room ${roomArr[i].roomid}.`);
      io.to(roomArr[i].p1.id).emit("disconnected");
      if (roomArr[i].p1.id) {
        console.log(`Making room ${roomArr[i].roomid} available again.`);
        roomArr[i].isAvailable = true;
        roomArr[i].p2.id = null;
      }
      else {
        console.log(`Room ${roomArr[i].roomid} is empty. Removing room.`);
        roomArr.splice(i, 1);
      }
    }
  }
}


// get type of person (p1 or p2)
export function getType(id: string, roomArr: Array<room>): GetTypesResult {
  console.log(`getType called for id: ${id}`);
  for (let i = 0; i < roomArr.length; i++) {
    if (roomArr[i].p1.id == id) {
        console.log(`ID ${id} is p1 in room ${roomArr[i].roomid}.`);
        return { type: 'p1', p2id: roomArr[i].p2.id };
    } else if (roomArr[i].p2.id == id) {
      console.log(`ID ${id} is p2 in room ${roomArr[i].roomid}.`);
      return { type: 'p2', p1id: roomArr[i].p1.id };
    }
  }

  console.log(`ID ${id} not found in any room.`);
  return false;
}