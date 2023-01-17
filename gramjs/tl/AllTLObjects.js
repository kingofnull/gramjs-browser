"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tlobjects = exports.LAYER = void 0;
const _1 = require("./");
exports.LAYER = 131;
const tlobjects = {};
exports.tlobjects = tlobjects;
for (const tl of Object.values(_1.Api)) {
    if ("CONSTRUCTOR_ID" in tl) {
        tlobjects[tl.CONSTRUCTOR_ID] = tl;
    }
    else {
        for (const sub of Object.values(tl)) {
            tlobjects[sub.CONSTRUCTOR_ID] = sub;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWxsVExPYmplY3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vZ3JhbWpzL3RsL0FsbFRMT2JqZWN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx5QkFBeUI7QUFFWixRQUFBLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDekIsTUFBTSxTQUFTLEdBQVEsRUFBRSxDQUFDO0FBV2pCLDhCQUFTO0FBVGxCLEtBQUssTUFBTSxFQUFFLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFHLENBQUMsRUFBRTtJQUNqQyxJQUFJLGdCQUFnQixJQUFJLEVBQUUsRUFBRTtRQUN4QixTQUFTLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztLQUNyQztTQUFNO1FBQ0gsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1lBQ2pDLFNBQVMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEdBQUcsR0FBRyxDQUFDO1NBQ3ZDO0tBQ0o7Q0FDSiJ9