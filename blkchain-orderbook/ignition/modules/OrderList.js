const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const OrderListModule = buildModule("OrderListModule", (m) => {
  const orderList = m.contract("OrderList");

  return { orderList };
});

module.exports = OrderListModule;