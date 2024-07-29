/**
 *  sample01.js
 *  プロットサンプル１：線香花火、バーコード
 */
let rv1;
let rv2;
let index = 0;
let loopOn = true;
function setup() {
  const cv = createCanvas(800, 125);
  cv.parent(document.querySelector('#p5'));
  background('white');
  const col1 = color(32, 128, 196, 128);
  const col2 = color(255, 92, 92, 128);
  rv1 = new RvPlotter('Plot Sample', {d:'N',p1:0,p2:1,},
    [{name:'D',x:0,y: 0,w:800,h:20,axis:false,col:0},
     {name:'L',x:0,y:20,w:800,h:40,axis:true,col:col1}]);
  rv1.scalex = {min:-4, max:8};
  rv2 = new RvPlotter('Plot Sample', {d:'X',p1:1,p2:0,},
    [{name:'D',x:0,y:65,w:800,h:20,axis:false,col:0},
     {name:'L',x:0,y:85,w:800,h:40,axis:true,col:col2}]);
  rv2.scalex = {min:-4, max:8};
}
function mouseClicked() {
  if (mouseX > 0 && mouseY < 800 && mouseY > 0 && mouseY < 150) {
    loopOn = !loopOn;
  }
}
function draw() {
  if (loopOn) {
    const x = rv1.generateNewData();
    rv2.appendData(x*x);
    rv1.plotDatas();
    rv2.plotDatas();
    index++;
    if (index >= 5000) {
      loopOn = false;
      noLoop(); 
    }
  }
}
