// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

// Uncomment this line to use console.log
import "hardhat/console.sol";
import "@prb/math/src/Common.sol" as PRBMath;
import "./interfaces/IMasterLiquidityPool.sol"; // Make sure to import the interface
import "./interfaces/ILiquidityPool.sol"; // Make sure to import the interface
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DEX {
    uint256 public constant SCALE = 1e18;
    IMasterLiquidityPool public MasterLP;

    // Array to store AMM contract addresses
    mapping(bytes32 => address) public tokenPairLPs;
    mapping(uint64 => Order) public orders; // orderID -> Order

    event CreateOrder(uint64 orderID);
    event CancelOrder(uint64 orderID);
    event LPAdded(address indexed lpAddress, address tokenA, address tokenB);
    event ExecuteMarketOrder(
        uint64 orderID,
        uint256 amountIn,
        uint256 amountOut
    );
    event AMMPriceChange();

    //Market can execute at any price
    enum OrderType {
        Market,
        Limit,
        Stop
    }

    struct Order {
        address userAddress;
        OrderType orderType;
        uint64 orderID;
        uint price;
        uint256 quantity;
        address tokenPair0;
        address tokenPair1;
    }

    struct InputOrder {
        OrderType orderType;
        uint price;
        uint256 quantity;
        address tokenPair0;
        address tokenPair1;
    }

    uint64 private nextOrderID = 1; // or OrderID

    uint64[] public orderIDs; // to keep track of all orderIDs

    bool private locked;

    constructor(address _MasterLP) {
        MasterLP = IMasterLiquidityPool(_MasterLP);
    }

    function addOrder(InputOrder memory input_order) public returns (uint64) {
        Order memory order = Order(
            msg.sender,
            input_order.orderType,
            nextOrderID,
            input_order.price,
            input_order.quantity,
            input_order.tokenPair0,
            input_order.tokenPair1
        );

        require(
            orders[order.orderID].userAddress == address(0),
            "OrderID already exist"
        );

        address expectedToken = order.tokenPair0;
        uint256 depositAmount = order.quantity;
        require(
            ERC20(expectedToken).transferFrom(
                order.userAddress,
                address(this),
                depositAmount
            ),
            "Token transfer failed"
        );

        ILiquidityPool lp = MasterLP.getLP(order.tokenPair0, order.tokenPair1);
        uint256 marketPrice = lp.getMarketPrice(
            order.tokenPair0,
            order.tokenPair1
        );

        if (order.orderType == OrderType.Market) {
            return executeMarketOrder(order, depositAmount);
        } else {
            // LIMIT: execute immediately if marketPrice >= order.price
            if (
                order.orderType == OrderType.Limit && marketPrice >= order.price
            ) {
                return executeMarketOrder(order, depositAmount);
                // STOP: execute immediately if marketPrice <= order.price
            } else if (
                order.orderType == OrderType.Stop && marketPrice <= order.price
            ) {
                return executeMarketOrder(order, depositAmount);
            }

            return createOrder(order);
        }
    }

    function cancelOrder(uint64 orderID) public {
        require(
            orders[orderID].userAddress != address(0),
            "OrderID doesn't exist"
        );

        Order memory order = orders[orderID];
        require(msg.sender == order.userAddress);

        delete orders[orderID];

        // Remove the orderID from the orderIDs array
        for (uint i = 0; i < orderIDs.length; i++) {
            if (orderIDs[i] == orderID) {
                orderIDs[i] = orderIDs[orderIDs.length - 1];
                orderIDs.pop();
                break;
            }
        }

        // return the money back to the user
        address expectedToken = order.tokenPair0;
        uint256 depositAmount = order.quantity;
        require(
            ERC20(expectedToken).transfer(order.userAddress, depositAmount),
            "Token refund failed"
        );

        emit CancelOrder(orderID);
    }

    function getAllOrders() public view returns (Order[] memory) {
        Order[] memory allOrders = new Order[](orderIDs.length);

        for (uint i = 0; i < orderIDs.length; i++) {
            allOrders[i] = orders[orderIDs[i]];
        }
        return allOrders;
    }

    function getUserOrders(
        address userAddress
    ) public view returns (Order[] memory) {
        uint256 userOrderCount = 0;

        for (uint256 i = 0; i < orderIDs.length; i++) {
            if (userAddress == orders[orderIDs[i]].userAddress) {
                userOrderCount++;
            }
        }

        Order[] memory allOrders = new Order[](userOrderCount);
        uint256 index = 0;

        for (uint256 i = 0; i < orderIDs.length; i++) {
            if (userAddress == orders[orderIDs[i]].userAddress) {
                allOrders[index] = orders[orderIDs[i]];
                index++;
            }
        }

        return allOrders;
    }

    struct Trade {
        address token;
        uint256 quantity;
    }

    function matchTrade(
        uint64[] memory orderIDList, // just give to me in order
        uint256[] memory quantity
    ) public {
        uint64 length = uint64(orderIDList.length);
        require(
            length == quantity.length,
            "quantity length is not equal to orderIDList Length"
        );

        Order[] memory tempOrders = new Order[](orderIDList.length);

        uint64 tempOrderIndex = 0;

        if (orderIDList.length == 1) {
            uint64 currid = orderIDList[0];

            require(
                orders[currid].userAddress != address(0),
                "orderID doesn't exist"
            );

            Order memory order = orders[currid];

            require(
                order.orderType == OrderType.Limit ||
                    order.orderType == OrderType.Stop,
                "Order type must be Limit or Stop"
            );

            uint256 orderQuantity = quantity[0];
            ILiquidityPool lp = MasterLP.getLP(
                order.tokenPair0,
                order.tokenPair1
            );
            uint256 marketPrice = lp.getMarketPrice(
                order.tokenPair0,
                order.tokenPair1
            );

            if (order.orderType == OrderType.Limit) {
                require(
                    marketPrice >= order.price,
                    "Price of the limit order has not met requirement to be executed yet"
                );
                console.log("1");
                ERC20(order.tokenPair0).approve(address(lp), orderQuantity);
                console.log("2");
                lp.swap(orderQuantity, order.tokenPair0, order.tokenPair1);
                console.log("3");
            } else if (order.orderType == OrderType.Stop) {
                require(
                    marketPrice <= order.price,
                    "Price of the stop order has not met requirement to be executed yet"
                );

                ERC20(order.tokenPair0).approve(address(lp), orderQuantity);
                lp.swap(orderQuantity, order.tokenPair0, order.tokenPair1);
            }

            console.log("orderQuantity");
            console.log(orderQuantity);

            tempOrders[tempOrderIndex] = Order(
                order.userAddress,
                order.orderType,
                order.orderID,
                marketPrice,
                orderQuantity,
                order.tokenPair0,
                order.tokenPair1
            );
            tempOrderIndex++;
        } else {
            // batch order
            for (uint64 i = 0; i < orderIDList.length; i++) {
                uint64 currid = orderIDList[i];
                uint64 nextid = orderIDList[(i + 1) % length];

                require(
                    orders[currid].userAddress != address(0),
                    "orderID doesn't exist"
                );
                require(
                    orders[nextid].userAddress != address(0),
                    "orderID doesn't exist"
                );

                Order memory start = orders[currid];
                Order memory end = orders[nextid];

                uint256 startQuantity = quantity[i];
                uint256 endQuantity = quantity[(i + 1) % length];

                require(
                    start.tokenPair1 == end.tokenPair0,
                    "given trade is not a valid cycle"
                );

                ILiquidityPool lp = MasterLP.getLP(
                    start.tokenPair0,
                    start.tokenPair1
                );
                uint256 marketPrice = lp.getMarketPrice(
                    start.tokenPair0,
                    start.tokenPair1
                );

                if (start.orderType == OrderType.Limit) {
                    require(
                        start.price < marketPrice,
                        "price of the limit order is not valid for batch order, use single order instead"
                    );
                } else if (start.orderType == OrderType.Stop) {
                    require(
                        start.price > marketPrice,
                        "price of the stop order is not valid for batch order, use single order instead"
                    );
                }
                console.log("endQuantity");
                console.log(endQuantity);

                console.log("the multiplied one");
                console.log(startQuantity);
                console.log(start.price);
                console.log(_multiply(startQuantity, start.price));

                require(
                    endQuantity >= _multiply(startQuantity, start.price),
                    "batch order pricing is not valid"
                );

                tempOrders[tempOrderIndex] = Order(
                    start.userAddress,
                    start.orderType,
                    start.orderID,
                    start.price,
                    startQuantity,
                    start.tokenPair0,
                    start.tokenPair1
                );
                tempOrderIndex++;
            }
        }

        for (uint64 i = 0; i < tempOrderIndex; i++) {
            Order memory tempOrder = tempOrders[i];
            require(
                ERC20(tempOrder.tokenPair1).transfer(
                    tempOrder.userAddress,
                    _multiply(tempOrder.price, tempOrder.quantity)
                ),
                "Token trade transfer failed"
            );
            _delOrderTrade(tempOrder.orderID, tempOrder.quantity);
        }
    }

    function getMasterLP() external view returns (address) {
        return address(MasterLP);
    }

    function matchSingleOrder(uint64 orderID) public {
        require(
            orders[orderID].userAddress != address(0),
            "Order does not exist"
        );

        Order memory order = orders[orderID];

        ILiquidityPool lp = MasterLP.getLP(order.tokenPair0, order.tokenPair1);
        uint256 marketPrice = lp.getMarketPrice(
            order.tokenPair0,
            order.tokenPair1
        );

        bool executable = ((order.orderType == OrderType.Limit &&
            order.price >= marketPrice) ||
            (order.orderType == OrderType.Stop && order.price <= marketPrice));

        require(executable, "Order conditions not met");

        ERC20(order.tokenPair0).approve(address(lp), order.quantity);
        uint256 amountOut = lp.swap(
            order.quantity,
            order.tokenPair0,
            order.tokenPair1
        );
        require(
            ERC20(order.tokenPair1).transfer(order.userAddress, amountOut),
            "Token transfer failed"
        );

        delete orders[orderID];
        for (uint i = 0; i < orderIDs.length; i++) {
            if (orderIDs[i] == orderID) {
                orderIDs[i] = orderIDs[orderIDs.length - 1];
                orderIDs.pop();
                break;
            }
        }
    }

    //////////////////////////// internal functions ////////////////////////////
    function _multiply(
        uint256 x,
        uint256 y
    ) internal pure returns (uint256 res) {
        uint256 result = PRBMath.mulDiv(x, y, SCALE);
        return result;
    }

    function _delOrderTrade(uint64 orderID, uint256 quantity) internal {
        require(
            orders[orderID].userAddress != address(0),
            "OrderID doesn't exist"
        );
        console.log("inside delOrderTrade");

        // If the quantity to delete is less than the order's quantity, update the order's quantity
        if (quantity < orders[orderID].quantity) {
            console.log();
            console.log("am i ever in deleting order?1");
            orders[orderID].quantity -= quantity;
        } else {
            console.log("am i ever in deleting order?2");
            // Otherwise, delete the entire order
            delete orders[orderID];

            // Remove the orderID from the orderIDs array
            for (uint i = 0; i < orderIDs.length; i++) {
                if (orderIDs[i] == orderID) {
                    orderIDs[i] = orderIDs[orderIDs.length - 1];
                    orderIDs.pop();
                    break;
                }
            }
        }
    }

    function executeMarketOrder(
        Order memory order,
        uint256 depositAmount
    ) internal returns (uint64) {
        ILiquidityPool lp = MasterLP.getLP(order.tokenPair0, order.tokenPair1);

        ERC20(order.tokenPair0).approve(address(lp), depositAmount);

        uint256 amountOut = lp.swap(
            depositAmount,
            order.tokenPair0,
            order.tokenPair1
        );
        require(
            ERC20(order.tokenPair1).transfer(order.userAddress, amountOut),
            "Token swap failed"
        );

        emit ExecuteMarketOrder(order.orderID, depositAmount, amountOut);
        emit AMMPriceChange();

        return order.orderID;
    }

    function createOrder(Order memory order) internal returns (uint64) {
        orders[order.orderID] = order;
        orderIDs.push(order.orderID);

        // Emit event for order creation
        nextOrderID++;
        emit CreateOrder(uint64(order.orderID));
        return order.orderID;
    }
}
