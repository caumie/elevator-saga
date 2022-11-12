{
    init: ((elevators, floors) => {

        const planner = {
            stayFloor: function (elevatorId) {
                const per = floors.length / elevators.length;
                const stayFloorNum = Math.ceil(elevatorId * per);
                return stayFloorNum;
            },
            plan: function (currentFloor, searchRange) {
                const searchMinFloor = Math.max(0, currentFloor - searchRange);
                const searchMaxFloor = Math.min(currentFloor + searchRange, floors.length);

                const upCall = floors
                    .map(f => ({ level: f.level, call: Boolean(f.buttonStates["up"]) }))
                    .slice(searchMinFloor, searchMaxFloor)
                    .filter(f => f.call);
                const downCall = floors
                    .map(f => ({ level: f.level, call: Boolean(f.buttonStates["down"]) }))
                    .slice(searchMinFloor, searchMaxFloor)
                    .filter(f => f.call);

                if (upCall.length === 0 && downCall.length === 0) {
                    return { direction: undefined, floors: [] };
                }

                if (upCall.length >= downCall.length) {
                    return { direction: "up", floors: [...upCall.map(f => f.level)] }
                } else {
                    return { direction: "down", floors: [...downCall.map(f => f.level).reverse()] }
                }

            },
            nearPlan: function (currentFloor) {
                // const searchRange = parseInt(floors.length / elevators.length / 2);
                const searchRange = 2;
                return this.plan(currentFloor, searchRange);
            },
            farPlan: function (currentFloor) {
                const searchRange = floors.length;
                return this.plan(currentFloor, searchRange);
            },
            isNeededStopFloor: function (elevatorId, floorNum, direction) {
                const l = elevators.reduce((arr, e) => {
                    arr.push({
                        id: e.id,
                        nextFloor: e.destinationQueue[0],
                        direction: e.getNextFloorDirection(e.destinationQueue[0])
                    });
                    return arr;
                }, []);
                console.log(l);
                const ll = l
                    .filter(e => e.id !== elevatorId)
                    .filter(e => e.nextFloor === floorNum)
                    .filter(e => e.direction === direction)
                console.log(ll);
                return ll.length === 0;
            },
        };



        elevators.map((e, i) => {

            e.id = i;
            e.directMoveFloor = undefined;

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
                let msg = `idle : No.${e.id} -> wait ${e.currentFloor()}`;

                const currFloor = e.currentFloor();

                {
                    // near
                    const plan = planner.nearPlan(planner.stayFloor(e.id));
                    if (plan.direction) {
                        const highPriorityFloor = plan.floors[0];
                        e.directMoveFloor = highPriorityFloor; // !
                        e.setIndicator(plan.direction);
                        e.goToFloor(highPriorityFloor);
                        console.log(`${msg} -> goto ${highPriorityFloor} (direct)`);
                        return;
                    }
                }

                {
                    // far (direction only)
                    const plan = planner.farPlan(currFloor);
                    if (plan.direction) {
                        const highPriorityFloor = plan.floors
                            .map((f) => { return { priority: Math.abs(currFloor - f), level: f } })
                            .sort((a, b) => { a.priority - b.priority })
                        [0].level;
                        e.setIndicator(plan.direction);
                        e.goToFloor(highPriorityFloor);
                        console.log(`${msg} -> goto ${highPriorityFloor}`);
                        return;
                    }
                }

                // stay
                const stayFloor = planner.stayFloor(e.id);
                e.setIndicator(e.getNextFloorDirection(stayFloor));
                e.goToFloor(stayFloor);
                console.log(`${msg} -> goto ${stayFloor} (stay)`);

            });
            e.on("passing_floor", (floorNum, direction) => {
                // console.log("pass", e, floorNum, direction)

                e.setIndicator(direction);

                if (e.directMoveFloor) {
                    if (e.directMoveFloor !== floorNum) {
                        return;
                    }
                }

                if ("" === floors[floorNum].buttonStates[direction]) { return; };
                if (false === e.checkAvailability()) { return; };
                if (false === planner.isNeededStopFloor(e.id, floorNum, direction)) { return; }

                if (floorNum !== e.destinationQueue[0]) {
                    e.destinationQueue.unshift(floorNum);
                    e.checkDestinationQueue();
                }

            });
            e.on("stopped_at_floor", (floorNum) => {
                // console.log("stopped", e, floorNum);

                if (e.directMoveFloor) {
                    if (e.directMoveFloor === floorNum) {
                        e.directMoveFloor = undefined;
                    }
                }

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
                // console.log("press", e, floorNum);

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