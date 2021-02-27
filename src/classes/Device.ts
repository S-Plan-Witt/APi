/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * @typedef Device
 * @property {number} id
 * @property {string} userId.required
 * @property {DeviceType} platform.required
 * @property {number} device.required
 */
export class Device {
    public timeAdded: string;
    public id: number | null;
    public userId: number | null;
    public platform: DeviceType;
    public deviceIdentifier: string;
    public verified: boolean = true;

    constructor(platform: DeviceType, id: number | null, userId: number | null, timeAdded: string, deviceIdentifier: string) {
        this.platform = platform;
        this.id = id;
        this.userId = userId;
        this.timeAdded = timeAdded;
        this.deviceIdentifier = deviceIdentifier;
    }
}

export enum DeviceType {
    TELEGRAM = 0,
    APNS = 1,
    FIREBASE = 2,
    WEBPUSH = 3,
    MAIL = 4
}