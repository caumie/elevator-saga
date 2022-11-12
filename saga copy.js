{
    init: ((elevators, floors) => {

        elevators.map((e, i) => {

            e.id = i;

            e.setIndicator = (direction) => {
                if (direction === "up") {
                    e.goingUpIndicator(true);
                    e.goingDownIndicator(false);
                    return;
                }
                if (direction === "down") {
                    e.goingUpIndicator(false);
                    e.goingDownIndicator(true);
                    return;
                }
            };

            e.checkAvailability = () => {
                const perPassengerFactor = 1 / e.maxPassengerCount();
                return e.loadFactor() + (perPassengerFactor * 1) <= 1;
            };

            e.on("idle", () => {
                const msg = `idle : No.${e.id} -> wait ${e.currentFloor()}`;
            });
            e.on("passing_floor", (floorNum, direction) => {
            });
            e.on("stopped_at_floor", (floorNum) => {
            });
            e.on("floor_button_pressed", (floorNum) => {
            });
        })

        floors.map((f) => {
            f.on("up_button_pressed", () => {
                // console.log(`Floor :${f.level} , ${f.buttonStates}`);
            });
            f.on("down_button_pressed", () => {
                // console.log(`Floor :${f.level} , ${f.buttonStates}`);
            });
        })
    }),
        update: ((dt, elevators, floors) => {
            console.log(dt, elevators, floors);
        })
}