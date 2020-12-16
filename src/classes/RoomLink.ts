/**
 * @typedef RoomLink
 * @property {string} date.required
 * @property {string} from.required
 * @property {string} to.required
 * @property {string} room.required
 * @property {string} id
 */
export class RoomLink {
    room: any;
    from: any;
    to: any;
    date: any;
    id: number;

    constructor(room: any, from: any, to: any, date: any) {
        this.room = room;
        this.from = from;
        this.to = to;
        this.date = date;
        this.id = 0
    }
}