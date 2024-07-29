/** =====================================================
 *  偏差に関するアニメーション dev02.js
 *  小学6年生風ドットプロットを実現する
 */

/** =====================================================
 *  広域変数群
 */
// ------------------------------------------- キャンバス
let canvas;
const ratio = 0.7;
const canvas_width = 800;
const upper_height = 120;
const dotPlotBase = upper_height;
const devPlotBase = upper_height + 10;
const lower_height = canvas_width * ratio + 20;
const canvas_height = upper_height + lower_height;

let cv;

const areaColor = {
  canvas:{back: 255, line: -1},
  upper: {back: 255, line: -1},
  lower: {back: 255, line: 0},
};

const canvas_background = areaColor.canvas.back;
const userFramerate = 4;

let cvScale = {x:0, y:0};
let cvOrigin = {x:0, y:0};

// ------------------------------------------- データ
let Data = [];
let rawData = [];
let tmpMean;
let dataSize = 8;
let Parameter = {mu:10, sigma:4, min:0, max:20};

// ------------------------------------------- ヒント表示
let hintDev = true;
let hintDevSum = true;
let hintDev2Sum = true;
let cvTimer;
let showAnswer = false;
let scanMode = false;

/** =====================================================
 *  HTML設定の読み込み
 */
// ------------------------------------------- 答え合わせクリック
document.getElementById("btn_judge").onclick = function(){
  document.getElementById("btn_judge").disabled = true;
//  document.getElementById('hint_dev').disabled = true;
//  document.getElementById('hint_devsum').disabled = true;
//  document.getElementById('hint_dev2sum').disabled = true;
//  clearTimeout(cvTimer);
  dispAnswer();
  noLoop();
}
// ------------------------------------------- 観察モード
document.getElementById("btn_scan").onclick = function(){
  if (scanMode) endScanMode();
  else          setScanMode();
}
// ------------------------------------------- HTML設定読込
function readHtmlSettings() {
  //trialMax = document.getElementById('trial_number').value * 1;
//  hintDev = document.getElementById('hint_dev').checked ? true: false;
//  hintDevSum = document.getElementById('hint_devsum').checked ? true: false;
//  hintDev2Sum = document.getElementById('hint_dev2sum').checked ? true: false;
}
/**
document.getElementById('hint_dev').onchange = function() {
  hintDev = document.getElementById('hint_dev').checked ? true: false;
  plotData();
  if (hintDev) setTimer();
}
document.getElementById('hint_devsum').onchange = function() {
  hintDevSum = document.getElementById('hint_devsum').checked ? true: false;
  plotData();
  if (hintDevSum) setTimer();
}
document.getElementById('hint_dev2sum').onchange = function() {
  hintDev2Sum = document.getElementById('hint_dev2sum').checked ? true: false;
  plotData();
  if (hintDev2Sum) setTimer();
}
function setTimer() {
  clearTimeout(cvTimer);
  cvTimer = setTimeout(function(){
    document.getElementById('hint_dev').checked = false;
    document.getElementById('hint_devsum').checked = false;
    document.getElementById('hint_dev2sum').checked = false;
    hintDev = false;
    hintDevSum = false;
    hintDev2Sum = false;
    plotData();
  }, 5000);
}
*/

/** =====================================================
 *  データ処理関数群
 */
function setData() {
  rawData = generateRandomData();
  const rawMean = calc_mean(rawData);
  for (let i=0; i<rawData.length; i++) {
    Data[i] = new objData('raw', rawData[i], min(rawData), i+1);
  }
  tmpMean = new objTmpMean(min(rawData), rawMean);
}
// -------------- ソート関数：これがないと文字コード順に並べてくる
function compareNums(a, b) {
  return a-b;
}
// -------------- 重複データがない乱数＋整数データをつくる（パラメータは広域設定）
function generateRandomData() {
  let x = new Array(dataSize * 20).fill(0).map(()=>{
    return Math.ceil(random(Parameter.min, Parameter.max));
  });
  let d = new Array(dataSize).fill(0);
  for (let i=0; i<dataSize; i++) {
    d[i] = x[0];
    x = x.filter((val, idx) => {return val != d[i]});
  }
  //console.log(x); //console.log(d);
  //return d.sort(compareNums);
  return d;
}


/** =====================================================
 *  オブジェクト
 */
// ----------------------------------------- オブジェクト 初期化 objData
function objData(name, val, cntr) {
  this.name = name;
  this.value = val;
  this.deviation = val - cntr;
  this.center = cntr;
  //this.rank = rank;
  this.cset = {
    linecolor:[color(255, 96, 96), color(96, 96, 255)],
    fillcolor:[color(255, 96 ,96 ,224), color(96, 96, 255, 224)],
    dev2linecolor: color(255, 192, 32),
    dev2fillcolor: color(255, 192, 96, 16),
  };
  //console.log(this);
}
// --------------------- 仮平均値を更新して偏差を計算し直す changeCenter
objData.prototype.changeCenter = function(cntr) {
  this.center = cntr;
  this.deviation = round(this.value - this.center, 1);
}
// ----------------------------------------- 平均値オブジェクト objTmpMean
function objTmpMean(val, mean) {
  this.name = 'TmpMean';
  this.value = val;
  this.parameter = mean;
  this.cset = {
    linecolor: color(32, 192, 32),
    linewidth: 1,
    answercolor: color(255, 64, 64),
  };
  this.active = false;
  this.ctrl = {
    pos : { x:canvas_width/2, y:15 },
    size: { w: 0, h: 20, r: 10, },
    col: {
      fill: color(32, 240, 144),
      btn : color(32, 192,  96),
      onMouse: color(255, 64, 64),
      txt : 255,
    }
  };
  this.dispCtrl = function() {
    push();
    noStroke();
    translate(this.ctrl.pos.x, this.ctrl.pos.y);
    rectMode(CENTER);
    fill(this.ctrl.col.fill);
    rect(0, 0, this.ctrl.size.w, this.ctrl.size.h, this.ctrl.size.r);
    fill(this.ctrl.col.btn);
    rect(-this.ctrl.size.w/2, 0, 40, this.ctrl.size.h, this.ctrl.size.r);
    rect( this.ctrl.size.w/2, 0, 40, this.ctrl.size.h, this.ctrl.size.r);
    fill(this.ctrl.col.txt);
    textAlign(CENTER, CENTER);
    text('＜', -this.ctrl.size.w/2, 0);
    text('＞',  this.ctrl.size.w/2, 0);
    pop();
  }
  this.ctrlClick = function(mx, my) {
    const flg_x = Math.abs(mx - this.ctrl.pos.x) <= this.ctrl.size.w/2+20;
    const flg_y = Math.abs(my - this.ctrl.pos.y) <= this.ctrl.size.h/2;
    //console.log(flg_x, flg_y);
    if (flg_x && flg_y) {
      if (Math.abs(mx - this.ctrl.pos.x) > (this.ctrl.size.w/2-20)) {
        if (mx < this.ctrl.pos.x) { this.value -= 0.1;　}// ＜ 0.1 小さく
          else { this.value += 0.1; } // ＞ 0.1 大きく
      } else { // 真ん中の部分なのでその場に移動
        this.value = rcx(mx);
      }
      changeCenterValue();
    }
  }
  this.mouseOnCtrl = function() {
    const flg_x = mouseX > this.ctrl.size.x && mouseX < this.ctrl.size.x+this.ctrl.size.w;
    const flg_y = mouseY > this.ctrl.size.y && mouseY < this.ctrl.size.y+this.ctrl.size.h;
    return (flg_x && flg_y);
  }
  this.drawLine = function() {
    stroke(this.cset.linecolor);
    strokeWeight(this.cset.linewidth);
    line(cx(this.value), 0, cx(this.value), upper_height);
  }
  this.drawAnswer = function() {
    push();
    stroke(this.cset.answercolor);
    strokeWeight(this.cset.linewidth*2);
    line(cx(this.parameter), 0, cx(this.parameter), upper_height);
    pop();
  }
}


/** =====================================================
 *  データ表示関数群
 */
// ------------------- データの値を画面表示位置に変換する cv（X座標）, cy（Y座標）
function cx(x) { return (cvOrigin.x + x*cvScale.x); }
function cz(x) { return x * cvScale.x; }
function cy(y) { return (cvOrigin.y - y*cvScale.y); }
function rcx(x) { return round((x - cvOrigin.x) / cvScale.x, 1); }
// ------------------------------------------- ドットプロットを描く drawDotPlot
function drawDotPlot() {
  strokeWeight(0.5);
  stroke('black');
  fill('black');
  Data.forEach((element, index)=>{
    circle(cx(element.value), dotPlotBase-4, 9);
  });
  line(0, dotPlotBase, canvas_width, dotPlotBase);
}
// ------------------------------------------- データをプロットする plotData
function plotData() {
  eraseArea(0);
  push();
  drawDotPlot();
  strokeCap(SQUARE);
  let dev2Sum = 0;
  let devMax = 0;
  if (hintDev) {
    Data.forEach((element, index)=>{
      const k = (element.deviation >= 0) ? 1: 0;
      stroke(element.cset.linecolor[k]);
      fill(element.cset.linecolor[k]);
      //circle(cx(element.value), cy(index), 5);//データ点は表示しない
      strokeWeight(5);
      line(cx(element.value), cy(index), cx(tmpMean.value), cy(index));
      strokeWeight(0.4);
      line(cx(element.value), cy(index), cx(element.value), dotPlotBase);
      strokeWeight(1);
      stroke(element.cset.dev2linecolor);
      fill(element.cset.dev2fillcolor);
//      const dv = element.value - tmpMean.value;
//      rect(cx(element.value), devPlotBase, -(cz(dv)), Math.abs(cz(dv)));
      rect(cx(element.value), devPlotBase, -(cz(element.deviation)), Math.abs((cz(element.deviation))));
      dev2Sum += element.deviation ** 2;
      if (devMax < Math.abs(element.deviation)) devMax = Math.abs(element.deviation);
//      console.log(index, element.value, element.deviation);
    });
  }

  tmpMean.drawLine();
  tmpMean.dispCtrl();
  if (hintDevSum) dispDevSum();
  if (hintDev2Sum) {
    strokeWeight(1);
    stroke(color(64, 242, 32));
    fill(color(192, 255, 96, 64));
    rectMode(CENTER);
    rect(cx(tmpMean.value), devPlotBase+cz(devMax/2), cz(Math.sqrt(dev2Sum/dataSize)), cz(Math.sqrt(dev2Sum/dataSize)));
    //console.log(Math.sqrt(dev2Sum/dataSize));
  }
  pop();
}
// ------------------------------------------- 偏差合計を表示する dispDevSum
function dispDevSum() {
  let devSum = [0, 0];
  const cvpos = {x:[10, width-90], y:[20, 40, 70]};
  let devSumMax = 0;
  for (d in Data) {
    let k = (Data[d].deviation >= 0) ? 1: 0;
    devSum[k] += Data[d].deviation;
    devSumMax += Math.abs(Data[d].value - tmpMean.parameter);
  }
  push();
  textSize(15);
  textAlign(LEFT, BASELINE);
  for (k=0; k<2; k++) {
    noStroke();
    fill('black');
    text( (k ? '正':'負')+'の偏差和', cvpos.x[k], cvpos.y[0]);
    if (showAnswer) {
      text(devSum[k].toFixed(2), cvpos.x[k], cvpos.y[2]);
    }
    fill(Data[0].cset.linecolor[k]);
    rect(cvpos.x[k], 30, min((Math.abs(devSum[k])/devSumMax)*80, 80), 20);
  }
  pop();
  //console.log(devSum);
}
// ------------------------------------------- 仮平均値の移動 changeCenterValue
function changeCenterValue() {
  for (d in Data) {
    Data[d].changeCenter(tmpMean.value)
  }
  plotData();
}
// ------------------------------------------- 答えの表示 dispAnswer
function dispAnswer() {
  // 偏差和の値を表示する
  hintDev = true;
  hintDevSum = true;
  hintDev2Sum = true;
  showAnswer = true;
  plotData();
  tmpMean.drawAnswer();
}


/** =====================================================
 *  初期設定関数群
 */
// ------------------------------------------- 初期化関数 setup
function setup() {
  frameRate(10);
  randomSeed(minute() + second());
  readHtmlSettings();
  
  setData();
  initCanvas();
  setScales();
  plotData();
  noLoop();
}
// ------------------------------------------- キャンバスの再設定 initCanvas
function initCanvas() {
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.getElementById('p5'));
  eraseArea(0);
//  background(canvas_background);
  canvas.mouseClicked(()=>{
    if (!showAnswer) tmpMean.ctrlClick(mouseX, mouseY);
  });
}
// ------------------------------------------- 表示サイズの計算 setScales
function setScales() {
  cvScale.x = (canvas_width * ratio) / (max(rawData)-min(rawData));
  cvScale.y = (upper_height * 0.6) / (dataSize+1);
  cvOrigin.x = (canvas_width * (1-ratio) /2 ) - cvScale.x * min(rawData);
  cvOrigin.y = upper_height * 0.8;
  tmpMean.ctrl.size.x = cx(min(rawData));
  tmpMean.ctrl.size.w = cx(max(rawData)) - cx(min(rawData));
  eraseArea(1);
}
// ------------------------------------- キャンバスの指定位置を消去 eraseArea
function eraseArea(k) {
  push();
  if (k==0) {        // canvas
    fill(areaColor.canvas.back);
    stroke(areaColor.canvas.line);
    if (areaColor.canvas.line < 0) noStroke();
    rect(0, 0, canvas_width, canvas_height);
  } else if (k==1) { // upper
    fill(areaColor.upper.back);
    stroke(areaColor.upper.line);
    if (areaColor.upper.line < 0) noStroke();
    rect(0, 0, canvas_width, upper_height);
  } else if (k==2) { // lower
    
  }
  pop();
}

/** =====================================================
 *  描画関数群
 */
let scanInterval = 0.1;
// ------------------------------------------- 描画関数 draw
function draw() {
  if (scanMode) {
    tmpMean.value += scanInterval;
    changeCenterValue();
    //plotData();
    if (tmpMean.value > max(rawData)) scanInterval = -0.1
    if (tmpMean.value <= min(rawData)) endScanMode();
  } else {
    noLoop();
  }
}
// ------------------------------------- 観察モード設定 set/end-ScanMode
function setScanMode() {
  //tmpMean.value = min(rawData);
  scanInterval = 0.1;
  scanMode = true;
  document.getElementById('btn_scan').value = '停止';
  document.getElementById('btn_judge').disabled = true;
  hintDev = true;
  hintDevSum = true;
  hintDev2Sum = true;
  loop();
}
function endScanMode() {
  document.getElementById('btn_scan').value = '観察モード';
  document.getElementById('btn_judge').disabled = false;
  readHtmlSettings();
  scanMode = false;
  noLoop();
}