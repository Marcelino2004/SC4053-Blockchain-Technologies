package tests

import (
	"testing"

	"orderbook.com/m/class"
)

func TestNewGraph(t *testing.T) {
	graph := class.NewGraph()
	if len(graph.GetNodes()) != 0 {
		t.Errorf("Expected an empty graph, got %d nodes", len(graph.GetNodes()))
	}
}

func TestAddEdges(t *testing.T) {
	graph := class.NewGraph()

	graph.AddEdges("A", "B")

	if len(graph.GetNodes()["A"]) != 1 || graph.GetNodes()["A"][0] != "B" {
		t.Errorf("Expected A to connect to B, got %v", graph.GetNodes()["A"])
	}
	if len(graph.GetNodes()["B"]) != 1 || graph.GetNodes()["B"][0] != "A" {
		t.Errorf("Expected B to connect to A, got %v", graph.GetNodes()["B"])
	}

	graph.AddEdges("A", "C")
	if len(graph.GetNodes()["A"]) != 2 || graph.GetNodes()["A"][1] != "C" {
		t.Errorf("Expected A to connect to C, got %v", graph.GetNodes()["A"])
	}
	if len(graph.GetNodes()["C"]) != 1 || graph.GetNodes()["C"][0] != "A" {
		t.Errorf("Expected C to connect to A, got %v", graph.GetNodes()["C"])
	}
}

func TestDeleteEdge(t *testing.T) {
	graph := class.NewGraph()
	graph.AddEdges("A", "B")
	graph.AddEdges("A", "C")
	graph.AddEdges("B", "C")

	// Delete edge A - B
	graph.DeleteEdge("A", "B")
	if len(graph.GetNodes()["A"]) != 1 || graph.GetNodes()["A"][0] != "C" {
		t.Errorf("Expected A to connect only to C after deleting edge to B, got %v", graph.GetNodes()["A"])
	}
	if len(graph.GetNodes()["B"]) != 1 || graph.GetNodes()["B"][0] != "C" {
		t.Errorf("Expected B to connect only to C, got %v", graph.GetNodes()["B"])
	}

	// Delete edge B - C
	graph.DeleteEdge("B", "C")
	if len(graph.GetNodes()["B"]) != 0 {
		t.Errorf("Expected B to have no connections after deleting edge to C, got %v", graph.GetNodes()["B"])
	}
	if len(graph.GetNodes()["C"]) != 1 || graph.GetNodes()["C"][0] != "A" {
		t.Errorf("Expected C to connect only to A, got %v", graph.GetNodes()["C"])
	}

	// Delete edge A - C
	graph.DeleteEdge("A", "C")
	if len(graph.GetNodes()["A"]) != 0 {
		t.Errorf("Expected A to have no connections after deleting edge to C, got %v", graph.GetNodes()["A"])
	}
	if len(graph.GetNodes()["C"]) != 0 {
		t.Errorf("Expected C to have no connections after deleting edge to A, got %v", graph.GetNodes()["C"])
	}
}

func TestDeleteNonExistentEdge(t *testing.T) {
	graph := class.NewGraph()
	graph.AddEdges("A", "B")

	// Attempt to delete a non-existent edge
	graph.DeleteEdge("A", "C")
	if len(graph.GetNodes()["A"]) != 1 || graph.GetNodes()["A"][0] != "B" {
		t.Errorf("Expected A to still connect to B, got %v", graph.GetNodes()["A"])
	}
	if len(graph.GetNodes()["B"]) != 1 || graph.GetNodes()["B"][0] != "A" {
		t.Errorf("Expected B to still connect to A, got %v", graph.GetNodes()["B"])
	}
}

func TestHasCycle(t *testing.T) {

	g1 := class.NewGraph()
	g1.AddEdges("A", "B")
	g1.AddEdges("B", "C")
	g1.AddEdges("C", "A") // creating cycle A-B-C-A

	if !g1.HasCycle() {
		t.Errorf("Expected cycle in graph g1, but found none.")
	}

	g2 := class.NewGraph()
	g2.AddEdges("A", "B")
	g2.AddEdges("B", "C") // no cycle A-B-C

	if g2.HasCycle() {
		t.Errorf("Expected no cycle in graph g2, but found one.")
	}

	g3 := class.NewGraph()
	g3.AddEdges("A", "B")
	g3.AddEdges("B", "C")
	g3.AddEdges("C", "A") // cycle A-B-C-A
	g3.AddEdges("D", "E") // disconnected part

	if !g3.HasCycle() {
		t.Errorf("Expected cycle in graph g3, but found none.")
	}

	g5 := class.NewGraph()
	g5.AddEdges("A", "B")
	g5.AddEdges("C", "D") // no cycles

	if g5.HasCycle() {
		t.Errorf("Expected no cycle in graph g5, but found one.")
	}
}
