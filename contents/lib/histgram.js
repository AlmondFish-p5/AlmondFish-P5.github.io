/** ==================================================
 *  ヒストグラム作成・表示関数群
 *  histgram.js  version 0.0
 *  できるようにしたいこと：Rのhist()関数に準じたものを作りたい
 *  ヒストグラムの描画領域を渡して初期設定する。背景色や線の色はここで指定する。
 *  データベクトルと、横軸設定を渡すと、あとは自動的にヒストグラムを作る。
 */

//const FRAME_RATE = 10;

//let xs = [];
//let index = 0;
//let data = []; // 蓄積していくデータ
//let dispdata = []; // 表示するデータ
//let data_mean = []; // 統計量を蓄えるデータ


/** =========================================
 *  ヒストグラムオブジェクト
 */
function objHist(left_x, top_y, area_width, area_height) {
  this.margin = {
    outer: 10,      // 上下左右の余白
    axis: 40,       // 軸のメモリを描くための余白
    title: 40       // 表題のための余白
  };
  this.outer = {
    x: left_x,
    y: top_y,
    w: area_width,
    h: area_height
  };
  this.inner = {
    x: left_x + this.margin.outer,
    y: top_y + this.margin.outer,
    w: area_width - this.margin.outer * 2,
    h: area_height - this.margin.outer * 2
  };
  this.plotarea = {
    x: left_x + this.margin.outer + this.margin.axis,
    y: top_y + this.margin.outer + this.margin.title,
    w: area_width - this.margin.outer * 2 - this.margin.axis,
    h: area_height - this.margin.outer * 2 - this.margin.axis - this.margin.title
  }; 
  this.color = {
    back:'white', line:'black', fill:'white', chr:'black', axis: 'black',
    bin: 'lightgrey', border: 'black'
  };

  // これを使って、translate(this.origin.y, this.origin.x)とすると、座標原点で描ける
  this.origin = {
    axx: this.inner.y + this.inner.h - this.margin.axis,  // x軸縦座標
    axy: this.inner.x + this.margin.axis                  // y軸横座標
  };
  this.data = {
    raw : [],       // 呼び出し元から受け取るデータ
    freq : [],      // データをbreaksに合わせて数えあげたデータ
    prob : [],      // 相対度数にしたデータ
    error : 0,
    freqmax : 0,
    freqsum : 0
  };
  this.breaks = []; // ヒストグラム階級設定
  this.marks = [];  // x軸に表示する目盛り
  this.labelalign = 'LEFT';  // x軸目盛の表示位置 'LEFT'目盛り線上、'CENTER'目盛り間
  this.scale = { x: 0, y:0 };   // 目盛りの間隔
  this.titles = {
    main : '',
    xlab : ''
  };
};


/** =========================================
 *  ヒストグラムオブジェクト 呼び出し関数
 */
// ヒストグラムを描画する：ユーザはこの関数だけを呼ぶ
objHist.prototype.drawHistgram = function(dat, brSet, mkSet=brSet, pos_x='LEFT') {
  // dat, breaks は配列でなければならない
  if (dat.length < 1) return NaN;
  if (brSet.length < 2) return (NaN);
  // オブジェクトに引数を保存する
  this.breaks = brSet;
  this.marks = mkSet;
  this.data.raw = dat;
  this.data.freq = new Array(this.breaks.length-1).fill(0);
  this.data.prob = new Array(this.breaks.length-1).fill(0);
  this.data.error = 0;
  this.labelalign = pos_x;
  // エリア設定をする
  this.setArea();
  // データの数え上げ
  this.calcFerq(dat);
  // 軸設定の準備
  this.scale.x = this.plotarea.w / (this.breaks.length + 1);
  this.scale.y = this.plotarea.h / (this.data.freqmax);
  this.setAxis(brSet, mkSet, pos_x);
  // グラフの描画
  this.drawGraph();
  // タイトルの描画
  this.addTitles();
}
// ------------------------------------------
// ----- 描画エリアを設定する
objHist.prototype.setArea = function() {
  strokeWeight(0.5);
  if (this.color.line==-1) noStroke(); else stroke(this.color.line);
  if (this.color.back==-1) noFill();   else fill(this.color.back);
  rect(this.outer.x, this.outer.y, this.outer.w, this.outer.h);
  // 描画する領域=this.innter ：margin.outer のぶんだけ小さい
  //drawRect(this.inner);
  // 実際にヒストグラムを描くことが可能な領域
  //drawRect(this.plotarea);
}
// ------------------------------------------
// ----- 軸を設定する
objHist.prototype.setAxis = function(brSet, mkSet, pos_x) {
  // ----- プロットエリア原点を描画原点とする：ここから ----- 
  push();
  translate(this.plotarea.x, this.plotarea.y+this.plotarea.h);
  // x,y軸
  stroke(this.color.axis);
  strokeWeight(1);
  line(0, 0, this.plotarea.w, 0);
  line(0, -this.plotarea.h, 0, 0);
  // 縦軸の目盛りのための計算：これでは不十分だが・・・
  let ar = new Array(Math.ceil(this.data.freqmax/5)).fill(0);
      //console.log(ar);
  ar = ar.map((value, index)=>{ return (index * 5); });
      //console.log(ar);
  // 目盛り
  for (let i=1; i<=this.breaks.length; i++) {
    line(i*this.scale.x, 0, i*this.scale.x, 5);
  }
  for (let i=0; i<ar.length; i++) {
    line(0, -ar[i]*this.scale.y, -5, -ar[i]*this.scale.y);
  }
  // 値：marksを使用する
  noStroke();
  fill(this.color.chr);
  textSize(10);
  textAlign(CENTER, TOP);
  const d = (pos_x=='CENTER' ? this.scale.x / 2 : 0);
  for (let i=1; i<=this.marks.length; i++) {
    text(this.breaks[i-1], i*this.scale.x + d, 6);
  }
  textAlign(RIGHT, CENTER);
  for (let i=0; i<ar.length; i++) {
    text(ar[i], -6, -ar[i]*this.scale.y);
  }
  pop();
  // ----- プロットエリア原点を描画原点とする：ここまで ----- 
}
// ------------------------------------------
// ----- データを数え上げる
objHist.prototype.calcFerq = function(dat) {
  // 下記の設定により、
  // breaks 最小値より小さい値は無視される。
  // breaks 最大値より大きい値も無視される。
  // breaks が均等幅で設定されていないと度数が正しく数えられない。
  const cmin = min(this.breaks);           // breaks の最小値
  const cmax = max(this.breaks);           // breaks の最大値
  const cwidth = this.breaks[1]-this.breaks[0]; // breaks の間隔
          //console.log(cmin, cmax, cwidth);
  // 度数を計算する。この計算で、文字列やNaNなどもエラーとしてカウントされているようだ。
  this.data.raw.forEach((value, index) => {
    if (value >= cmin && value <= cmax) {
      let cls = Math.floor(value - cmin) / cwidth;
      if (cls >= this.data.freq.length) cls--;
      this.data.freq[cls]++;
          //console.log(value, index, cls);
    } else {
      this.data.error++;
    }
  });
  // 最大度数と合計度数を計算する
  this.data.freqmax = max(this.data.freq);
  this.data.freqsum = this.data.raw.length - this.data.error;
      //console.log(this.data.freqmax, this.data.freqsum);
  // 相対度数を計算する
  this.data.prob = this.data.freq.map((value, index) => {
    return value / this.data.freqsum;
  });
      //console.log(this.data.prob);
      //console.log(dat);
      //console.log(this.data.freq);
      //console.log(this.data.error);
}
// ------------------------------------------
// ----- ヒストグラムを描画する
objHist.prototype.drawGraph = function() {
  // ----- プロットエリア原点+1を描画原点とする：ここから ----- 
  push();
  fill(this.color.bin);
  stroke(this.color.border);
  strokeWeight(1);
  translate(this.plotarea.x+this.scale.x, this.plotarea.y+this.plotarea.h);
  for (let i=0; i<this.data.freq.length; i++) {
    rect(i*this.scale.x, 0, this.scale.x, -this.scale.y*this.data.freq[i]);
  }
  pop();
  // ----- プロットエリア原点を描画原点とする：ここまで ----- 
}
// ------------------------------------------
// タイトルを追加する
objHist.prototype.addTitles = function() {
  push();
  if (this.titles.main.length==0) this.titles.main = 'Histgram';
  if (this.titles.xlab.length==0) this.titles.xlab = 'Data';
  textAlign(CENTER, CENTER);
  fill('black');
  noStroke();
  // 表題
  textSize(20);
  textStyle(BOLD);
  text(this.titles.main, this.plotarea.x+this.plotarea.w/2, this.inner.y + this.margin.title/2);
  // x軸
  textSize(14);
  textStyle(NORMAL);
  text(this.titles.xlab, this.plotarea.x+this.plotarea.w/2, this.inner.y + this.inner.h - this.margin.axis / 3);
  pop();
}


/** =========================================
 *  ヒストグラムの初期化関数：ヒストグラムオブジェクトを返す
 */
function initHistgram(left_x, top_y, area_width, area_height) {
  // 描画モードを確かめておく
  rectMode(CORNER);
  // 領域を設定し広域変数に記録する
  let myHistgram = new objHist(left_x, top_y, area_width, area_height);
  return myHistgram;
}


/** =========================================
 *  ヒストグラムの周辺設定関数群
 */
// タイトルの設定：drawHistgram よりも前に呼び出すことが必要
objHist.prototype.setTitles = function(main='', xlab='') {
  this.titles.main = main;
  this.titles.xlab = xlab;
}
// 色の設定：ヒストグラムのアウターの塗りつぶしと線。-1で設定なし（noFill, noStroke）
objHist.prototype.setColors = function(backCol, lineCol) {
  this.color.back = backCol;
  this.color.line = lineCol;
}


/** =========================================
 *  呼び出し側に書く関数
 */
/** 
  // ヒストグラムオブジェクトを準備
  let h = initHistgram(20, 20, width-40, height-40);
  // データを準備
  const dat = [1,2,3,4,5,4,3,2,4,5,5,4,4,3,3,3,2,3,4,2,3,4,1,2,3,4,5,3];
  // タイトルなどを設定
  h.setTitles('Test of Histgram','Data');
  // ヒストグラム描画
  h.drawHistgram(dat, breaks=[1,2,3,4,5,6], marks=[1,2,3,4,5], pos_x='CENTER');
*/
