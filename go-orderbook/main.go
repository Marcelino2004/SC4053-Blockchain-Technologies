package main

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"encoding/hex"
	"fmt"
	"log"
	"math/big"
	"os"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

// Mock marketPrice function that returns a cached price for a given (from, to) pair

// NewGraph creates and returns a new directed graph
func NewGraph() *Graph {
	return &Graph{
		adjacencyList: make(map[string]map[string][]Edge),
		visited:       make(map[string]bool),
		recStack:      make(map[string]bool),
	}
}

// AddEdge adds a directed edge from vertex A to vertex B with order details
func (g *Graph) AddEdge(A, B string, orderID uint64, price, quantity *big.Int, orderType uint8) {
	edge := Edge{OrderID: orderID, Price: price, Quantity: quantity, OrderType: orderType}

	// Initialize adjacency list for vertex A if it doesn't exist
	if g.adjacencyList[A] == nil {
		g.adjacencyList[A] = make(map[string][]Edge)
	}

	// Append the edge only in the direction A -> B
	g.adjacencyList[A][B] = append(g.adjacencyList[A][B], edge)
}

// hasCycleHelper is a recursive function to detect a single cycle in a directed graph
// and return the cycle path if detected.
func (g *Graph) hasCycleHelper(v string, path []string) ([]string, bool) {
	g.visited[v] = true
	g.recStack[v] = true
	path = append(path, v)

	for neighbor := range g.adjacencyList[v] {
		if !g.visited[neighbor] {
			// Recur with path including the current neighbor
			if cyclePath, found := g.hasCycleHelper(neighbor, path); found {
				return cyclePath, true
			}
		} else if g.recStack[neighbor] { // Cycle detected
			// Extract the cycle path from path slice up to the repeated node
			cyclePath := []string{}
			for i := len(path) - 1; i >= 0; i-- {
				cyclePath = append([]string{path[i]}, cyclePath...)
				if path[i] == neighbor {
					break
				}
			}
			return cyclePath, true
		}
	}

	g.recStack[v] = false
	return nil, false
}

func (g *Graph) DetectValidCycle() ([]string, map[string]map[string]Edge, []uint64) {
	// Reset visited and recStack maps for fresh cycle detection
	g.visited = make(map[string]bool)
	g.recStack = make(map[string]bool)

	var orderIDs []uint64

	oneEighteen := new(big.Int).Exp(big.NewInt(10), big.NewInt(18), nil)
	oneEighteenFloat := new(big.Float).SetInt(oneEighteen)

	// Find the first cycle
	for node := range g.adjacencyList {
		if !g.visited[node] {
			if cyclePath, found := g.hasCycleHelper(node, []string{}); found {
				fmt.Println()
				fmt.Println()
				fmt.Println("Cycle detected:", cyclePath)

				// Create a map to store the valid edges of the cycle
				validCycleEdges := make(map[string]map[string]Edge)

				// Process the valid edges and filter out the invalid ones
				for i := 0; i < len(cyclePath); i++ {
					from := cyclePath[i%len(cyclePath)]
					to := cyclePath[(i+1)%len(cyclePath)]

					priceFloat := new(big.Float).SetInt(g.adjacencyList[from][to][0].Price)

					fmt.Printf("From -> To: %v -> %v\n", from, to)
					fmt.Printf("Price: %v  Quantity: %v\n", new(big.Float).Quo(priceFloat, oneEighteenFloat), g.adjacencyList[from][to][0].Quantity)

					if validCycleEdges[from] == nil {
						validCycleEdges[from] = make(map[string]Edge)
					}

					orderIDs = append(orderIDs, g.adjacencyList[from][to][0].OrderID)
					validCycleEdges[from][to] = g.adjacencyList[from][to][0]
				}

				return cyclePath, validCycleEdges, orderIDs
			}
		}
	}

	fmt.Println("No cycles detected.")
	return nil, nil, nil
}

func (g *Graph) calculateMinimumAdjustedQuantities(cyclePath []string, validCycleEdges map[string]map[string]Edge) []*big.Int {
	if len(cyclePath) < 2 {
		fmt.Println("Cycle must contain at least two orders.")
		return []*big.Int{}
	}

	// Define a "max" value for *big.Int
	maxBigInt := new(big.Int)
	maxBigInt.SetString("179769313486231570814527423731704356258019319424456580314817725994201445298688", 10)

	// Initialize minimum quantity and minIndex
	minQuantity := maxBigInt
	minIndex := -1

	// Define 1e18 as a bigInt
	oneEighteen := new(big.Int).Exp(big.NewInt(10), big.NewInt(18), nil)
	oneEighteenFloat := new(big.Float).SetInt(oneEighteen)

	// Process the cycle and compare quantities

	for i := 0; i < len(cyclePath); i++ {
		start := cyclePath[i%len(cyclePath)]
		end := cyclePath[(i+1)%len(cyclePath)]

		// Get the valid edges for the start and end orders
		startEdge := validCycleEdges[start][end]
		endEdge := validCycleEdges[end][cyclePath[(i+2)%len(cyclePath)]]

		fmt.Println()
		fmt.Println()
		fmt.Printf("From -> To: %v -> %v\n", start, end)
		fmt.Printf("From -> To: %v -> %v\n", end, cyclePath[(i+2)%len(cyclePath)])

		// Calculate adjusted quantities for the start and end orders
		var adjustedQuantity *big.Int
		if startEdge.Price.Cmp(oneEighteen) >= 0 {
			price := new(big.Float).SetInt(startEdge.Price)
			price = new(big.Float).Quo(price, oneEighteenFloat)

			fmt.Println("price:", price)

			quantityFloat := new(big.Float).SetInt(endEdge.Quantity)
			fmt.Println("quantityFloat:", quantityFloat)
			resultFloat := new(big.Float).Quo(quantityFloat, price)

			adjustedQuantity = new(big.Int)
			resultFloat.Int(adjustedQuantity)
			fmt.Println("adjustedQuantity:", adjustedQuantity)

		} else {
			adjustedQuantity = endEdge.Quantity
		}

		fmt.Println("adjustedQuantity:", adjustedQuantity)

		// Check and update minimum quantity logic
		if adjustedQuantity.Cmp(minQuantity) <= 0 {
			minQuantity = adjustedQuantity
			minIndex = (i + 1) % len(cyclePath)
		}
	}

	// Output the minimum quantity and the corresponding order index
	if minIndex != -1 {
		fmt.Printf("minQuantity: %v\n", minQuantity) // %v prints the value in its default form
		fmt.Printf("minIndex: %d\n", minIndex)       // %d prints the integer value of minIn
		return g.countQuantity(cyclePath, validCycleEdges, minQuantity, minIndex)
	} else {
		fmt.Println("No valid minimum quantity found.")
		return []*big.Int{}
	}
}

func (g *Graph) countQuantity(cyclePath []string, validCycleEdges map[string]map[string]Edge, minQuantity *big.Int, minIndex int) []*big.Int {
	// Initialize a temporary list with the same length as cyclePath
	tempQuantities := make([]*big.Int, len(cyclePath))

	// Set the quantity at minimum index to the minimum quantity
	tempQuantities[minIndex] = minQuantity

	// Set the initial multiplier
	multiplier := minQuantity
	fmt.Println("")
	fmt.Println("")

	fmt.Println("Calculated Quantities: ", tempQuantities)

	oneEighteen := new(big.Int).Exp(big.NewInt(10), big.NewInt(18), nil)

	// Loop through the cycle and calculate the quantities
	for i := 0; i < len(cyclePath)-1; i++ {
		start := cyclePath[minIndex%len(cyclePath)]
		end := cyclePath[(minIndex+1)%len(cyclePath)]

		// Get the valid edges for the start and end orders
		edge := validCycleEdges[start][end]
		//fmt.Printf("start %v : end  %v  price: %v \n", start, end, edge.Price)

		// Calculate next quantity for the current edge
		fmt.Println("Multiplier:  ", multiplier, "   edge.Price:   ", edge.Price)
		nextQuantity := new(big.Int).Mul(multiplier, edge.Price)
		nextQuantity.Div(nextQuantity, oneEighteen)

		// Store the next quantity in the tempQuantities array
		tempQuantities[(minIndex+1)%len(cyclePath)] = nextQuantity

		// Update the multiplier for the next iteration
		multiplier = nextQuantity
		fmt.Println("Calculated Quantities: ", tempQuantities)

		minIndex++

	}

	return tempQuantities
}

// 	// Print the calculated quantities
// 	//fmt.Println("Calculated Quantities: ", tempQuantities)
// 	return tempQuantities
// }

// 	for i := 0; i < len(edges); i++ {
// 		edge := edges[i]
// 		if (edge.OrderType == 1 && edge.Price < currentMarketPrice) || (edge.OrderType == 0 && edge.Price > currentMarketPrice) {
// 			// Keep the valid edge
// 			validEdges = append(validEdges, edge)
// 			// fmt.Printf("  Valid Edge - OrderID: %s, Price: %.2f, Quantity: %.2f, OrderType: %d, MarketPrice: %.2f\n",
// 			// 	edge.OrderID, edge.Price, edge.Quantity, edge.OrderType, currentMarketPrice)
// 		} else {
// 			// Remove the invalid edge
// 			//fmt.Printf("  Invalid Edge - OrderID: %s, Price: %.2f, Quantity: %.2f, OrderType: %d, MarketPrice: %.2f (Removed)\n",
// 			//edge.OrderID, edge.Price, edge.Quantity, edge.OrderType, currentMarketPrice)
// 			// Shift the remaining edges to the left to remove the invalid edge
// 			edges = append(edges[:i], edges[i+1:]...)
// 			i-- // Decrease i to recheck the new element at the current index after removal
// 		}
// 	}

// 	// Return only the valid edges
// 	return validEdges
// }

// func main() {

// 	graph := NewGraph()
// 	graph.AddEdge("B", "C", 1, 2, 15, 1)
// 	graph.AddEdge("C", "D", 2, 1, 20, 1)
// 	graph.AddEdge("D", "E", 3, 1, 10, 1)
// 	graph.AddEdge("E", "B", 4, 0.5, 12, 1)

// 	// Detecting and printing the first cycle
// 	cyclePath, validCycleEdges, orderIDs := graph.DetectValidCycle()

// 	fmt.Println("Order IDs in the Cycle:", orderIDs)

// 	if cyclePath != nil {
// 		quantities := graph.calculateMinimumAdjustedQuantities(cyclePath, validCycleEdges)
// 		fmt.Println("Order IDs in the Cycle:", quantities)
// 	} else {
// 		fmt.Println("No valid cycle detected.")
// 	}
// }

// Replace with your contract address and ABI
const (
	contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
	hardhatNetwork  = "ws://127.0.0.1:8545/"
)

type Order struct {
	UserAddress common.Address // Matches Solidity's `address`
	OrderType   uint8          // Matches Solidity's `uint8` enum for `OrderType`
	OrderID     uint64         // Matches Solidity's `uint64`
	Price       *big.Int       // Matches Solidity's `uint256`
	Quantity    *big.Int       // Matches Solidity's `uint256`
	TokenPair0  common.Address // Matches Solidity's `address`
	TokenPair1  common.Address // Matches Solidity's `address`
}

type Edge struct {
	OrderID   uint64
	Price     *big.Int
	Quantity  *big.Int
	OrderType uint8
}

// Graph structure with adjacency list storing lists of edges for each directed connection
type Graph struct {
	adjacencyList map[string]map[string][]Edge
	visited       map[string]bool
	recStack      map[string]bool
}

func loadABI(filename string) (abi.ABI, error) {
	// Read the ABI JSON file
	data, err := os.ReadFile(filename)
	if err != nil {
		return abi.ABI{}, err
	}

	// Parse the ABI JSON directly into an abi.ABI object
	parsedABI, err := abi.JSON(bytes.NewReader(data))
	if err != nil {
		return abi.ABI{}, err
	}
	return parsedABI, nil
}

func generateKeyAndAddress() (*ecdsa.PrivateKey, string, error) {
	// Specify your private key (hexadecimal string)
	privateKeyHex := "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

	// Decode the private key from the hex string
	privateKeyBytes, err := hex.DecodeString(privateKeyHex[2:]) // Strip off the "0x" prefix
	if err != nil {
		return nil, "", fmt.Errorf("failed to decode private key: %v", err)
	}

	// Create the ecdsa.PrivateKey object from the decoded bytes
	privateKey, _ := crypto.ToECDSA(privateKeyBytes)

	// Get the public key from the private key
	publicKey := privateKey.PublicKey

	// Convert the public key to an Ethereum address
	address := crypto.PubkeyToAddress(publicKey)

	// Print the private key and address
	fmt.Printf("Private Key: %x\n", crypto.FromECDSA(privateKey))
	fmt.Printf("Address: %s\n", address.Hex())

	return privateKey, address.Hex(), nil
}

func matchOrder(parsedABI abi.ABI, client *ethclient.Client, orderIDList []uint64, quantity []*big.Int) error {

	_, err := parsedABI.Pack("matchTrade", orderIDList, quantity)
	if err != nil {
		log.Fatalf("Failed to pack arguments: %v", err)
	}
	// Further logic for matching orders

	fmt.Printf("aight reaching matchOrder")
	privateKey, _, err := generateKeyAndAddress()

	auth, err := bind.NewKeyedTransactorWithChainID(privateKey, big.NewInt(1337))
	if err != nil {
		log.Fatalf("Failed to create authorized transactor: %v", err)
	}

	// Create a bound contract instance and send the transaction
	contract := bind.NewBoundContract(common.HexToAddress(contractAddress), parsedABI, client, client, client)
	tx, err := contract.Transact(auth, "matchTrade", orderIDList, quantity)
	if err != nil {
		log.Fatalf("Failed to send transaction: %v", err)
	}

	fmt.Printf("Transaction sent: %s\n", tx.Hash().Hex())
	return nil
}

func ProcessBatchOrder(orders []Order) ([]uint64, []*big.Int) {
	graph := NewGraph()

	for _, order := range orders {
		graph.AddEdge(order.TokenPair0.Hex(), order.TokenPair1.Hex(), order.OrderID, order.Price, order.Quantity, order.OrderType)
	}

	cyclePath, validCycleEdges, orderIDs := graph.DetectValidCycle()
	fmt.Println("Order IDs:", orderIDs)

	if cyclePath != nil {
		quantities := graph.calculateMinimumAdjustedQuantities(cyclePath, validCycleEdges)
		return orderIDs, quantities
	} else {
		fmt.Println("No valid cycle detected.")
	}

	return []uint64{}, []*big.Int{}

}

// func processOrder(orders []Order) {
// 	// Process and print the orders
// 	graph := NewGraph()

// 	for _, order := range orders {
// 		fmt.Printf("Order: ID: %v, Type: %v, User: %s, Price: %v, Quantity: %v, TokenPair0: %s, TokenPair1: %s\n",
// 			order.OrderID, order.OrderType, order.UserAddress.Hex(), order.Price, order.Quantity, order.TokenPair0.Hex(), order.TokenPair1.Hex())

// 		oneEighteen := big.NewInt(1e18)
// 		price := new(big.Float).SetInt(order.Price)
// 		price.Quo(price, new(big.Float).SetInt(oneEighteen))

// 		priceFloat64, _ := price.Float64()

// 		quantity := new(big.Float).SetInt(order.Quantity)
// 		quantity.Quo(quantity, new(big.Float).SetInt(oneEighteen))

// 		quantityFloat64, _ := quantity.Float64()

// 		graph.AddEdge(order.TokenPair0.Hex(), order.TokenPair1.Hex(), int(order.OrderID), priceFloat64, quantityFloat64, int(order.OrderType))
// 	}

// 	cyclePath, validCycleEdges, orderIDs := graph.DetectValidCycle()
// 	fmt.Println("Order IDs in the Cycle:", orderIDs)

// 	if cyclePath != nil {
// 		quantities := graph.calculateMinimumAdjustedQuantities(cyclePath, validCycleEdges)
// 		fmt.Println("Order IDs in the Cycle:", quantities)
// 	} else {
// 		fmt.Println("No valid cycle detected.")
// 	}

// }

func GetMasterLP(client *ethclient.Client, contractAddress string, parsedABI abi.ABI) (common.Address, error) {
	// Pack the call data for getMasterLP
	callData, err := parsedABI.Pack("getMasterLP")
	if err != nil {
		return common.Address{}, fmt.Errorf("failed to pack call data: %v", err)
	}

	// Convert contract address to common.Address type
	address := common.HexToAddress(contractAddress)

	// Set up the call message
	msg := ethereum.CallMsg{
		To:   &address,
		Data: callData,
	}

	// Call the contract
	result, err := client.CallContract(context.Background(), msg, nil)
	if err != nil {
		return common.Address{}, fmt.Errorf("failed to call contract: %v", err)
	}

	// Decode the result to get the MasterLP address
	var masterLPAddress common.Address
	err = parsedABI.UnpackIntoInterface(&masterLPAddress, "getMasterLP", result)
	if err != nil {
		return common.Address{}, fmt.Errorf("failed to unpack MasterLP address: %v", err)
	}

	return masterLPAddress, nil
}

func GetLiquidityPool(tokenPair0, tokenPair1 common.Address) (common.Address, error) {
	// Pack the call data for getLP function
	callData, err := MasterLPABI.Pack("getLP", tokenPair0, tokenPair1)
	if err != nil {
		return common.Address{}, fmt.Errorf("failed to pack call data: %v", err)
	}

	// Set up the call message with the MasterLP address
	msg := ethereum.CallMsg{
		To:   &masterLPAddress,
		Data: callData,
	}

	// Call the contract
	result, err := client.CallContract(context.Background(), msg, nil)
	if err != nil {
		return common.Address{}, fmt.Errorf("failed to call contract: %v", err)
	}

	// Decode the result to get the ILiquidityPool address
	var liquidityPoolAddress common.Address
	err = MasterLPABI.UnpackIntoInterface(&liquidityPoolAddress, "getLP", result)
	if err != nil {
		return common.Address{}, fmt.Errorf("failed to unpack ILiquidityPool address: %v", err)
	}

	return liquidityPoolAddress, nil
}

func GetMarketPrice(tokenIn, tokenOut common.Address) (*big.Int, error) {
	fmt.Println("tokenIn:", tokenIn.String())
	fmt.Println("tokenOut:", tokenOut.String())

	liquidityPoolAddress, err := GetLiquidityPool(tokenIn, tokenOut)
	if err != nil {
		log.Fatalf("Error retrieving LiquidityPool address: %v", err)
	}

	// Pack the call data for getMarketPrice function
	callData, err := liquidityPoolABI.Pack("getMarketPrice", tokenIn, tokenOut)
	if err != nil {
		return nil, fmt.Errorf("failed to pack call data for getMarketPrice: %v", err)
	}

	// Set up the call message with the LiquidityPool address
	msg := ethereum.CallMsg{
		To:   &liquidityPoolAddress,
		Data: callData,
	}

	// Call the contract
	result, err := client.CallContract(context.Background(), msg, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to call contract: %v", err)
	}

	// Decode the result to get the market price (price is returned as uint256)
	var price *big.Int
	err = liquidityPoolABI.UnpackIntoInterface(&price, "getMarketPrice", result)
	if err != nil {
		return nil, fmt.Errorf("failed to unpack market price: %v", err)
	}

	return price, nil
}

// Declare the global variables
var (
	client           *ethclient.Client
	parsedABI        abi.ABI
	MasterLPABI      abi.ABI
	liquidityPoolABI abi.ABI
	masterLPAddress  common.Address
)

// If a price doesn't exist for the pair, it generates and stores a new random price
func marketPrice(from, to string) *big.Int {
	// Generate a new random price if it doesn't exist and store it
	price, err := GetMarketPrice(common.HexToAddress(from), common.HexToAddress(to))
	if err != nil {

	}

	// Store and return the price
	return price
}

func main() {
	// Connect to the Ethereum client
	//client, err := ethclient.Dial(hardhatNetwork)

	client, _ = ethclient.Dial(hardhatNetwork)

	// // Parse the contract ABI
	//TODO: make this dynamic, right now copying directly from bllkchain-orderbook
	parsedABI, err := loadABI("DEX_ABI.json")
	if err != nil {
		log.Fatalf("Failed to load ABI: %v", err)
	}

	MasterLPABI, err = loadABI("MasterLP_ABI.json")
	if err != nil {
		log.Fatalf("Failed to load ABI: %v", err)
	}

	liquidityPoolABI, err = loadABI("LP_ABI.json")
	if err != nil {
		log.Fatalf("Failed to load ABI: %v", err)
	}

	// Create a filter query for the OrderAdded event
	query := ethereum.FilterQuery{
		Addresses: []common.Address{common.HexToAddress(contractAddress)},
	}

	// Create a channel to receive logs
	logsChannel := make(chan types.Log)

	// Start a log filter subscription
	logs, err := client.SubscribeFilterLogs(context.Background(), query, logsChannel)
	if err != nil {
		log.Fatalf("Failed to subscribe to logs: %v", err)
	}

	// Process logs in a loop
	for {
		select {
		case err := <-logs.Err():
			log.Printf("Error while fetching logs: %v", err)

		case vLog := <-logsChannel:
			fmt.Println("In the loop")
			if vLog.Topics[0].Hex() == parsedABI.Events["AMMPriceChange"].ID.Hex() || vLog.Topics[0].Hex() == parsedABI.Events["CreateOrder"].ID.Hex() {
				// Call getAllOrders
				callData, err := parsedABI.Pack("getAllOrders")
				if err != nil {
					log.Printf("Failed to pack call data: %v", err)
					continue
				}

				address := common.HexToAddress(contractAddress)

				msg := ethereum.CallMsg{
					To:   &address,
					Data: callData,
				}

				result, err := client.CallContract(context.Background(), msg, nil)
				if err != nil {
					log.Printf("Failed to call contract: %v", err)
					continue
				}

				// Decode the result from getAllOrders
				var orders []Order
				err = parsedABI.UnpackIntoInterface(&orders, "getAllOrders", result)
				if err != nil {
					log.Printf("Failed to unpack orders: %v", err)
					continue
				}

				masterLPAddress, err = GetMasterLP(client, contractAddress, parsedABI)
				if err != nil {
					log.Fatalf("Error retrieving MasterLP address: %v", err)
				}
				fmt.Printf("MasterLP Address: %s\n", masterLPAddress.Hex())

				var batchOrders []Order

				for _, order := range orders {
					marketPrice := marketPrice(order.TokenPair0.Hex(), order.TokenPair1.Hex())
					fmt.Println("MarketPrice is ", marketPrice)

					if (order.OrderType == 1 && order.Price.Cmp(marketPrice) >= 0) || (order.OrderType == 2 && order.Price.Cmp(marketPrice) <= 0) {
						fmt.Println("valid order -> matching ", order.OrderID)
						matchOrder(parsedABI, client, []uint64{order.OrderID}, []*big.Int{order.Quantity}) // ensure uint256 is correctly defined
					} else {
						fmt.Println("invalid order -> skipping ", order.OrderID)
						batchOrders = append(batchOrders, order)
					}
				}

				orderIDs, quantities := ProcessBatchOrder(orders)
				log.Println()
				log.Println("quantities: ", quantities)
				if len(orderIDs) != 0 {
					matchOrder(parsedABI, client, orderIDs, quantities)
				}
				// processOrder(orders)

				// matchOrder(parsedABI, client)

				//break

			} else {
				log.Println("Different event detected")
			}

		}
	}
}
