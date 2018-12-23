import { GraphFactory, ForceDirectedGraph } from "./index";

function State() { 
    
    this.b0Down = false;
    this.b1Down = false; 
    this.b2Down = false; 
    
    this.b0ClickPos = {x:0, y:0};
    this.lastB0DragPos = {x:0, y:0};
    
    this.curPos = {x:0, y:0};
}

function updateSelectionInfo() {
	
	var selectedNode = null;
	
	// is a node selected ?
	//
	for (let i = 0; i < window.fdg.graph.vertices.length; i++) {
		if (window.fdg.graph.vertices[i].isSelected) {
			selectedNode = window.fdg.graph.vertices[i];
			break;
		}
	}
	
	var selectedNodeInfoLabel = document.getElementById('selectedNodeInfoLabel');
	var list = document.getElementById('selectedNodeInfoList');
	
	// no selection => discard old info
	//
	if (selectedNode == null) {
		selectedNodeInfoLabel.innerHTML = 'Select a Node...';
		
		// clear current items
		while (list.children.length > 0) {
			list.removeChild(list.firstChild);
		}
	}
	else {
		selectedNodeInfoLabel.innerHTML = selectedNode.label;
				
		// clear current items
		while (list.children.length > 0) {
			list.removeChild(list.firstChild);
		}
		
		var neighbours = window.fdg.graph.neighbours(selectedNode);
		for (let i = 0; i < neighbours.length; i++) {			
			var neighbour = neighbours[i];
			
			var neighbourString = neighbour.label;
			
			var item = document.createElement('li');
			item.innerHTML = neighbourString;
			
			list.insertBefore(item, list.firstChild);
		}		
	}
};

function getMousePos(cnvs, evt){

    // get canvas position
    //
    var obj = cnvs;
    var top = 0;
    var left = 0;
    while (obj && obj.tagName != 'BODY') {
        top += obj.offsetTop;
        left += obj.offsetLeft;
        obj = obj.offsetParent;
    }
 
    // return relative mouse position
    //
    var mx = evt.clientX - left + window.pageXOffset;
    var my = evt.clientY - top + window.pageYOffset;
    
    return {
        x: mx,
        y: my
    };
};

function onTimerTick(event) {
	const context = (document.getElementById("canvas") as HTMLCanvasElement)
		.getContext('2d');

		window.fdg.iterate(context);
};

function onMouseOut(event) {
	window.state.b0Down = false;
	window.state.b1Down = false;
	window.state.b2Down = false;
};

function onMouseMove(event) {
	/*
	record mouse movement, calc deltas
	call self.force_directed_graph.move(d_x, d_y, d_z), passing deltas
	*/
	if (window.state.b0Down) {

		var canvas = document.getElementById("canvas");
		var mxy = getMousePos(canvas, event);
		var phasePos = window.fdg.wrapReverse(mxy);
		window.state.lastB0DragPos = mxy;
		
		for (let i = 0; i < window.fdg.graph.vertices.length; i++) {
			if (window.fdg.graph.vertices[i].isSelected == true) {
				window.fdg.graph.vertices[i].position = {x:phasePos.x, y:phasePos.y};
			}
		}
	}
};	

function calcCanvasXY(event, canvas) {
	
	var x = (event.x - canvas.offsetLeft);
	var y = (event.y - canvas.offsetTop);
	
	return { x, y };
};

function onMouseDown(event) {
	
	var canvas = document.getElementById("canvas") as HTMLCanvasElement;
	var context = canvas.getContext('2d');	
	
	var mxy = getMousePos(canvas, event);
	
	if (event.button == 0) {
		window.state.b0Down = true;		
		window.state.b0ClickPos = mxy;    
			
    	var selectionChanged = window.fdg.handleNodeSelectionAttempt(mxy);
    	if (selectionChanged == true)
    		updateSelectionInfo();
	}
	else if (event.button == 1)
		window.state.b1Down = true;
	else if (event.button == 2)
		window.state.b2Down = true;	
}

function onMouseUp(event) {
	
	if (event.button == 0) {
		window.state.b0Down = false;
		updateSelectionInfo();
	}
	else if (event.button == 1)
		window.state.b1Down = false;
	else if (event.button == 2)
		window.state.b2Down = false;
}

const delay = (duration) => 
	() => new Promise((resolve, reject) => setTimeout(resolve, duration));

const checkRequirements = async () => {

	await(1000);

	var csv_error_string = ''; 
	
	if (!!window.Worker != true) {
		csv_error_string = csv_error_string + 'web worker not supported' + ',';
	}

	// console.log(document.getElementById('canvas'));

	var checkCanvas = document.getElementById('canvas') as HTMLCanvasElement;
	if (checkCanvas === null) {
		csv_error_string = csv_error_string + 'canvas not supported' + ',';
	}
	else if (checkCanvas.getContext('2d') === null){
		csv_error_string = csv_error_string + 'no [canvas] context' + ',';
	}				
	
	return csv_error_string;
}					

const workerCodeString = `
	
	this.onmessage = function(event) {
			
		var endlessLoop = function(periodMS) {
			postMessage('starting loop', []);
			while (true) {
				var then = new Date();
				var periodIsComplete = false;
				while (periodIsComplete == false) {
					var now = new Date();
					var elapsedMS = now.getTime() - then.getTime();
					if (elapsedMS >= periodMS)
						periodIsComplete = true;
				}
				postMessage(periodMS, []);
			}
		};
		
		endlessLoop(event.data);		
	};

`;

export const draw = async () => {				
	
	var failedRequirements = await checkRequirements();				
	if (failedRequirements != '') {
		console.error(`Minimum Requirements Not Met: ${failedRequirements}`);
	}
	
	var canvas = document.getElementById('canvas') as HTMLCanvasElement;
	if (canvas != null) {
		if (canvas.getContext) {
		
			var context = canvas.getContext('2d');	
			
			window.state = new State();
		
			var gFactory = new GraphFactory();
			var graph = gFactory.generateGraph(50, 2);
			window.fdg = new ForceDirectedGraph(graph);
			
			canvas.addEventListener("mousemove", onMouseMove, false);
			canvas.addEventListener("mousedown", onMouseDown, false);
			canvas.addEventListener("mouseup", onMouseUp, false);
			canvas.addEventListener("mouseout", onMouseOut, false);
			
			const workerCodeBlob = new Blob([workerCodeString], {type: 'application/javascript'});
			window.timerTickWorker = new Worker(URL.createObjectURL(workerCodeBlob));

			window.timerTickWorker.onmessage = onTimerTick;
			window.timerTickWorkerStarted = true;
			window.timerTickWorker.postMessage('50'); // !!	
		}
	}
	else
	{
		console.error('Could not find canvas element')
	}
};

function export_canvas_clicked_handler() {
	var canvas = document.getElementById('canvas') as HTMLCanvasElement;
	var img = canvas.toDataURL('image/png');
 	window.open(img);
};

function reset_clicked_handler() {
	
	if (confirm('Reset.\nAre You Sure ?')) {

		var gFactory = new GraphFactory();
		var graph = gFactory.generateGraph(50, 2);
		window.fdg = new ForceDirectedGraph(graph);

		//var canvas = document.getElementById('canvas');
		//var context = canvas.getContext('2d');
		//context.clearRect(0, 0, canvas.width, canvas.height);
	}
};