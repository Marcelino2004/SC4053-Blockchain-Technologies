package tests

import (
	"testing"

	"orderbook.com/m/c"
	"orderbook.com/m/class"
)

func TestOrderBook(t *testing.T) {
	// OrderType = GoodTillCancel, FillAndKill, Market

	// GoodTillCancel
	// will be valid as long as buy price is not < lowest selling price
	// will be valid as long as sell price is not > highest buying price
	// Buyer -> 30, 70
	// Seller -> 50, 90

	// (BUY)30 < (SELL)50 -> not valid
	// (BUY)70 < (SELL)50 -> valid
	// (SELL)50 > (BUY)70 -> valid
	// (SELL)90 > (BUY)70 -> not valid

	// for now make the quantity all the same

	ob := class.NewOrderbook()

	order70Buy := class.NewOrder(c.GoodTillCancel, c.OrderID(1), c.BUY, c.Price(70), c.Quantity(10))
	order30Buy := class.NewOrder(c.GoodTillCancel, c.OrderID(2), c.BUY, c.Price(30), c.Quantity(10))
	order90Sell := class.NewOrder(c.GoodTillCancel, c.OrderID(3), c.SELL, c.Price(90), c.Quantity(10))
	order50Sell := class.NewOrder(c.GoodTillCancel, c.OrderID(4), c.SELL, c.Price(50), c.Quantity(10))

	trades, _ := ob.AddOrder(order70Buy)
	if len(trades) != 0 {
		t.Errorf("1. Expected length of trade to be 0, but got %v", trades)
	}
	trades, _ = ob.AddOrder(order90Sell)
	if len(trades) != 0 {
		t.Errorf("2. Expected length of trade to be 0, but got %v", trades)
	}
	trades, _ = ob.AddOrder(order50Sell)
	if len(trades) != 1 {
		t.Errorf("3. Expected length of trade to be 1, but got %v", trades)
	}
	if trades[0].GetAskTrade().OrderId != order50Sell.GetOrderID() && trades[0].GetBidTrade().OrderId != order70Buy.GetOrderID() {
		t.Errorf("3. Expected ask trade to be %v, but got %v -- Expected buy trade to be %v, but got %v", order50Sell.GetOrderID(), trades[0].GetAskTrade().OrderId, order70Buy.GetOrderID(), trades[0].GetBidTrade().OrderId)
	}
	trades, _ = ob.AddOrder(order30Buy)
	if len(trades) != 0 {
		t.Errorf("4. Expected length of trade to be 0, but got %v", trades)
	}

}

//TODO: write more test
