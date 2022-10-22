{
    init: (elevators, floors) => {

        const call = () => {
            const origin = { floor: undefined, called:false, direction: undefined, reserve: undefined };
            const data = [...Array(floors.length).keys()].map((floorNum) => {
                const upStat = Object.assign({}, origin);
                upStat.floor = floorNum;
                upStat.direction = "up";

            });

        };



        elevators.map((e, i) => {

            e.id = i;

            let moveDirection = undefined;

            const getFloorPriority = (targetFloorNum) => {
                const f = floors[targetFloorNum];
                console.log(targetFloorNum, f.waiting("up"), f.waiting("down"))
                if (f.waiting("up") || f.waiting("down")) {
                    const priority = Math.abs(e.currentFloor() - targetFloorNum);
                    return priority;
                } else {
                    return Infinity;
                }
            };
            e.setIndicator = () => {
                if (moveDirection === "up") {
                    e.goingUpIndicator(true);
                    e.goingDownIndicator(false);
                }
                if (moveDirection === "down") {
                    e.goingUpIndicator(false);
                    e.goingDownIndicator(true);
                }
            };

            e.availabilityCheck = () => {
                const perPersonFactor = 1 / e.maxPassengerCount();
                return (perPersonFactor <= 1 - e.loadFactor())
            };

            e.on("idle", () => {

                let goingFloorNum = NaN;

                {
                    // waiting search. both direction.
                    const floorNums = [...Array(floors.length).keys()];
                    const priorities = floorNums.map(getFloorPriority);
                    const highPriorityValue = Math.min(...priorities);
                    const highPriorityFloorNum = priorities.findIndex(v => v === highPriorityValue);
                    console.log(priorities, highPriorityValue, highPriorityFloorNum);
                    if (highPriorityFloorNum !== -1) {
                        goingFloorNum = highPriorityFloorNum
                    }
                    {
                        // default waiting point
                        if (goingFloorNum === NaN) {
                            const per = floors.length / elevators.length;
                            const stayFloorNum = i * per;
                            goingFloorNum = stayFloorNum;
                        }
                    }

                    if (e.currentFloor() > goingFloorNum) {
                        e.goingUpIndicator(false);
                        e.goingDownIndicator(true);
                    } else {
                        e.goingUpIndicator(true);
                        e.goingDownIndicator(false);
                    }

                    e.goToFloor(goingFloorNum); 

                }
            });
            e.on("floor_button_pressed", (floorRequestNum) => {
                const s = new Set(e.getPressedFloors());
                const sorted = [...s].sort();

                console.log("pressd", i, sorted);
                e.destinationQueue = sorted;
                e.checkDestinationQueue();

            });
            e.on("passing_floor", (floorNum, direction) => {

                moveDirection = direction;

                console.log("pass", floorNum, direction, floors[floorNum].waiting(direction))
                if (floors[floorNum].waiting(direction)) {
                    const perPersonFactor = 1 / e.maxPassengerCount();
                    if (perPersonFactor <= 1 - e.loadFactor()) {
                        const queue = e.destinationQueue;
                        queue.unshift(floorNum);
                        e.destinationQueue = queue;
                        e.checkDestinationQueue();

                    } else {
                        console.log("highwait!!!!!!")
                    }
                }
            });
            e.on("stopped_at_floor", (floorNum) => {
                if (e.getPressedFloors().length <= 0) {
                    if (floors[floorNum].waiting("up")) {
                        e.goingUpIndicator(true);
                        e.goingDownIndicator(false);
                    } else {
                        e.goingUpIndicator(false);
                        e.goingDownIndicator(true);
                    }
                }
            });
        })

        floors.map((floor, index) => {

            floor.id = index;
            floor.call = {
                up: { pressed: false, reserve: undefined },
                down: { pressed: false, reserve: undefined },
            }

            floor.clearPressed = (direction) => {
                if (direction === "up") {
                    floor.call.up.pressed = false;
                    floor.call.up.reserve = undefined;
                }
                if (direction === "down") {
                    floor.call.down.pressed = false;
                    floor.call.down.reserve = undefined;
                }
            };
            floor.setReseve = (direction, elevatorId) => {
                if (direction === "up") floor.call.up.reserve = elevatorId;
                if (direction === "down") floor.call.down.reserve = elevatorId;
            };
            floor.callCheck = (direction, elevatorId) => {
                if (direction === "up") {
                    return floor.call.up.pressed && floor.call.up.reserve === elevatorId;
                }
                if (direction === "down") {
                    return floor.call.down.pressed && floor.call.down.reserve === elevatorId;
                }
            }

            floor.on("up_button_pressed", () => { floor.call.up.pressed = true; });
            floor.on("down_button_pressed", () => { floor.call.down.pressed = true; });

        })
    },
        update: (dt, elevators, floors) => {
            // console.log(dt, elevators, floors);
        }
}