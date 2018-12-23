import { draw } from "./frame";

var K = {
	// PHYSICS CONSTANTS
	SPRING_CONSTANT : 0.1,
	EQUILIBRIUM_DISPLACEMENT : 30,
	TIME_STEP : 0.8,
	FRICTION : 0.95,

	// DIMENSIONS OF PHASE SPACE
	W_0 : 800,
	H_0 : 400,

	// DIMENSIONS OF CANVAS
	W_1 : 1000,
	H_1 : 600,

	PHASE_SPACE_LIMIT_RIGHT_MARGIN : 50,
	PHASE_SPACE_LIMIT_MINOR_MARGIN : 15,

	// VERT GAP BETWEEN NODE & LABEL
	NODE_LABEL_VERT_SPACING : 5,
	NODE_LABEL_HORIZ_SPACING : 5,
	NODE_LABEL_FONTFAMILY : '10pt Arial',

	// PERIOD OF GTK WINDOW TIMER TICK EVENT [that our handler is hooked into]
	TIMER_TICK_PERIOD : 50, // milliseconds

	MINIMUM_NODE_SELECTION_RADIUS : 50.0,

	DEMO_GRAPH_SIZE : 11,
	DEMO_GRAPH_BRANCHING_CONST : 2,
	GENERATION_INTERVAL : 10.0 ,// seconds
};

var lastUsedTagIndex = 0;
function popUnusedTagIdx() {
	var idx = lastUsedTagIndex;
	lastUsedTagIndex += 1;
	return idx;
};

function Tag(xy, label) {

	this.idx = popUnusedTagIdx();
	
	this.label = label;
	
	this.position = {
		x : xy.x,
		y : xy.y
	};
	
	this.translatedPosition = {
		x : xy.x,
		y : xy.y
	};
	
	this.netElectrostaticForce = {
		x : 0,
		y : 0
	};
	
	this.netSpringForce = {
		x : 0,
		y : 0
	};
	
	this.displacement = {
		x : 0,
		y : 0
	};

	this.isSelected = false;

	this.toString = function() {
		return "Tag" + this.idx.toString();

		/*
		 s = ('%i = %s' % (this.idx, this.label)) + '\n'
		 s = s + ('(x,y) = (%f,%f)' % (this.position.x, this.position.y)) + '\n'

		 (Fx, Fy) = this.netElectrostaticForce
		 s = s + ('electro-static Fx, Fy = %f, %f' % (Fx, Fy)) + '\n'

		 (Fx, Fy) = this.netSpringForce
		 s = s + ('spring Fx, Fy = %f, %f' % (Fx, Fy)) + '\n'

		 (dx, dy) = this.displacement
		 s = s + ('displacement dx, dy = %f, %f' % (dx, dy)) + '\n'

		 return s
		 */
	};
};

// ---------------------------------------------------------------------------------------------------------

export class ForceDirectedGraph {

	constructor(
		public graph: any
	) {}

	translate = (xy, w0, h0, w1, h1) => {

		var x1 = (w1 / 2.0) + xy.x * (w1 / w0);
		var y1 = (h1 / 2.0) - xy.y * (h1 / h0);

		return {
			x : x1,
			y : y1
		};
	};

	reverse = (xy, w0, h0, w1, h1) => {

		var x0 = (xy.x - (w1 / 2.0)) * (w0 / w1);
		var y0 = ((h1 / 2.0) - xy.y) * (h0 / h1);

		return {
			x : x0,
			y : y0
		};
	};
	
	wrapReverse = (xy) => {
		return this.reverse(xy, K.W_0, K.H_0, K.W_1, K.H_1);
	};

	drawToContext = (context, node_label_vert_spacing) => {

		var edge_colour = 'darkgreen', node_colour = 'darkgreen', text_colour = 'black', selected_node_colour = 'blue', edges_adj_to_selected_node_colour = 'blue';

		var selected_node = null;
		for(let i = 0; i < this.graph.vertices.length; i++)
		if(this.graph.vertices[i].isSelected) {
			selected_node = this.graph.vertices[i];
			break;
		};

		var canvas = document.getElementById('canvas') as HTMLCanvasElement;

		context.clearRect(0, 0, canvas.width, canvas.height);

		// EDGES
		//
		for (let i = 0; i < this.graph.edges.length; i++) {

			var edge = this.graph.edges[i];
			var v1 = edge.v1;
			var v2 = edge.v2;	
			
			if((selected_node === v1) || (selected_node === v2))
				context.strokeStyle = "black";
			else
				context.strokeStyle = "darkgray";
			
			// DRAW EDGE
			// context.drawLine
			// pixmap.draw_line(gc, int(i.translatedPosition.x), int(i.translatedPosition.y), int(j.translatedPosition.x), int(j.translatedPosition.y))
			context.beginPath();
			context.moveTo(v1.translatedPosition.x, v1.translatedPosition.y);
			context.lineTo(v2.translatedPosition.x, v2.translatedPosition.y);
			context.stroke();
		}

		var box_side = 10;

		for (let i = 0; i < this.graph.vertices.length; i++) {

			var node = this.graph.vertices[i];
			
			const x = node.translatedPosition.x;
			const y = node.translatedPosition.y;

			// COLOURS = ['red', 'green', 'blue', 'purple', 'red_float', 'green_float', 'blue_float']
			//
			//gc.set_foreground(pixmap.get_colormap().alloc_color("brown"))

			// NODES
			//
			/*
			if isSelected
			gc.set_foreground(pixmap.get_colormap().alloc_color(selected_node_colour));
			else
			gc.set_foreground(pixmap.get_colormap().alloc_color(node_colour));
			*/

	        if (node.isSelected) {
	        	context.fillStyle = "black";
	        }
	        else
	        {
	        	context.fillStyle = "black";
	        }

	        var radius     = 5;                    // Arc radius
	        var startAngle = 0;                     // Starting point on circle
	        var endAngle   = 2 * Math.PI; // End point on circle
	        var clockwise  = true; // clockwise or anticlockwise

			context.beginPath();	    
	        context.arc(x,y,radius,startAngle,endAngle, clockwise);
	        context.fill();
	        
	        if (node.isSelected) {
	        	radius = 10;
				context.beginPath();	    
				context.arc(x,y,radius,startAngle,endAngle, clockwise);
				context.strokeStyle = "black";
				context.stroke();
	        }
	        
			// LABEL / TEXT
			//
			/*
			if (this.gem.display_node_labels):
			
			font = style.get_font()
			pixmap.draw_text(font, gc, x, y - node_label_vert_spacing, node.label)
			*/
			
			context.font = K.NODE_LABEL_FONTFAMILY;
			context.fillText(node.label, x + K.NODE_LABEL_HORIZ_SPACING, y - K.NODE_LABEL_VERT_SPACING);
		};
	};

	netElectrostaticForceAtNode = (tagA) => {

		var
			Fx_net = 0.0, 
			Fy_net = 0.0;

		for(let i = 0; i < this.graph.vertices.length; i++) {

			var tagB = this.graph.vertices[i];

			if(tagB == tagA)
				continue;

			var xA = tagA.position.x;
			var yA = tagA.position.y;

			var xB = tagB.position.x;
			var yB = tagB.position.y;

			var deltaX = xA - xB;
			var deltaY = yA - yB;

			var r2 = (deltaX * deltaX) + (deltaY * deltaY);
			var r = Math.sqrt(r2);

			if(r == 0)
				continue;

			var sin_theta = deltaY / r;
			var cos_theta = deltaX / r;

			var q_A = 10.0;
			var q_B = 10.0;
			var k = 100.0;

			var scalar_force = k * q_A * q_B / (r * r);

			var Fy = scalar_force * sin_theta;
			var Fx = scalar_force * cos_theta;
			
			Fy_net += Fy;
			Fx_net += Fx;
		};

		return {
			x : Fx_net,
			y : Fy_net
		}
	};

	netSpringForceAtNode = (tag) => {

		var Fx_net = 0;
		var Fy_net = 0;

		var x_tag = tag.position.x;
		var y_tag = tag.position.y;

		for(let i = 0; i < this.graph.edges.length; i++) {

			var edge = this.graph.edges[i];

			var edge_tag_1 = edge.v1;
			var edge_tag_2 = edge.v2;

			var other_tags = [edge_tag_1, edge_tag_2];

			if(other_tags.indexOf(tag) == -1)
				continue;

			var other_tag;
			if(other_tags[0] == tag)
				other_tag = other_tags[1];
			else
				other_tag = other_tags[0];

			var x_other = other_tag.position.x;
			var y_other = other_tag.position.y;

			var r2 = Math.pow((x_tag - x_other), 2) + Math.pow(y_tag - y_other, 2);
			var r = Math.sqrt(r2);

			if(r == 0)
				continue;

			// PHYSICS CONSTANTS
			//
			var k = K.SPRING_CONSTANT;
			var l = K.EQUILIBRIUM_DISPLACEMENT;

			var scalar_force = -k * (l - r);

			let tag_A = null, tag_B = null;

			// DISTINGUISH BETWEEN PUSH & PULL VECTORS
			//
			if(scalar_force < 0) {
				tag_A = tag;
				tag_B = other_tag;
			} else {
				tag_A = other_tag;
				tag_B = tag;
			}

			var deltaX = tag_A.position.x - tag_B.position.x;
			var deltaY = tag_A.position.y - tag_B.position.y;

			var sin_theta = deltaY / r;
			var cos_theta = deltaX / r;

			var Fy = scalar_force * sin_theta;
			var Fx = scalar_force * cos_theta;
			Fy_net = Fy_net + Fy;
			Fx_net = Fx_net + Fx;
		};

		return {
			x : Fx_net,
			y : Fy_net
		};
	};

	netForceAtNode = (tag) => {

		/*
		 net Force = net Electrostatic Force + net Spring Force
		 */

		var e = tag.netElectrostaticForce;
		var s = tag.netSpringForce;

		var nX = e.x + s.x;
		var nY = e.y + s.y;

		return {
			x : nX,
			y : nY
		};
	};

	displacementAtNode = (tag) => {

		/*
		 ERROR - DISPLACEMENT IS ! USING VELOCITY
		 */

		var e = tag.netElectrostaticForce;
		var s = tag.netSpringForce;
		
		const nX = e.x + s.x;
		const nY = e.y + s.y;
		
		const displacement = {x:nX, y:nY};

		return displacement
	};

	iterate = (context) => {
		/*
		for each node
		calc net electrostatic force
		calc net spring force
		calc displacement [impulse]
		effect displacements
		*/

		// ------------------------------------
		// FOR EACH NODE

		// CALCULATE NET FORCE
		//
		for (var i = 0; i < this.graph.vertices.length; i++) {
			this.graph.vertices[i].netElectrostaticForce = this.netElectrostaticForceAtNode(this.graph.vertices[i]);
		}

		var here = true;

		for( i = 0; i < this.graph.vertices.length; i++) {
			this.graph.vertices[i].netSpringForce = this.netSpringForceAtNode(this.graph.vertices[i]);
		}

		// CALC DISPLACEMENT
		//
		for(i = 0; i < this.graph.vertices.length; i++) {
			this.graph.vertices[i].displacement = this.displacementAtNode(this.graph.vertices[i]);
		}

		// ADJUST POSITION
		//
		for(i = 0; i < this.graph.vertices.length; i++) {
			var tag = this.graph.vertices[i];
			if (tag.isSelected && window.state.b0Down) {
			} 
			else {
				var displacement = tag.displacement;
				tag.position.x = tag.position.x + displacement.x;
				tag.position.y = tag.position.y + displacement.y;
			}
		}

		this.enforcePositionLimits(K.PHASE_SPACE_LIMIT_RIGHT_MARGIN, K.PHASE_SPACE_LIMIT_MINOR_MARGIN);

		// TRANSLATE TO CANVAS
		//
		for( i = 0; i < this.graph.vertices.length; i++) {
			var node = this.graph.vertices[i];
			node.translatedPosition = this.translate(node.position, K.W_0, K.H_0, K.W_1, K.H_1);
		}
		// CALL RENDERING METHOD
		//
		this.drawToContext(context);
	};

	enforcePositionLimits = (rightMargin, minorMargin) => {
		
		for (let i = 0; i < this.graph.vertices.length; i++) {
			var node = this.graph.vertices[i];

			if (node.position.x < - ((K.W_0 / 2) - minorMargin))
				node.position.x = - ((K.W_0 / 2) - minorMargin);
			else if (node.position.x > ((K.W_0 / 2) - rightMargin))
				node.position.x = (K.W_0 / 2) - rightMargin;

			if (node.position.y < - ((K.H_0 / 2) - minorMargin))
				node.position.y = - ((K.H_0 / 2) - minorMargin);
			else if (node.position.y > ((K.H_0 / 2) - minorMargin))
				node.position.y = (K.H_0 / 2) - minorMargin;
		}		
	};

	handleNodeSelectionAttempt = (canvasPos) => {

		var transformedPos = this.reverse(canvasPos, K.W_0, K.H_0, K.W_1, K.H_1);

		// calc distance from each node
		//
		var r2s = [];
		// r2 : Node
		for(let i = 0; i < this.graph.vertices.length; i++) {
			var node = this.graph.vertices[i];
			// r2 = (x - mx0)^2 + (y - my0)^2
			r2s.push(Math.pow(node.position.x - transformedPos.x, 2) + Math.pow(node.position.y - transformedPos.y, 2));
		}

		var closestNode = null;
		var closestDistance = null;

		for (let i = 0; i < r2s.length; i++) {
			if(r2s[i] < (K.MINIMUM_NODE_SELECTION_RADIUS * K.MINIMUM_NODE_SELECTION_RADIUS)) {
				if(closestNode == null) {
					closestNode = this.graph.vertices[i];
					closestDistance = r2s[i];
					continue;
				}
				else if(r2s[i] < closestDistance) {
					closestNode = this.graph.vertices[i];
					closestDistance = r2s[i];
				}
			}
		}

		var selectionChanged = false;
		var selectedNode = null;
		
		for (let i = 0; i < this.graph.vertices.length; i++) {
			
			var node = this.graph.vertices[i];
			// RESET ALL OTHER NODES
			
			if (node != closestNode) {
				if (node.isSelected == true) {
				
					node.isSelected = false;
					selectionChanged = true;
				}
			}
			
			// TOGGLE SELECTION ON TARGET NODE
			else if (node == closestNode) {
				
				node.isSelected = !node.isSelected;
				selectionChanged = true;
				
				if (node.isSelected)
					selectedNode = node;
			}
		}
		
		return selectionChanged;
	};
};

// ---------------------------------------------------------------------------------------------------------

export class Graph {

	public vertices = [];
	public edges = [];

	addNode = (tag) => this.vertices.push(tag);

	removeNode = (tag) => {
		
		// remove vertex
		//
		var vIdx = this.vertices.indexOf(tag);
		this.vertices.splice(vIdx, 1);
		
		// remove adjcant edges
		
		var toRemove = [];
		for (let i = 0; i < this.edges.length; i ++)
			if ((this.edges[i].v1 === tag) || (this.edges[i].v2 === tag))
				toRemove.push(this.edges[i]); 
	
		while (toRemove.length > 0) {
			var idx = this.edges.indexOf(toRemove[0]);
			this.edges.splice(idx, 1);
			toRemove.splice(0,1);
		}	
	};

	toString = () => "No Representation";

	addEdge = (v1, v2) => {
		if((this.vertices.indexOf(v1) === -1) || (this.vertices.indexOf(v2) === -1))
			throw "one of the vertices in the edge requested to add, is not actually an ";

		this.edges.push({
			v1 : v1,
			v2 : v2
		});
	};

	neighbours = (v) => {
		
		var set = [];
		
		for (let i = 0; i < this.edges.length; i++) {
			var edge = this.edges[i];
			if (edge.v1 == v) {
				// this check should not be necessary, could be remove to speed up
				if (set.indexOf(edge.v2) == -1)
					set.push(edge.v2);
			}
			else if (edge.v2 == v) {
				// this check should not be necessary, could be remove to speed up
				if (set.indexOf(edge.v1) == -1)
					set.push(edge.v1);
			}
		}
		
		return set;
	};

};

// ---------------------------------------------------------------------------------------------------------

export class GraphFactory {

	constructXYFactory = () => {

		var used = [];
		const genXY = function() {
			var unique = false;
			while(!unique) {
				var x = (-K.W_0 / 2.0) + (Math.random() * K.W_0);
				var y = (-K.H_0 / 2.0) + (Math.random() * K.H_0);
				unique = (used.indexOf({
					x : x,
					y : y
				}) == -1);
			}
			used.push({
				x : x,
				y : y
			});
			return {
				x : x,
				y : y
			};
		}
		return genXY;
	};
	/*
	 def calc_xy_for_new_node(graph):

	 x = 0
	 y = 0

	 unique = false
	 while ! unique:
	 x = (- float(W_0) / 2.0) +  (Math.random() * float(W_0))
	 y = (- float(H_0) / 2.0) + (Math.random() * float(H_0))
	 unique = ((x,y) ! in [(n.position.x, n.position.y) for n in graph.nodes()])

	 return (x,y)

	 def add_edges_for_vertex_at_Math.random(graph, node, max_edges_to_create_per_node_per_pass=2):

	 nodes = graph.nodes()

	 for j in range(randint(1, max_edges_to_create_per_node_per_pass)):

	 newEdgeAdded = false
	 while newEdgeAdded == false:

	 edges = graph.edges()

	 z = randint(0, len(nodes) - 1)
	 if nodes[z] != node:
	 if ((nodes[z], node) ! in edges) and ((node, nodes[z]) ! in edges):
	 graph.add_edge(node, nodes[z])
	 newEdgeAdded = true
	 */
	/*

	 def add_node_to_graph_at_Math.random(graph):

	 (x, y) = calc_xy_for_new_node(graph)
	 tag = Tag(x, y, '')
	 tag.label = 'Node %i' % tag.idx
	 graph.add_node(tag)

	 add_edges_for_vertex_at_Math.random(graph, tag, max_edges_to_create_per_node_per_pass=4)

	 return tag

	 def remove_node_from_graph_at_Math.random(graph):

	 nodes = graph.nodes()
	 idx = randint(0, len(nodes) - 1)
	 node_to_remove = nodes[idx]

	 graph.remove_node(node_to_remove)

	 return graph
	 */

	generateGraph = (order, maxEdgesPerVertexPerPass) => {
		/*
		 generate a semi-Math.random graph of size p

		 generate p vertices, with Math.random x,y co-ords
		 for each vertex:
		 Math.randomly add at most max_edges_to_create_per_node_per_pass new edges
		 */

		var graph = new Graph();
		var funcGenXY = this.constructXYFactory();

		for(let i = 0; i < order; i++) {
			var pos = funcGenXY();
			var tag = new Tag(pos, 'no label');
			tag.label = 'Node ' + tag.idx.toString();
			graph.addNode(tag);
		}

		var nodes = graph.vertices;
		for(let i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			var neighbourCount = Math.round(Math.random() * maxEdgesPerVertexPerPass);
			for(let j = 0; j < neighbourCount; j++) {
				var newEdgeAdded = false;
				while(newEdgeAdded == false) {
					var z = Math.floor(Math.random() * (nodes.length - 1));
					if(nodes[z] != node) {
						var edges = graph.edges;
						if((edges.indexOf({
							v1 : nodes[z],
							v2 : node
						}) == -1) && (edges.indexOf({
							v1 : node,
							v2 : nodes[z]
						}) == -1)) {
							graph.addEdge(node, nodes[z]);
							newEdgeAdded = true;
						}
					}
				}
			}
		}

		return graph;
	};
};	

document.addEventListener('DOMContentLoaded', () => draw(), false);	