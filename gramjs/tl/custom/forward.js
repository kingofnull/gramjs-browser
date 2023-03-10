"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Forward = void 0;
const chatGetter_1 = require("./chatGetter");
const senderGetter_1 = require("./senderGetter");
const Helpers_1 = require("../../Helpers");
const Utils_1 = require("../../Utils");
const util_1 = require("util");
class Forward extends senderGetter_1.SenderGetter {
    constructor(client, original, entities) {
        super();
        // contains info for the original header sent by telegram.
        this.originalFwd = original;
        let senderId = undefined;
        let sender = undefined;
        let inputSender = undefined;
        let peer = undefined;
        let chat = undefined;
        let inputChat = undefined;
        if (original.fromId) {
            const ty = Helpers_1._entityType(original.fromId);
            if (ty === Helpers_1._EntityType.USER) {
                senderId = Utils_1.getPeerId(original.fromId);
                [sender, inputSender] = Utils_1._getEntityPair(senderId, entities, client._entityCache);
            }
            else if (ty === Helpers_1._EntityType.CHANNEL || ty === Helpers_1._EntityType.CHAT) {
                peer = original.fromId;
                [chat, inputChat] = Utils_1._getEntityPair(Utils_1.getPeerId(peer), entities, client._entityCache);
            }
        }
        chatGetter_1.ChatGetter.initChatClass(this, {
            chatPeer: peer,
            inputChat: inputChat,
        });
        senderGetter_1.SenderGetter.initSenderClass(this, {
            senderId: senderId,
            sender: sender,
            inputSender: inputSender,
        });
        this._client = client;
    }
    [util_1.inspect.custom]() {
        return Helpers_1.betterConsoleLog(this);
    }
}
exports.Forward = Forward;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yd2FyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2dyYW1qcy90bC9jdXN0b20vZm9yd2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBMEM7QUFDMUMsaURBQThDO0FBSTlDLDJDQUEyRTtBQUMzRSx1Q0FBd0Q7QUFDeEQsK0JBQStCO0FBRS9CLE1BQWEsT0FBUSxTQUFRLDJCQUFZO0lBTXJDLFlBQ0ksTUFBc0IsRUFDdEIsUUFBOEIsRUFDOUIsUUFBNkI7UUFFN0IsS0FBSyxFQUFFLENBQUM7UUFDUiwwREFBMEQ7UUFDMUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUM7UUFFNUIsSUFBSSxRQUFRLEdBQUcsU0FBUyxDQUFDO1FBQ3pCLElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQztRQUN2QixJQUFJLFdBQVcsR0FBRyxTQUFTLENBQUM7UUFDNUIsSUFBSSxJQUFJLEdBQUcsU0FBUyxDQUFDO1FBQ3JCLElBQUksSUFBSSxHQUFHLFNBQVMsQ0FBQztRQUNyQixJQUFJLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDMUIsSUFBSSxRQUFRLENBQUMsTUFBTSxFQUFFO1lBQ2pCLE1BQU0sRUFBRSxHQUFHLHFCQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3hDLElBQUksRUFBRSxLQUFLLHFCQUFXLENBQUMsSUFBSSxFQUFFO2dCQUN6QixRQUFRLEdBQUcsaUJBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3RDLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxHQUFHLHNCQUFjLENBQ2xDLFFBQVEsRUFDUixRQUFRLEVBQ1IsTUFBTSxDQUFDLFlBQVksQ0FDdEIsQ0FBQzthQUNMO2lCQUFNLElBQUksRUFBRSxLQUFLLHFCQUFXLENBQUMsT0FBTyxJQUFJLEVBQUUsS0FBSyxxQkFBVyxDQUFDLElBQUksRUFBRTtnQkFDOUQsSUFBSSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQ3ZCLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxHQUFHLHNCQUFjLENBQzlCLGlCQUFTLENBQUMsSUFBSSxDQUFDLEVBQ2YsUUFBUSxFQUNSLE1BQU0sQ0FBQyxZQUFZLENBQ3RCLENBQUM7YUFDTDtTQUNKO1FBQ0QsdUJBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFO1lBQzNCLFFBQVEsRUFBRSxJQUFJO1lBQ2QsU0FBUyxFQUFFLFNBQVM7U0FDdkIsQ0FBQyxDQUFDO1FBQ0gsMkJBQVksQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFO1lBQy9CLFFBQVEsRUFBRSxRQUFRO1lBQ2xCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsV0FBVyxFQUFFLFdBQVc7U0FDM0IsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7SUFDMUIsQ0FBQztJQS9DRCxDQUFDLGNBQU8sQ0FBQyxNQUFNLENBQUM7UUFDWixPQUFPLDBCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xDLENBQUM7Q0E4Q0o7QUFsREQsMEJBa0RDIn0=