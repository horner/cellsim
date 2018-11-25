// https://www.youtube.com/watch?v=M2ApXHhYbaw
// http://www.wormbook.org
// https://en.wikipedia.org/wiki/OpenWorm

// https://phys.org/news/2017-03-scientists-function-autophagy-germline-stem-cell.html
// https://www.sciencedirect.com/science/article/pii/S0012160618303452
// https://www.cherrybiotech.com/scientific-note/c-elegans-asymmetric-cell-division
	// Asymmetric Cell Division https://youtu.be/EaZOdrU1Du0&t=187
  // Stochastic, Niche, Asymmetric  (Weismann,1880)
  // CDK5Rap2
// C. elegans divison =  https://www.youtube.com/watch?v=M2ApXHhYbaw
// Controlling how many cells make a fly https://www.ncbi.nlm.nih.gov/pmc/articles/PMC333400/
// Uncoupling of Longevity and Telomere Length in C. elegans - https://journals.plos.org/plosgenetics/article?id=10.1371/journal.pgen.0010030
// The Systems Biology of Single-Cell Aging https://www.sciencedirect.com/science/article/pii/S2589004218301354

var canvas = document.querySelector("canvas"),
    context = canvas.getContext("2d"),
    width = canvas.width,
    height = canvas.height,
    epoch = 0,
    tau = 2 * Math.PI;
var cells;

var lifespan, colorScale1;
function updatecolorpref() {
	lifespan = parseInt($('#lifespan').val(),10);
	colorScale1 = d3.scaleSequential(d3.interpolateGreys).domain([lifespan,0]);
}  
updatecolorpref();

var simulation = d3.forceSimulation(cells)
  .velocityDecay(0.8)
  .force("x", d3.forceX().strength(0.002))
  .force("y", d3.forceY().strength(0.002))
  .force("collide", d3.forceCollide().radius(function(d) { return d.r + 0.5; }).iterations(2))
  .on("tick", ticked);

function restart() {
	simulation.nodes(cells);
  simulation.restart();
}

reset();

var tick=0;
function ticked() {
	tick++;
//  epoch++;
  $("#count").text(cells.length + " tick:" + tick);	
  context.clearRect(0, 0, width, height);
  context.save();
  context.translate(width / 2, height / 2);
 
  cells.forEach(function(d) {
	  context.beginPath();
  //  context.moveTo(d.x + d.r, d.y);
    context.arc(d.x, d.y, d.r, 0, tau);
//    context.fillStyle = "#ddd";
//		debugger;
//    context.fiilStyle = 
//    console.log("age:",epoch - d.birth, context.fiilStyle );
    context.fillStyle = colorScale1(d.telomeres);
    context.fill();
    context.strokeStyle = "#333";
    context.stroke();
  });

  context.restore();
}

var t=0;
var rate;

var inside=1;
var paused=false;

function reset(nogo) {
	updatecolorpref();
	var init = parseInt($('#init').val(),10);

  cells = d3.range(init).map(function(i) {
    return clone();
  });
  restart();
  if (t) {
  	go();
  }
}

function clone(cell) {
  daughter = { r: Math.random() * 9 + 4, birth: epoch, splits:0, telomeres: lifespan };
	if (cell) { 
  	cell.splits++;
    cell.telomeres--;
  	daughter.x = cell.x; daughter.y=cell.y;
    daughter.telomeres = cell.telomeres;
  }
  return daughter;
}

function go() {
	paused=false;
	var newrate=parseInt($('#divrate').val(),10);
  
  updatecolorpref();

	if (newrate!=rate) if (t) { t.stop(); t=0; }
  rate = newrate;
  if (!t) {
	  $('#console').append("Running sim:",rate," ", "lifespan:", lifespan);
    t = d3.interval(function(elapsed) {
      epoch++;
      var nodecount = cells.length;
      $("#count").text(nodecount);
      
      if ((elapsed>300000 || (nodecount>5000))) { $('#console').append('limit hit time:',elapsed/60000,"nodes:",nodecount); stop(); return; }
      
      if (!paused) {
        switch($('#growthstrategy').val()) {
          case "inside":
//            for (i=0; i< nodecount; i++) cells[i].telomeres--;  // Age everyone
            cells.push( clone( {x:0,y:0,telomeres:lifespan} ) );
            break;
          case "random":
            i = Math.floor(Math.random() * nodecount);
          	for (i; i< nodecount; i++) {
              if (cells[i].telomeres>0) {
              	if (Math.floor(Math.random() * nodecount))
	                cells.push( clone(cells[i]) );
                  break;
              }         	
            }
            break;
          case "outside":
            // this  puts new cells on the outside edge, gets faster since there are more cells
            for (i=0; i< (cells.length/200); i++)
              cells.push( clone() );
            break;
          case "exponential":
            for (i=0; i< nodecount; i++) {
	            if (cells[i].telomeres>0)
  	            cells.push( clone(cells[i]) );
              cells[i].splits++;
            }
            break;
          case "stem-linear":
          	var telomeres = 10;
            for (i=nodecount-1; i>=0; i--) {
              if (cells[i].telomeres>0) {
                cells.push( clone(cells[i]) );
                break;
              }
            }
            break;
          case "stem":
          	var birth=0;
            for (i=nodecount-1; i>=0; i--) {
              if (cells[i].telomeres>0) {
              	if (birth==0) { birth = cells[i].birth } // ok, get the epoch of this diving cell.
              	if (cells[i].birth==birth)  // get only it's cousins with the same age.
	                cells.push( clone(cells[i]) );
              }
            }
            break;
        }
			  simulation.alpha(1); // if there were cells added, add heat.
      }
      restart();
    }, rate, d3.now());
  }
}

var cleartimer;
function stop() {
	clearTimeout(cleartimer);
  $('#console').append('Stopped. '); cleartimer = setTimeout(function(){$('#console').text('');},3000)
	if (t) { t.stop(); t=0; }
	restart();
}

function pause() {
	if (t) { paused=true; }
	restart();
}
