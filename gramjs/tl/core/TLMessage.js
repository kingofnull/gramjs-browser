"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TLMessage = void 0;
class TLMessage {
    constructor(msgId, seqNo, obj) {
        this.msgId = msgId;
        this.seqNo = seqNo;
        this.obj = obj;
        this.classType = "constructor";
    }
}
exports.TLMessage = TLMessage;
TLMessage.SIZE_OVERHEAD = 12;
TLMessage.classType = "constructor";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVExNZXNzYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vZ3JhbWpzL3RsL2NvcmUvVExNZXNzYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLE1BQWEsU0FBUztJQVFsQixZQUFZLEtBQXdCLEVBQUUsS0FBYSxFQUFFLEdBQVE7UUFDekQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsU0FBUyxHQUFHLGFBQWEsQ0FBQztJQUNuQyxDQUFDOztBQWJMLDhCQWNDO0FBYlUsdUJBQWEsR0FBRyxFQUFFLENBQUM7QUFDbkIsbUJBQVMsR0FBRyxhQUFhLENBQUMifQ==