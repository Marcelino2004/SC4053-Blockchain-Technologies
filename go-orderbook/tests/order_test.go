package tests

import (
	"fmt"
	"math"
	"testing"

	"orderbook.com/m/c"
	"orderbook.com/m/class"
)

func TestNewOrder(t *testing.T) {
	orderType := c.GoodTillCancel
	orderID := c.OrderID(1)
	side := c.BUY
	price := c.Price(100)
	quantity := c.Quantity(10)

	order := class.NewOrder(orderType, orderID, side, price, quantity)

	if order.GetOrderType() != orderType {
		t.Errorf("Expected order type %v, got %v", orderType, order.GetOrderType())
	}
	if order.GetOrderID() != orderID {
		t.Errorf("Expected order ID %v, got %v", orderID, order.GetOrderID())
	}
	if order.GetSide() != side {
		t.Errorf("Expected side %v, got %v", side, order.GetSide())
	}
	if order.GetPrice() != price {
		t.Errorf("Expected price %v, got %v", price, order.GetPrice())
	}
	if order.GetInitialQuantity() != quantity {
		t.Errorf("Expected initial quantity %v, got %v", quantity, order.GetInitialQuantity())
	}
	if order.GetRemainingQuantity() != quantity {
		t.Errorf("Expected remaining quantity %v, got %v", quantity, order.GetRemainingQuantity())
	}
}

func TestNewMarketOrder(t *testing.T) {
	orderID := c.OrderID(2)
	side := c.SELL
	quantity := c.Quantity(5)

	order := class.NewMarketOrder(orderID, side, quantity)

	if order.GetOrderType() != c.Market {
		t.Errorf("Expected order type Market, got %v", order.GetOrderType())
	}
	if order.GetOrderID() != orderID {
		t.Errorf("Expected order ID %v, got %v", orderID, order.GetOrderID())
	}
	if order.GetSide() != side {
		t.Errorf("Expected side %v, got %v", side, order.GetSide())
	}

	if !math.IsNaN(float64(order.GetPrice())) {
		t.Errorf("Expected price NaN, got %v", order.GetPrice())
	}

	if order.GetInitialQuantity() != quantity {
		t.Errorf("Expected initial quantity %v, got %v", quantity, order.GetInitialQuantity())
	}
	if order.GetRemainingQuantity() != quantity {
		t.Errorf("Expected remaining quantity %v, got %v", quantity, order.GetRemainingQuantity())
	}
}

func TestFill(t *testing.T) {
	order := class.NewOrder(c.FillAndKill, c.OrderID(3), c.BUY, c.Price(100), c.Quantity(10))

	err := order.Fill(c.Quantity(5))
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if order.GetRemainingQuantity() != c.Quantity(5) {
		t.Errorf("Expected remaining quantity 5, got %v", order.GetRemainingQuantity())
	}

	err = order.Fill(c.Quantity(6))
	if err == nil {
		t.Error("Expected error for filling more than remaining quantity, got none")
	}
}

func TestIsFilled(t *testing.T) {
	order := class.NewOrder(c.GoodTillCancel, c.OrderID(4), c.BUY, c.Price(100), c.Quantity(0))

	if !order.IsFilled() {
		t.Errorf("Expected order to be filled when remaining quantity is 0")
	}

	order = class.NewOrder(c.GoodTillCancel, c.OrderID(5), c.BUY, c.Price(100), c.Quantity(10))
	order.Fill(c.Quantity(10))

	if !order.IsFilled() {
		t.Errorf("Expected order to be filled after filling the entire quantity")
	}
}

func TestToGoodTillCancel(t *testing.T) {
	orderID := c.OrderID(2)
	side := c.SELL
	quantity := c.Quantity(5)

	order := class.NewMarketOrder(orderID, side, quantity)

	err := order.ToGoodTillCancel(150.0) // New price for Good Till Cancel
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if order.GetOrderType() != c.GoodTillCancel {
		t.Errorf("expected order type to be GoodTillCancel, got %v", order.GetOrderType())
	}
	if order.GetPrice() != 150.0 {
		t.Errorf("expected order price to be 150.0, got %v", order.GetPrice())
	}

	// Test Case 2: Attempt to convert a non-Market order
	orderType2 := c.GoodTillCancel
	orderID2 := c.OrderID(1)
	side2 := c.BUY
	price2 := c.Price(100)
	quantity2 := c.Quantity(10)

	order2 := class.NewOrder(orderType2, orderID2, side2, price2, quantity2)

	err = order2.ToGoodTillCancel(150.0)
	if err == nil {
		t.Errorf("expected an error, got none")
	}
	expectedError := fmt.Sprintf("order (%v) cannot have its price adjusted, only market orders can", orderID2)
	if err.Error() != expectedError {
		t.Errorf("expected error message to be '%v', got '%v'", expectedError, err.Error())
	}
}
