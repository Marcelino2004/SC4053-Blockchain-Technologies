package tests

import (
	"testing"

	"orderbook.com/m/c"
	"orderbook.com/m/class"
)

// Test for NewSortedMap
func TestNewSortedMap(t *testing.T) {
	sm := class.NewSortedMap(false)
	if sm.Empty() != true {
		t.Errorf("Expected empty sorted map, got non-empty")
	}

	if sm.GetDescending() != false {
		t.Errorf("Expected isDescending to be false, got %v", sm.GetData())
	}

}

// Test for AddData
func TestAddData(t *testing.T) {
	sm := class.NewSortedMap(false)

	order1 := class.NewOrder(c.GoodTillCancel, c.OrderID(1), c.BUY, c.Price(150), c.Quantity(10))

	// Test adding a new key
	sm.AddData(order1.GetPrice(), order1)
	orders_check := sm.GetData()[order1.GetPrice()]
	if len(orders_check) != 1 || orders_check[0] != order1 {
		t.Errorf("Expected order slice to contain [%v], but got %v", order1, orders_check)
	}

	//Test adding a duplicate key
	order1_dup := class.NewOrder(c.GoodTillCancel, c.OrderID(2), c.BUY, c.Price(150), c.Quantity(10))
	sm.AddData(order1_dup.GetPrice(), order1_dup)
	orders_check = sm.GetData()[order1.GetPrice()]
	if len(orders_check) != 2 || orders_check[0] != order1 || orders_check[1] != order1_dup {
		t.Errorf("Expected slice to contain [%v, %v], but got %v", order1, order1_dup, orders_check)
	}
}

// Test for SortData
func TestSortDataAscending(t *testing.T) {
	sm := class.NewSortedMap(false)

	order1 := class.NewOrder(c.GoodTillCancel, c.OrderID(1), c.BUY, c.Price(150), c.Quantity(10))
	order2 := class.NewOrder(c.GoodTillCancel, c.OrderID(2), c.BUY, c.Price(120), c.Quantity(10))
	order3 := class.NewOrder(c.GoodTillCancel, c.OrderID(3), c.BUY, c.Price(160), c.Quantity(10))

	sm.AddData(order1.GetPrice(), order1)
	sm.AddData(order2.GetPrice(), order2)
	sm.AddData(order3.GetPrice(), order3)

	// Test ascending sort
	sortedKeys := sm.SortData()
	expectedKeys := []c.Price{120, 150, 160}
	for i, k := range sortedKeys {
		if k != expectedKeys[i] {
			t.Errorf("Expected key %v, got %v", expectedKeys[i], k)
		}
	}
}

func TestSortDataDescending(t *testing.T) {
	sm := class.NewSortedMap(true)

	order1 := class.NewOrder(c.GoodTillCancel, c.OrderID(1), c.BUY, c.Price(150), c.Quantity(10))
	order2 := class.NewOrder(c.GoodTillCancel, c.OrderID(2), c.BUY, c.Price(120), c.Quantity(10))
	order3 := class.NewOrder(c.GoodTillCancel, c.OrderID(3), c.BUY, c.Price(160), c.Quantity(10))

	sm.AddData(order1.GetPrice(), order1)
	sm.AddData(order2.GetPrice(), order2)
	sm.AddData(order3.GetPrice(), order3)

	// Test ascending sort
	sortedKeys := sm.SortData()
	expectedKeys := []c.Price{160, 150, 120}
	for i, k := range sortedKeys {
		if k != expectedKeys[i] {
			t.Errorf("Expected key %v, got %v", expectedKeys[i], k)
		}
	}
}

// // Test for At
func TestAt(t *testing.T) {
	sm := class.NewSortedMap(false)

	order1 := class.NewOrder(c.GoodTillCancel, c.OrderID(1), c.BUY, c.Price(150), c.Quantity(10))
	order2 := class.NewOrder(c.GoodTillCancel, c.OrderID(2), c.BUY, c.Price(120), c.Quantity(10))
	order3 := class.NewOrder(c.GoodTillCancel, c.OrderID(3), c.BUY, c.Price(160), c.Quantity(10))

	sm.AddData(order1.GetPrice(), order1)
	sm.AddData(order2.GetPrice(), order2)
	sm.AddData(order3.GetPrice(), order3)

	// Test existing price
	order, err := sm.At(order2.GetPrice())
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if order[0] != order2 {
		t.Errorf("Expected order pointer for price %v, got different %v", order2, order)
	}

	// Test non-existing price
	_, err = sm.At(c.Price(3))
	if err == nil {
		t.Error("Expected error for non-existing price, got none")
	}
}

// // Test for Erase
func TestErase(t *testing.T) {
	sm := class.NewSortedMap(false)

	order1 := class.NewOrder(c.GoodTillCancel, c.OrderID(1), c.BUY, c.Price(150), c.Quantity(10))
	order2 := class.NewOrder(c.GoodTillCancel, c.OrderID(2), c.BUY, c.Price(120), c.Quantity(10))
	order3 := class.NewOrder(c.GoodTillCancel, c.OrderID(3), c.BUY, c.Price(160), c.Quantity(10))

	sm.AddData(order1.GetPrice(), order1)
	sm.AddData(order2.GetPrice(), order2)
	sm.AddData(order3.GetPrice(), order3)

	// Test erase existing price
	sm.Erase(order1.GetPrice())
	orders_check := sm.GetData()[order1.GetPrice()]
	if len(orders_check) != 0 {
		t.Errorf("Expected order1 to be deleted, but got %v", orders_check)
	}
}

// Test for Begin
func TestBeginAscending(t *testing.T) {
	sm := class.NewSortedMap(false)

	order1 := class.NewOrder(c.GoodTillCancel, c.OrderID(1), c.BUY, c.Price(150), c.Quantity(10))
	order2 := class.NewOrder(c.GoodTillCancel, c.OrderID(2), c.BUY, c.Price(120), c.Quantity(10))
	order3 := class.NewOrder(c.GoodTillCancel, c.OrderID(3), c.BUY, c.Price(160), c.Quantity(10))

	sm.AddData(order1.GetPrice(), order1)
	sm.AddData(order2.GetPrice(), order2)
	sm.AddData(order3.GetPrice(), order3)

	// Test ascending sort
	expectedKeys := c.Price(120)
	resKeys, order := sm.Begin()

	if resKeys != expectedKeys {
		t.Errorf("Expected keys to be %v, got %v", expectedKeys, resKeys)
	}
	if order[0] != order2 {
		t.Errorf("Expected order pointer to be %v, got %v", order2, order)
	}
}

func TestBeginDescending(t *testing.T) {
	sm := class.NewSortedMap(true)

	order1 := class.NewOrder(c.GoodTillCancel, c.OrderID(1), c.BUY, c.Price(150), c.Quantity(10))
	order2 := class.NewOrder(c.GoodTillCancel, c.OrderID(2), c.BUY, c.Price(120), c.Quantity(10))
	order3 := class.NewOrder(c.GoodTillCancel, c.OrderID(3), c.BUY, c.Price(160), c.Quantity(10))

	sm.AddData(order1.GetPrice(), order1)
	sm.AddData(order2.GetPrice(), order2)
	sm.AddData(order3.GetPrice(), order3)

	// Test ascending sort
	expectedKeys := c.Price(160)
	resKeys, order := sm.Begin()

	if resKeys != expectedKeys {
		t.Errorf("Expected keys to be %v, got %v", expectedKeys, resKeys)
	}
	if order[0] != order3 {
		t.Errorf("Expected order pointer to be %v, got %v", order3, order)
	}
}

// Test for Empty
func TestEmpty(t *testing.T) {
	sm := class.NewSortedMap(false)

	if !sm.Empty() {
		t.Error("Expected sorted map to be empty")
	}

	order1 := class.NewOrder(c.GoodTillCancel, c.OrderID(1), c.BUY, c.Price(150), c.Quantity(10))
	sm.AddData(order1.GetPrice(), order1)

	if sm.Empty() {
		t.Error("Expected sorted map to be non-empty")
	}
}

// Test for RBegin
func TestRBeginAscending(t *testing.T) {
	sm := class.NewSortedMap(false)

	order1 := class.NewOrder(c.GoodTillCancel, c.OrderID(1), c.BUY, c.Price(150), c.Quantity(10))
	order2 := class.NewOrder(c.GoodTillCancel, c.OrderID(2), c.BUY, c.Price(120), c.Quantity(10))
	order3 := class.NewOrder(c.GoodTillCancel, c.OrderID(3), c.BUY, c.Price(160), c.Quantity(10))

	sm.AddData(order1.GetPrice(), order1)
	sm.AddData(order2.GetPrice(), order2)
	sm.AddData(order3.GetPrice(), order3)

	// Test ascending sort
	expectedKeys := c.Price(160)
	resKeys, order := sm.RBegin()

	if resKeys != expectedKeys {
		t.Errorf("Expected keys to be %v, got %v", expectedKeys, resKeys)
	}
	if order[0] != order3 {
		t.Errorf("Expected order pointer to be %v, got %v", order3, order)
	}
}

func TestRBeginDescending(t *testing.T) {
	sm := class.NewSortedMap(true)

	order1 := class.NewOrder(c.GoodTillCancel, c.OrderID(1), c.BUY, c.Price(150), c.Quantity(10))
	order2 := class.NewOrder(c.GoodTillCancel, c.OrderID(2), c.BUY, c.Price(120), c.Quantity(10))
	order3 := class.NewOrder(c.GoodTillCancel, c.OrderID(3), c.BUY, c.Price(160), c.Quantity(10))

	sm.AddData(order1.GetPrice(), order1)
	sm.AddData(order2.GetPrice(), order2)
	sm.AddData(order3.GetPrice(), order3)

	// Test ascending sort
	expectedKeys := c.Price(120)
	resKeys, order := sm.RBegin()

	if resKeys != expectedKeys {
		t.Errorf("Expected keys to be %v, got %v", expectedKeys, resKeys)
	}
	if order[0] != order2 {
		t.Errorf("Expected order pointer to be %v, got %v", order2, order)
	}
}
