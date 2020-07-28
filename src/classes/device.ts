
export class Device {
    private _platform: string;
    private _id: string;
    private _userId: number;
    private _timeAdded: string;


    constructor(platform: string, id: string, userId: number, timeAdded: string) {
        this._platform = platform;
        this._id = id;
        this._userId = userId;
        this._timeAdded = timeAdded;
    }


    get platform(): string {
        return this._platform;
    }

    set platform(value: string) {
        this._platform = value;
    }

    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this._id = value;
    }

    get userId(): number {
        return this._userId;
    }

    set userId(value: number) {
        this._userId = value;
    }

    get timeAdded(): string {
        return this._timeAdded;
    }

    set timeAdded(value: string) {
        this._timeAdded = value;
    }
}