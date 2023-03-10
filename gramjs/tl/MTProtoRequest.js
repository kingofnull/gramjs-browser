"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MTProtoRequest = void 0;
class MTProtoRequest {
    constructor() {
        this.sent = false;
        this.msgId = 0; // long
        this.sequence = 0;
        this.dirty = false;
        this.sendTime = 0;
        this.confirmReceived = false;
        // These should be overrode
        this.constructorId = 0;
        this.confirmed = false;
        this.responded = false;
    }
    // these should not be overrode
    onSendSuccess() {
        this.sendTime = new Date().getTime();
        this.sent = true;
    }
    onConfirm() {
        this.confirmReceived = true;
    }
    needResend() {
        return (this.dirty ||
            (this.confirmed &&
                !this.confirmReceived &&
                new Date().getTime() - this.sendTime > 3000));
    }
    // These should be overrode
    onSend() {
        throw Error("Not overload " + this.constructor.name);
    }
    onResponse(buffer) { }
    onException(exception) { }
}
exports.MTProtoRequest = MTProtoRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTVRQcm90b1JlcXVlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9ncmFtanMvdGwvTVRQcm90b1JlcXVlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsTUFBYSxjQUFjO0lBV3ZCO1FBQ0ksSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7UUFDbEIsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPO1FBQ3ZCLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBRWxCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO1FBRTdCLDJCQUEyQjtRQUUzQixJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQztRQUN2QixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUN2QixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUMzQixDQUFDO0lBRUQsK0JBQStCO0lBQy9CLGFBQWE7UUFDVCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDckMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDckIsQ0FBQztJQUVELFNBQVM7UUFDTCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztJQUNoQyxDQUFDO0lBRUQsVUFBVTtRQUNOLE9BQU8sQ0FDSCxJQUFJLENBQUMsS0FBSztZQUNWLENBQUMsSUFBSSxDQUFDLFNBQVM7Z0JBQ1gsQ0FBQyxJQUFJLENBQUMsZUFBZTtnQkFDckIsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxDQUNuRCxDQUFDO0lBQ04sQ0FBQztJQUVELDJCQUEyQjtJQUMzQixNQUFNO1FBQ0YsTUFBTSxLQUFLLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELFVBQVUsQ0FBQyxNQUFjLElBQUcsQ0FBQztJQUU3QixXQUFXLENBQUMsU0FBZ0IsSUFBRyxDQUFDO0NBQ25DO0FBdERELHdDQXNEQyJ9