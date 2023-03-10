"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Raw = void 0;
const common_1 = require("./common");
/**
 * The RAW updates that telegram sends. these are {@link Api.TypeUpdate} objects.
 * The are useful to handle custom events that you need like user typing or games.
 * @example
 * ```ts
 * client.addEventHandler((update) => {
 *   console.log("Received new Update");
 *   console.log(update);
 * });
 * ```
 */
class Raw extends common_1.EventBuilder {
    constructor(params) {
        super({ func: params.func });
        this.types = params.types;
    }
    async resolve(client) {
        this.resolved = true;
    }
    build(update, others = null) {
        return update;
    }
    filter(event) {
        if (this.types) {
            let correct = false;
            for (const type of this.types) {
                if (event instanceof type) {
                    correct = true;
                    break;
                }
            }
            if (!correct) {
                return;
            }
        }
        return super.filter(event);
    }
}
exports.Raw = Raw;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmF3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vZ3JhbWpzL2V2ZW50cy9SYXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUNBQXFEO0FBYXJEOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFhLEdBQUksU0FBUSxxQkFBWTtJQUdqQyxZQUFZLE1BQW9CO1FBQzVCLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUM3QixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDOUIsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBc0I7UUFDaEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7SUFDekIsQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFzQixFQUFFLFNBQWMsSUFBSTtRQUM1QyxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQWtCO1FBQ3JCLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNaLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNwQixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQzNCLElBQUksS0FBSyxZQUFZLElBQUksRUFBRTtvQkFDdkIsT0FBTyxHQUFHLElBQUksQ0FBQztvQkFDZixNQUFNO2lCQUNUO2FBQ0o7WUFDRCxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNWLE9BQU87YUFDVjtTQUNKO1FBQ0QsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9CLENBQUM7Q0FDSjtBQS9CRCxrQkErQkMifQ==