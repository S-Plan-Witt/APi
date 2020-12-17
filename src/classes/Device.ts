export class Device {
    constructor(platform: string, id: string, userId: number, timeAdded: string) {
        this._platform = platform;
        this._id = id;
        this._userId = userId;
        this._timeAdded = timeAdded;
    }

    private _platform: string;

    get platform(): string {
        return this._platform;
    }

    set platform(value: string) {
        this._platform = value;
    }

    private _id: string;

    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this._id = value;
    }

    private _userId: number;

    get userId(): number {
        return this._userId;
    }

    set userId(value: number) {
        this._userId = value;
    }

    private _timeAdded: string;

    get timeAdded(): string {
        return this._timeAdded;
    }

    set timeAdded(value: string) {
        this._timeAdded = value;
    }
}