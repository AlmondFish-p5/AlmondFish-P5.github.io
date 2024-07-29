/**
 *  確率変数ぷるぷる2
 ================================================== */

window.addEventListener('resize', reSize);


let canvas;
let canvas_width;
let canvas_height;

let index = 0;
let maxIndex = 0;
const bgColor = '#e6f3ff';
let dist;
let pos = 0;
let mode = 0;
/**
 * 初期化関数
 ========================================= */
// -------------------------------------- 初期化関数本体
function setup() {
  frameRate(64);
  canvas_width = document.querySelector('#p5').clientWidth;
  canvas_height = document.querySelector('#p5').clientHeight;
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.querySelector('#p5'));
  stroke(255, 64, 64, 128);
  strokeWeight(0.5);
  setDist(0);
}
// -------------------------------------- キャンバスの大きさを変える
function reSize() {
  // div #p5 の幅を取得する
  canvas_width = document.querySelector('#p5').clientWidth;
  canvas_height = document.querySelector('#p5').clientHeight;
  resizeCanvas(canvas_width, canvas_height);
}
// -------------------------------------- 設定をリセットする
function reSetData() {
  index = 0;
  pos = 1 - pos;
  mode = random([0, 1]);
  setDist();
  clearCanvas();
  stroke(random(64, 255), random(64, 255), random(64, 255), 128);
  strokeWeight(0.5);
  noFill();
}
// -------------------------------------- 分布など表示の設定をする
function setDist(d=-1) {
  dist = (d<0 ? random([0,1,2,0,1,0,2]) : d); // 分布：N, X^2, U
  interval = {min:(dist==0 ? -4 : -1), max:(dist==1 ? 9 : 4),}; // スケール
  maxIndex = 500 + random(-100, 150); // 繰り返し回数
}
// -------------------------------------- キャンバスの上（下）半分をクリアする
const clearCanvas = () => {
  push();
  fill(bgColor);
  noStroke();
  rect(0, Y(), canvas_width, canvas_height/2);
  pop();
}
const Y = () => { return (pos==0 ? 0 : canvas_height/2) }
// -------------------------------------- 乱数を作る
const randomNumber = (dist) => {
  switch (dist) {
    case 0: return randomGaussian(0, 1);
    case 1: return sq(randomGaussian(0, 1));
    case 2: return random(0, 3);
  }
}
/**
 * 描画関数
 ========================================= */
// -------------------------------------- 描画関数本体
function draw() {
  const d = randomNumber(dist);
  const x = map(d, interval.min, interval.max, 0, canvas_width);
  if (mode==0) line(x, Y(), x, Y() + canvas_height/2);
  else         circle(x, Y()+canvas_height/4+random(-7, 7), 10);
  if (++index > maxIndex) reSetData();
}
