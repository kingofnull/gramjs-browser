"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SenderGetter = void 0;
const api_1 = require("../api");
const util_1 = require("util");
const Helpers_1 = require("../../Helpers");
const chatGetter_1 = require("./chatGetter");
class SenderGetter extends chatGetter_1.ChatGetter {
    [util_1.inspect.custom]() {
        return Helpers_1.betterConsoleLog(this);
    }
    static initSenderClass(c, { senderId, sender, inputSender }) {
        c._senderId = senderId;
        c._sender = sender;
        c._inputSender = inputSender;
        c._client = undefined;
    }
    get sender() {
        return this._sender;
    }
    async getSender() {
        if (this._client &&
            (!this._sender ||
                (this._sender instanceof api_1.Api.Channel && this._sender.min)) &&
            (await this.getInputSender())) {
            try {
                this._sender = await this._client.getEntity(this._inputSender);
            }
            catch (e) {
                await this._refetchSender();
            }
        }
        return this._sender;
    }
    get inputSender() {
        if (!this._inputSender && this._senderId && this._client) {
            try {
                this._inputSender = this._client._entityCache.get(this._senderId);
            }
            catch (e) { }
        }
        return this._inputSender;
    }
    async getInputSender() {
        if (!this.inputSender && this._senderId && this._client) {
            await this._refetchSender();
        }
        return this._inputSender;
    }
    get senderId() {
        return this._senderId;
    }
    async _refetchSender() { }
}
exports.SenderGetter = SenderGetter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZGVyR2V0dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vZ3JhbWpzL3RsL2N1c3RvbS9zZW5kZXJHZXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsZ0NBQTZCO0FBQzdCLCtCQUErQjtBQUMvQiwyQ0FBaUQ7QUFDakQsNkNBQTBDO0FBUTFDLE1BQWEsWUFBYSxTQUFRLHVCQUFVO0lBS3hDLENBQUMsY0FBTyxDQUFDLE1BQU0sQ0FBQztRQUNaLE9BQU8sMEJBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVELE1BQU0sQ0FBQyxlQUFlLENBQ2xCLENBQU0sRUFDTixFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFvQztRQUVuRSxDQUFDLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUN2QixDQUFDLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUNuQixDQUFDLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztRQUM3QixDQUFDLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBSSxNQUFNO1FBQ04sT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3hCLENBQUM7SUFFRCxLQUFLLENBQUMsU0FBUztRQUNYLElBQ0ksSUFBSSxDQUFDLE9BQU87WUFDWixDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU87Z0JBQ1YsQ0FBQyxJQUFJLENBQUMsT0FBTyxZQUFZLFNBQUcsQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM5RCxDQUFDLE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLEVBQy9CO1lBQ0UsSUFBSTtnQkFDQSxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQWEsQ0FBQyxDQUFDO2FBQ25FO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ1IsTUFBTSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7YUFDL0I7U0FDSjtRQUVELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN4QixDQUFDO0lBRUQsSUFBSSxXQUFXO1FBQ1gsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ3RELElBQUk7Z0JBQ0EsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQzdDLElBQUksQ0FBQyxTQUFTLENBQ2pCLENBQUM7YUFDTDtZQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUU7U0FDakI7UUFDRCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDN0IsQ0FBQztJQUVELEtBQUssQ0FBQyxjQUFjO1FBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNyRCxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztTQUMvQjtRQUNELE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztJQUM3QixDQUFDO0lBRUQsSUFBSSxRQUFRO1FBQ1IsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQzFCLENBQUM7SUFFRCxLQUFLLENBQUMsY0FBYyxLQUFJLENBQUM7Q0FDNUI7QUEvREQsb0NBK0RDIn0=