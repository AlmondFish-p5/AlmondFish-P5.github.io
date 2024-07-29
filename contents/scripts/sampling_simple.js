/**
 *  サンプリング体験 sampling_simple.js
 ================================================== */

// ページ上で設定する変数
let userPopulationSize;       // 母集団サイズ
let userPopulationType;       // 母集団タイプ
let userSampleSize = {
  n: 0, w: 0, h: 0,           // サンプリング領域 合計、横、縦
};
let rvArraySize = {
  col: 100, row: 0,           // 母集団個体の並び方 列、行
};

// それらを用いて設定する広域定数
let canvas;
let canvas_width;       // rvSize * rv_length
let canvas_height;      // rvSize * rv_length + stats_height
let plotArea = {x: 0, y: 0, w: 0, h: 0, };
let statArea = {x: 0, y: 0, w: 0, h: 100, };

// その他の定数
const rvSize = 9;  // 確率変数1つのサイズ
const canvas_background = 192;
const sampling_background = 'white';

// 母集団・標本情報
let rvPopulation;    // 母集団
let parameter = {
  master: 0.4,          // 大学院進学を希望するか
  math: [1,2,3,4,5],    // 数学は好きかの回答パタン
  mu:0, sigma:0,        // 統計テストの平均と標準偏差
}; // 母集団パラメータ
let sample_index = [];  // 標本抽出番号
let sample_df;          // 抽出された標本データ
let sample_stat;        // 標本統計量
let rawData = [];
let samplingPosition = {x:0, y:0, index:0, };

let loopOn = false;

// ============================================================
// HTMLの変更

// 母集団サイズの変更
document.querySelector('#population_size').addEventListener('change', ()=>{
  readHtmlSettings();
});
// 母集団タイプの変更
document.querySelector('#population_type').addEventListener('change', ()=>{
  readHtmlSettings();
});
// 標本サイズ：高さ
document.querySelector('#sample_height').addEventListener('change', ()=>{
  readHtmlSettings();
});
// 標本サイズ：幅
document.querySelector('#sample_width').addEventListener('change', ()=>{
  readHtmlSettings();
});

// サンプリング動作を開始する
document.querySelector('#btn_start').addEventListener('click', () => {
  document.querySelector('#population_size').disabled = true;
  document.querySelector('#population_type').disabled = true;
  document.querySelector('#sample_height').disabled = true;
  document.querySelector('#sample_width').disabled = true;
  document.querySelector('#btn_start').disabled = true;
  //readHtmlSettings();
  loopOn = true;
  loop();
});
// リセットボタン
document.querySelector('#btn_reset').addEventListener('click', ()=> {
  window.location.reload();
});

// HTML起動時に設定されている値を読み込む＋パラメータを設定する
function readHtmlSettings() {
  userPopulationSize = document.querySelector('#population_size').value * 1;
  userPopulationType = document.querySelector('#population_type').value;
  userSampleSize.w = document.querySelector('#sample_width').value * 1;
  userSampleSize.h = document.querySelector('#sample_height').value * 1;
  userSampleSize.n = userSampleSize.w * userSampleSize.h;
  rvArraySize.row = userPopulationSize / rvArraySize.col;
  // 母集団を設定する
  setPopulation();
  // シミュレーション画面の表示
  doSimulation();
}

/**
 *  母集団設定関連
 ============================================================ */
// 個体クラス
class Individual {
  // フィールド変数
  #ID;
  #position;
//  #variables;
  #visual;
  // コンストラクタ
  constructor(id, x, y, s, para) {
    this.#ID = id;
    this.#position = {
      x: x, 
      y: y,
    };
    this.#visual = {
      size: s,
      fill: [
        color( 64,160,192), color( 64,192,160), color( 64,176,176), 
        color( 92,192,160), color( 92,160,192), color( 92,176,176), 
        color( 80,128,208), color( 80,208,128), color( 80,160,160)
      ],
    };
//    this.#variables = {
//      master: (random(0,1) < para.master ? 1 : 0),  // 都市部に在住の割合
//      math: random(para.math),                  // 数学は好きか
//      test: Math.ceil(randomGaussian(para.mu, para.sigma)),  // 統計テスト
//    };
//    if (this.#variables.norm > 100) this.#variables.norm = 99;
//    if (this.#variables.norm < 10)  this.#variables.norm = 15;
  }
  // ゲッター、セッター
//  get data() {
//    return this.#variables;
//  }
  // 広域関数
  show() {
    noStroke();
    fill(random(this.#visual.fill));
    const jx = random([-0.9,-0.6,-0.3,0,0.3,0.6,0.9]);
    const jy = random([-0.9,-0.6,-0.3,0,0.3,0.6,0.9]);
    circle(this.#position.x+jx, this.#position.y+jy, this.#visual.size);
  }
}
// 母集団個体を設定する
function setPopulation() {
  // パラメータ設定
  switch (userPopulationType) {
    case 'b':   // やや偏り
      parameter.master = 0.42;
      parameter.math = [1,1,1,2,2,2,2,2,3,3,3,3,4,4,5];
      parameter.mu = 64;
      parameter.sigma = 9.3;
      break;
    case 'c':   // かなり偏り
      parameter.master = 0.74;
      parameter.math = [1,2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5];
      parameter.mu = 78.5;
      parameter.sigma = 14.6;
      break;
    case 'a':   // 標準
    default:
      parameter.master = 0.5;
      parameter.math = [1,2,2,3,3,3,3,3,4,4,5];
      parameter.mu = 70;
      parameter.sigma = 10;
      break;
  }
  // オブジェクトの準備
  rvPopulation = new Array(userPopulationSize);
  for (i=0; i<userPopulationSize; i++) {
    const x = rvSize/2 + rvSize * (i % rvArraySize.col);
    const y = rvSize/2 + rvSize * int(i / rvArraySize.col);
    rvPopulation[i] = new Individual(i, x, y, rvSize-3, parameter);
  }
}

/** 
 *  シミュレーションの基本動作
 ============================================================ */
// シミュレーション画面を出す
function doSimulation() {
  // エリアの設定
  plotArea = {
    x: 0, 
    y: 0, 
    w: rvSize * rvArraySize.col, 
    h: rvSize * rvArraySize.row, 
  };
  statArea = {
    x: 0, 
    y: rvSize * rvArraySize.row+1, 
    w: rvSize * rvArraySize.col, 
    h: 200, 
  };
  // キャンバスの再設定
  canvas_width = plotArea.w;
  canvas_height = plotArea.h + statArea.h;
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.querySelector('#p5'));
  background(255);
  // 確率変数の表示
  drawSamplingArea(false);
  let about_text = `（母集団の約${round((userSampleSize.n / userPopulationSize) * 100, 1)}％を抽出）`;
  document.querySelector('#smp_about').innerHTML = about_text;
}

// サンプリングエリアを描き、個体を表示する mousePosition : マウス位置を検知する
function drawSamplingArea(mousePosition = false) {
  // console.log('手順1 サンプリングエリアを四角形で描く');
  noStroke();
  fill(canvas_background);
  rect(plotArea.x, plotArea.y, plotArea.w, plotArea.h);
  fill(sampling_background);

  if (!mousePosition) {
    rect(2*rvSize, 3*rvSize, rvSize*userSampleSize.w, rvSize*userSampleSize.h);
  } else {
    // 四角形を描く領域左上は、左上から数えて何番目の個体であるかを計算している
    const x = max(0, int(min(mouseX,plotArea.w-rvSize*userSampleSize.w) / rvSize));
    const y = max(0, int(min(mouseY,plotArea.h-rvSize*userSampleSize.h) / rvSize));

    rect(x*rvSize, y*rvSize, rvSize*userSampleSize.w, rvSize*userSampleSize.h);
    samplingPosition.x = x;
    samplingPosition.y = y;
    samplingPosition.index = x * userSampleSize.w + y * userSampleSize.h;
  }
  // マウスの位置によってランダムシードを変える
  randomSeed(samplingPosition.index + 999);
  // 母集団個体を並べる
  rvPopulation.forEach((pop) => {
    pop.show();
  });
}

// サンプリングを終わる
function endSampling() {
  loopOn = false;
  noLoop();
  canvas.mouseClicked(false);
//  getStats();
  generateData();
  dispStats();
  prepairDownload();
}

// データを生成する：
// つまりサンプリングした瞬間に、母数をもとにデータを生成するのであって、個体にデータを紐づけていない
// こうすることで、母数をいくつかの種類から選択して一定に保つことができる。
function generateData() {
  sample_df = {
    master: [],
    math  : [],
    test  : [],
  };
  rawData.push('master, math, test');
  sample_df.master = new Array(userSampleSize.n).fill(0).map((value) => {
    return (random(0,1) < parameter.master ? 1 : 0);
  });
  sample_df.math = new Array(userSampleSize.n).fill(0).map((value) => {
    return random(parameter.math);
  });
  sample_df.test = new Array(userSampleSize.n).fill(0).map((value) => {
    const x = randomGaussian(parameter.mu, parameter.sigma);
    return (x > 100 ? 99 : (x < 0 ? 15 : round(x)));
  });
  for (let i=0; i<userSampleSize.n; i++) {
    rawData.push(`${sample_df.master[i]}, ${sample_df.math[i]}, ${sample_df.test[i]}`);
  }
}
// 統計を表示する
function dispStats() {
  sample_stat = {
    master: countStat(sample_df.master).slice(0,2),
    math: countStat(sample_df.math).slice(1,6),
    test: calcStat(sample_df.test),
  };
  // 表示
  fill(0);
  noStroke();
  let y = statArea.y + 12;
  textAlign(LEFT, BASELINE);
  textSize(15);
  text(`大学院進学を希望するか [1:はい、0:いいえ]は、それぞれ[${sample_stat.master[1]},${sample_stat.master[0]}]`, statArea.x+20, y+=20);
  text(`数学は好きか [1:大嫌い～5:大好き]は、それぞれ[${sample_stat.math.join(',')}]`, statArea.x+20, y+=20);
  text(`統計テスト成績[0～100] 平均点=${sample_stat.test.mean.toFixed(3)}、標準偏差=${sample_stat.test.sd.toFixed(3)}`, statArea.x+20, y+=20);
  
  let pop_info = [];
  let x0 = countStat(parameter.math).slice(1,6);
  x0 = x0.map((value) => {
    return (value / parameter.math.length) * 100;
  });
  fill('red');
  text('母集団情報', statArea.x+20, y+=40);
  fill(0);
  text(`大学院進学を希望する割合：${parameter.master*100}％`, statArea.x+20, y+=20);
  text(`数学は好きかの回答分布：[1,2,3,4,5]はそれぞれ、[${x0[0].toFixed(1)}％,${x0[1].toFixed(1)}％,${x0[2].toFixed(1)}％,${x0[3].toFixed(1)}％,${x0[4].toFixed(1)}％]`, statArea.x+20, y+=20);
  text(`統計テストの成績：平均は${parameter.mu}点、標準偏差は${parameter.sigma}点`, statArea.x+20, y+=20);
}

// サンプリングの結果を返す 
/**
function getStats() {
  //console.log(samplingPosition);
  for (let j=0; j<userSampleSize.h; j++) {
    for (let i=0; i<userSampleSize.w; i++) {
      sample_index.push(rvArraySize.col*(samplingPosition.y+j) + samplingPosition.x + i);
    }
  }
  //console.log(sample_index);
  // データの取得
  sample_df = {
    city: [],
    exer: [],
    math: [],
    test: [],
  };
  rawData.push('ID, city, exer, math, test');
  sample_index.forEach((value) => {
    const d = rvPopulation[value].data;
    sample_df.city.push(d.city);
    sample_df.exer.push(d.exer);
    sample_df.math.push(d.math);
    sample_df.test.push(d.test);
    rawData.push(`${value}, ${d.city}, ${d.exer}, ${d.math}, ${d.test}`);
  });
  sample_stat = {
    city: countStat(sample_df.city).slice(0,2),
    exer: countStat(sample_df.exer).slice(0,4),
    math: countStat(sample_df.math).slice(1,6),
    test: calcStat(sample_df.test),
  };
  // 表示
//  fill(255);
//  noStroke();
//  rect(statArea.x, statArea.y, statArea.w, statArea.h);
  fill(0);
  noStroke();
  let y = statArea.y + 12;
  textAlign(LEFT, BASELINE);
  textSize(15);
  text(`都市部在住か [1:はい、0:いいえ]は、それぞれ[${sample_stat.city[1]},${sample_stat.city[0]}]`, statArea.x+20, y+=20);
  text(`日ごろ運動しているか [0:全くしない～3:毎日している]は、それぞれ[${sample_stat.exer.join(',')}]`, statArea.x+20, y+=20);
  text(`数学は好きか [1:大嫌い～5:大好き]は、それぞれ[${sample_stat.math.join(',')}]`, statArea.x+20, y+=20);
  text(`統計テスト成績[0～100] 平均点=${sample_stat.test.mean.toFixed(3)}、標準偏差=${sample_stat.test.sd.toFixed(3)}`, statArea.x+20, y+=20);
}
*/

// 統計関数：このページでだけ使う予定で
function calcStat(d) {
  let m = 0;
  d.forEach((val) => { m+=val; });
  m /= d.length;
  let u = 0;
  d.forEach((val) => { u += (val-m)**2; });
  u /= (d.length - 1);
  return {mean: m, u2: u, sd: Math.sqrt(u), };
}
// 統計関数２：最高10種類までの自然数がいくつかるかしか数えられない
function countStat(d) {
  let s = new Array(10).fill(0);
  d.forEach((val) => {
    s[val]++;
  });
  return s;
}

// 母集団統計を返す 
function getPopulationStats() {
  // データの取得
  // 表示
//  let pop_stat_str = [];
//  pop_stat_str.push(`都市部在住か [1:はい、0:いいえ]は、それぞれ[${pop_stat.city[1]},${pop_stat.city[0]}]`);
//  pop_stat_str.push(`日ごろ運動しているか [0:全くしない～3:毎日している]は、それぞれ[${pop_stat.exer.join(',')}]`);
//  pop_stat_str.push(`数学は好きか [1:大嫌い～5:大好き]は、それぞれ[${pop_stat.math.join(',')}]`);
//  pop_stat_str.push(`統計テスト成績[0～100] 平均点=${pop_stat.test.mean.toFixed(3)}、標準偏差=${pop_stat.test.sd.toFixed(3)}`);
//  return pop_stat_str;
}

/** 
 *  初期化関数
 ============================================================ */
// 初期化関数本体
function setup() {
  // htmlで初期設定されている値を取得する
  readHtmlSettings();
  frameRate(5);
  noLoop();
}

/** 
 *  描画関数
 ============================================================ */
// 描画関数本体
function draw() {
  if (loopOn) {
    drawSamplingArea(true);
    canvas.mouseClicked(endSampling);// クリックしたらサンプリングを止める
  }
}

// ローデータの提供
function dispRawData() {
  let script = [];
  let result = [];


  result += '<button class="copybutton" data-clipboard-target="#raw_data">Copy Raw Data</button></p>';
  result += '<h3>R Script</h3>';
  result += '<p><textarea rows="6" cols="70" id="r_script">' + script.join('\n') + '</textarea>';
  result += '<button class="copybutton" data-clipboard-target="#r_script">Copy R Script</button></p>';
  result += '<h3>母集団情報</h3>';
  result += '<p><textarea rows="3" cols="70" id="r_script">' + pop_info.join('\n') + '</textarea>';

  document.querySelector('#result').innerHTML = result;
  document.querySelector('#result').style.marginLeft = '50px';
}

// ローデータの提供 データダウンロードの準備をする
function prepairDownload() {
  document.querySelector('#download').style.display = 'block';
  document.querySelectorAll('.data_download').forEach((element) => {
    element.addEventListener('click', ()=>{
      const csvData = makeDownloadData(element.id);
      const filename = element.id=='script' ? 'script.r' : `${element.id}.csv`;
      saveCsvFile(csvData, filename);
    });
  });
  // 必要に応じて
  document.querySelector('#stats_data').disabled = true; // 統計データがない
}
// ダウンロードファイルをつくる
function makeDownloadData(id) {
  let data = [];
  switch (id) {
    // ---------------------- ローデータの作成
    case 'raw_data':
      for (let i=0; i<rawData.length; i++) {
        data[i] = rawData[i];
      }
      break;
    // ---------------------- 統計データの作成
    case 'stats_data':
      break;
    // ---------------------- スクリプトの作成
    case 'script':
      data.push('# サンプリング体験１');
      data.push('df <- read.csv("raw_data.csv")');
      data.push('head(df)');
      data.push('# 一次集計');
      data.push('t1 <- table(df[,1])');
      data.push('names(t1) <- c("いいえ","はい")');
      data.push('t1');
      data.push('barplot(t1, main="大学院進学希望")');
      data.push('barplot(table(df[,2]), main="数学は好きか")');
      data.push('hist(df[,3], xlab="点数", main="統計テストの点数")');
      data.push('# 統計量の計算');
      data.push('apply(df, 2, mean)');
      data.push('apply(df, 2, var)');
      data.push('apply(df, 2, sd)');
      break;
    default:
      return null;
  }
  data.push('');
  return data.join('\n');
}

