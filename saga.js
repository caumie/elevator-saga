{
    init: (elevators, floors) => {

        const call = [];
        [...Array(floors.length).keys()].map((floorNum) => {
            const up_v = { floor: floorNum, direction: "up", called: false, reserve: undefined };
            const down_v = { floor: floorNum, direction: "down", called: false, reserve: undefined };
            const floorSet = { up: up_v, down: down_v }
            call.push(floorSet);
        });


        //--
        const position = [];
        [...Array(elevator.length).keys()].map((index) => {
            const down_v = { elevatorId: index, direction: "down", called: false, reserve: undefined };
            const floorSet = { up: up_v, down: down_v }
            position.push(floorSet);
        });
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

        elevators.map((e, i) => {

            e.id = i;
            e.plannedDirection = undefined;
            e.stopFloorRequestedFromPassenger = new Set();

            e.stopFloorPlanning = (direction, requestFloors) => {
                if

            }

            e.setIndicator = (direction) => {
                if (direction === "up") {
                    e.goingUpIndicator(true);
                    e.goingDownIndicator(false);
                }
                if (direction === "down") {
                    e.goingUpIndicator(false);
                    e.goingDownIndicator(true);
                }
            };

            e.checkAvailability = () => {
                const perPassengerFactor = 1 / e.maxPassengerCount();
                return (e.loadFactor() + (perPassengerFactor * 2) <= 1)
            };

            e.stayFloorNum = (
                () => {
                    // default waiting point
                    const per = floors.length / elevators.length;
                    const stayFloorNum = i * per;
                    return stayFloorNum;
                }
            )();

            e.on("idle", () => {

                // 周囲の状況から計画作成
                // 適切な計画がなければ標準位置へ移動

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
            e.on("passing_floor", (floorNum, direction) => {

                // そもそも止まる予定か
                // 合致する方向の要求があるか
                // 重量に空きがあるか
                // よい場合は停止要求のキューの最初に追加

                if (false === stat[floorNum][direction]["called"]) {
                    return;
                }

                if (false === e.checkAvailability()) {
                    return;
                }



                const queue = e.destinationQueue;
                queue.unshift(floorNum);
                e.destinationQueue = queue;
                e.checkDestinationQueue();

            });
            e.on("stopped_at_floor", (floorNum) => {
                // 次の階次第で進行方向表示を更新

                // フロアの進行方向の要求をクリア

                // 次の階へ向かう

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
            e.on("floor_button_pressed", (floorRequestNum) => {

                // 押されたボタン＋周囲の状況から、再計画、キュー入れ込む

                const s = new Set(e.getPressedFloors());
                const sorted = [...s].sort();

                console.log("pressd", i, sorted);
                e.destinationQueue = sorted;
                e.checkDestinationQueue();
            });
        })

        floors.map((f, i) => {

            f.id = i;
            f.up = { floor: i, direction: "up", called: false, reserve: undefined };
            f.down = { floor: i, direction: "down", called: false, reserve: undefined };

            f.clear = (direction) => {
                f[direction].called = false;
                f[direction].reserve = undefined;
            };

            f.on("up_button_pressed", () => {
                call[f.id]["up"].called = true;
            });
            f.on("down_button_pressed", () => {
                call[f.id]["down"].called = true;
            });

        })
    },
        update: (dt, elevators, floors) => {
            // console.log(dt, elevators, floors);
        }
}