{
    init: (elevators, floors) => {

        // const planner = new Object();
        const stayPlan = (elevatorId) => {
            const per = floors.length / elevators.length;
            const stayFloorNum = parseInt(elevatorId * per);
            console.log(par, stayFloorNum, elevatorId);
            return stayFloorNum;
        };
        const _plan = (currentFloor, searchRange) => {
            const searchMinFloor = Math.max(0, currentFloor - searchRange);
            const searchMaxFloor = Math.min(currentFloor + searchRange, floors.length);

            const upCall = floors
                .slice(currentFloor, searchMaxFloor)
                .filter(e => e.buttonStates["up"])
            const downCall = floors
                .slice(searchMinFloor, currentFloor)
                .filter(e => e.buttonStates["down"])

            if (upCall.length === 0 && downCall.length === 0) {
                return NaN;
            }
            const upCallFloor = max(...upCall.map(f => f.level));
            const downCallFloor = min(...downCall.map(f => f.level));

            console.log(upCallFloor, downCallFloor)
            return upCall >= downCall ? upCallFloor : downCallFloor;

        };
        const nearPlan = (currentFloor) => {
            const searchRange = parseInt(floors.length / elevators.length / 2);
            return _plan(currentFloor, searchRange);
        };
        const farPlan = (currentFloor) => {
            const searchRange = floors.length;
            return _plan(currentFloor, searchRange);
        };
        const isNeededStopFloor = (elevatorId, floorNum, direction) => {
            return true;
        };

        elevators.map((e, i) => {

            e.id = i;

            e.getNextFloorDirection = (nextFloorNum) => {
                return nextFloorNum >= e.currentFloor() ? "up" : "down";
            };

            e.setIndicator = (direction) => {
                // if (direction === "none") {
                //     e.goingUpIndicator(false);
                //     e.goingDownIndicator(false);
                //     return;
                // }
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
                // if (direction === "both") {
                //     e.goingUpIndicator(true);
                //     e.goingDownIndicator(true);
                //     return;
                // }
            };

            e.checkAvailability = () => {
                const perPassengerFactor = 1 / e.maxPassengerCount();
                return (e.loadFactor() + (perPassengerFactor * 2) <= 1)
            };

            e.on("idle", () => {
                // console.log("idle", e);

                const currFloor = e.currentFloor();

                let planFloor = nearPlan(currFloor);
                console.log("near", planFloor);
                if (planFloor === NaN) {
                    planFloor = farPlan(currFloor);
                    console.log("far", planFloor);
                    if (planFloor === NaN) {
                        // 適切な計画がなければ標準位置へ移動
                        planFloor = stayPlan(e.id);
                        console.log("stay", planFloor);
                    }
                }
                console.log(planFloor);
                e.setIndicator(e.getNextFloorDirection(planFloor));
                e.goToFloor(planFloor);

            });
            e.on("passing_floor", (floorNum, direction) => {
                // console.log("pass", e)

                e.setIndicator(direction);

                if ("" === floors[floorNum].buttonStates[direction]) { return; };
                if (false === e.checkAvailability()) { return; };

                if (floorNum !== e.destinationQueue[0]) {
                    e.destinationQueue.unshift(floorNum);
                    e.checkDestinationQueue();
                }

            });
            e.on("stopped_at_floor", (floorNum) => {
                // console.log("stopped", e);

                if (floorNum === 0) {
                    e.setIndicator("up");
                    return;
                };
                if (floorNum === floors.length) {
                    e.setIndicator("down");
                    return;
                };

                if (e.getPressedFloors().length === 0) {
                    const upStatus = floors[floorNum].buttonStates["up"];
                    if (upStatus) {
                        e.setIndicator("up")
                        return;
                    }
                    const downStatus = floors[floorNum].buttonStates["down"];
                    if (downStatus) {
                        e.setIndicator("down")
                        return;
                    }
                    return;
                }

            });
            e.on("floor_button_pressed", (floorNum) => {
                // console.log("press", e);

                const pressedFloors = e.getPressedFloors();

                const lowerFloors = pressedFloors.filter(fN => e.currentFloor() > fN);
                const higherFloors = pressedFloors.filter(fN => e.currentFloor() < fN);

                let sortedPressedFloors = [...pressedFloors].sort((a, b) => a - b);
                if (lowerFloors.length > higherFloors.length) {
                    sortedPressedFloors.reverse();
                }

                e.destinationQueue = sortedPressedFloors;
                e.checkDestinationQueue();
            });
        })

        floors.map((f) => {
            f.on("up_button_pressed", () => { });
            f.on("down_button_pressed", () => { });
        })
    },
        update: (dt, elevators, floors) => {
            // console.log(dt, elevators, floors);
        }
}