/** ==================================================
 *  ヒストグラムクラス
 *  myHistgram.js
 * インスタンス作成： hist = new Histgram(x,y,w,h,axis=false)
 *  x,y,w,h : 描画領域
 * プロパティ  data(d, b) : 
 *          fillColor(c) : 塗りつぶし色の指定
 *          borderColor(c) : 枠線色の指定
 *          borderWeight(c) : 枠線太さの指定
 *          freqmax : 現在のデータの最大階級数＝重ね書き用
 *          axisStr(strArray) : X軸の目盛り表示用
 * メソッド    setData(d, b, freqmax=0) : データと階級設定の設定 
 *              d : データベクトル
 *              b : 階級設定ベクトル
 *              freqmax : 最大階級数＝重ね書き用
 *          drawHist(type='hist',erase=false) : ヒストグラムの描画
 *              type='hist'|'step'|'rect'  柱状、階段状、折れ線の指定
 *                  ただし見にくいので'hist'のみ動作する
 *              erase=true 領域を消去してから描く
 */

const histType = {
  'hist': 0,    // 通常の柱状グラフ
  'step': 1,    // 柱状グラフの上辺のみ＝階段状
  'rect': 2,    // 度数多角形風の折れ線
};
/** =========================================
 *  ヒストグラムクラス
 */
class Histgram {
  // フィールド変数
  #plotarea;
  #color;
  #type;
  #data;
  #breaks;
  #scale;
  #axis;
  #axisStr = [];

  // コンストラクタ：エリア設定、色初期値設定、タイプ初期値'hist'、データ・階級・スケール初期化
  constructor(x, y, w, h, axis=false) {
    this.#plotarea = {
      x: x,
      y: y,
      w: w,
      h: h,
    };
    this.#color = {
      f: color('white'),
      b: color('black'),
      w: 1,
    };
    this.#type = histType['hist'];
    this.#data = {
      raw: [],
      freq: [],
    };
    this.#breaks = [];
    this.#scale = { x: 0, y:0, cx:0, cy:0, };
    this.#axis = axis;
  }
  // セッター、ゲッター
  set fillColor(c) {    // 塗りつぶし色
    this.#color.f = c;
  }
  set borderColor(c) {  // 枠線色
    this.#color.b = c;
  }
  set borderWeight(c) { // 枠線太さ
    this.#color.w = c;
  }
  set axisStr(a) {      // 表示用X軸目盛り
    this.#axisStr = a;
  }
  get freqmax() {
    return max(this.#data.freq);
  }
  // ======================================= 内部関数
  #cx(x)            // X軸の座標変換
  {
    return this.#scale.cx + x * this.#scale.x;
  }
  #cy(y)            // Y軸の座標変換
  {
    return this.#scale.cy - y * this.#scale.y;
  }
  #eraseArea()      // 領域を白く消す
  {
    push();
    fill(255);
    noStroke();
    rect(this.#plotarea.x, this.#plotarea.y, this.#plotarea.w, this.#plotarea.h);
    pop();
  }
  #drawAxis()       // X軸を描画する
  {
    push();
    stroke(0);
    strokeWeight(1);
    line(this.#plotarea.x, this.#scale.cy,
         this.#plotarea.x+this.#plotarea.w, this.#scale.cy);
    noStroke();
    fill(0);
    textSize(10);
    textAlign(CENTER, TOP);
    const steps = 1 / (this.#breaks[1]-this.#breaks[0]);
    if (this.#axisStr.length == 0) {
      for (let x = this.#breaks[0]; x<=this.#breaks.at(-1); x++) {
        this.#axisStr.push(x.toString());
      }
    }
    let ax = this.#cx(this.#breaks[0]);
    const ay = this.#scale.cy+1;
    for (let i=0; i<this.#axisStr.length; i++) {
      text(this.#axisStr[i], ax, ay);
      ax += this.#scale.x * steps;
    }
    pop();
  }
  // ======================================= 広域関数
  // データと階級設定を設定する
  setData(d, b, fm=0) {
    // ローデータと階級設定を受け取る
    this.#data.raw = d;
    this.#breaks = b;
    // 度数分布表を用意する
    this.#data.freq = new Array(this.#breaks.length-1).fill(0);
    // 階級幅＝すべて同じ幅であることが前提
    const cwidth = this.#breaks[1] - this.#breaks[0];
    // 階級度数のカウント： breaks に入らない部分は切り捨てている
    this.#data.raw.forEach((value) => {
      let index = Math.floor((value - this.#breaks[0]) / cwidth);
      if (index >= 0 & index < this.#data.freq.length) 
        this.#data.freq[index]++;
    });
    // スケールの設定
    this.#scale.x = this.#plotarea.w / this.#data.freq.length;
    // 最大度数の指定＝重ね書きをするときに尺度がそろうようにする
    this.#scale.y = (this.#plotarea.h-(this.#axis?10:0)) / (fm>0 ? fm : max(this.#data.freq));
    this.#scale.cx = this.#plotarea.x - this.#breaks[0] * this.#scale.x;
    this.#scale.cy = this.#plotarea.y + this.#plotarea.h - (this.#axis? 10:0);
  }
  // ヒストグラムを描画する：ユーザはこの関数だけを呼ぶ。描く前に消去するときは erase=true
  drawHist(type='hist', erase=false) {
    // エリア消去
    if (erase) this.#eraseArea();
    // 横軸を描く
    if (this.#axis & erase) this.#drawAxis();
    // グラフの描画
    this.#type = type;
    push();
    stroke(this.#color.b);
    strokeWeight(this.#color.w);
    fill(this.#color.f);
    for (let i=0; i<this.#data.freq.length; i++) {
      if (this.#data.freq[i] > 0) {
        rect(this.#plotarea.x + this.#scale.x * i, this.#scale.cy, this.#scale.x, -this.#data.freq[i] * this.#scale.y);
      }
    }
    pop();
  }
}
