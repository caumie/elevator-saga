{
    init: ((elevators, floors) => {

        elevators.map((e, elevatorIndex) => {

            e.nextFloorDirection = () => {
                if(e.destinationQueue.length === 0);
                

                e.currentFloor();
                e.destinationQueue[0]
            };

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
                const msg = `idle : No.${elevatorIndex} -> wait ${e.currentFloor()}`;
            });
            e.on("passing_floor", (floorNum, direction) => {
                if (e.destinationQueue.findIndex(v => v === floorNum)) {
                    return;
                }
                if (plannner.isNeedStopFloor(elevatorIndex, floorNum, direction)) {
                    e.destinationQueue.unshift(floorNum);
                    e.checkDestinationQueue();
                };
            });
            e.on("stopped_at_floor", (floorNum) => {
                e.destinationQueue = plannner.planning(elevatorIndex, remainingPlans);
                e.checkDestinationQueue();
            });
            e.on("floor_button_pressed", (floorNum) => {
                e.goToFloor(floorNum);
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