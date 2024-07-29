/** =====================================================
 *  コインクラス
 初期化関数 new rvCoin(x, y, s, p, i) // xy座標, サイズ（半径）, 成功確率, 識別番号
 広域関数   roll(); //コインをふる 戻り値＝1/0
           // shadow(); //影を描く＝この関数は削除した
 セッター     position(pos); // 指定座標に移動する pos={x,y,}
           backcol(c); // 背景色の指定
 ゲッター     data(); // 生データを見せる
           stat(); // 統計を見せる {合計sum, サイズlen, 割合prob} 
           position(); 指定座標を返す
 */

class rvCoin {
  // フィールド変数
  #index;
  #value;
  #position;
  #size;
  #prob;
  #color;
  #shadow;
  #backcol;
  #data;
  // コンストラクタ 中心座標、サイズ（半径）識別番号
  constructor (x0, y0, size, prob, idx) {
    this.#index = idx;
    this.#value = 0;
    this.#size = size;
    this.#prob = prob;
    this.#position = {
      x: x0,
      y: y0,
    };
    this.#shadow = {
      f: color(242),
      b: color(192),
      w: 2,
    };
    this.#color = [
      {f: '#fcc', b: '#f33', w: 2},
      {f: '#cff', b: '#77f', w: 2},
    ];
    this.#backcol = color(242);
    this.#data = [];
  }
  // セッター、ゲッター
  get data() {            // 生データを見せて
    return this.#data;
  }
  get stat() {         // カウントデータを見せて
    let stat = {sum:0, len:0, prob:0, };
    this.#data.forEach((value) => {
      stat.sum += value;
    });
    stat.len = this.#data.length;
    stat.prob = stat.sum / stat.prob;
    return stat;
  }
  get position() {      // 指定座標見せて
    return this.#position;
  }
  set position(pos) {    // 指定した座標へ動かす
    this.#position.x = pos.x;
    this.#position.y = pos.y;
  }
  set backcol(c) {
    this.#backcol = c;
  }
  // 内部関数
  // 公開関数
  // ----- コイン自身をいったん消去する
  #erase() 
  {
    noStroke();
    fill(this.#backcol);
    circle(this.#position.x, this.#position.y, this.#size+3);
  }
  // ----- コインの指定した面を表示する val 0:うら 1:表
  #show(val) 
  {
    fill(this.#color[val].f);
    stroke(this.#color[val].b);
    strokeWeight(this.#color[val].w);
    circle(this.#position.x, this.#position.y, this.#size);
  }
  // ----- なぜか黒い面を見せる
  #blackout() 
  {
    fill(90, 30, 90);
    stroke(60);
    strokeWeight(1);
    circle(this.#position.x, this.#position.y, this.#size-4);
  }
  // ----- コインを振る
  roll() {  // 
    push();
    const success = (random() < this.#prob) ? 1 : 0;  // 裏表を決める
    this.#data.push(success);   // データを追加する
    this.#show(success);        // 表示する
    pop();
    return (success);           // 値を返す
  }

} // end of class

