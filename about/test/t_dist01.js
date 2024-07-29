// t分布

// t分布の両側5％区間臨界値
const t_val = {
  df:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60],
  t:[0,12.70620,4.30265,3.18245,2.77645,2.57058,2.44691,2.36462,2.306,2.26216,2.22814,2.20099,2.17881,2.16037,2.14479,2.13145,2.11991,2.10982,2.10092,2.09302,2.08596,2.07961,2.07387,2.06866,2.0639,2.05954,2.05553,2.05183,2.04841,2.04523,2.04227,2.03951,2.03693,2.03452,2.03224,2.03011,2.02809,2.02619,2.02439,2.02269,2.02108,2.01954,2.01808,2.01669,2.01537,2.0141,2.0129,2.01174,2.01063,2.00958,2.00856,2.00758,2.00665,2.00575,2.00488,2.00404,2.00324,2.00247,2.00172,2.001,2.0003]
};


/** ========================================== 
 * 自由度に対応した両側5％区間臨界値を返す
 * 両側検定に用いる臨界値と等しい。
 * 使用法：t0 = t_value(9); //return 2.26216
 */
function t_value(df) {

  // 自由度範囲は1～60まで
  if (df==0 || df>60) {
    return NaN;
  } else {
    return t_val.t[df];
  }

}


/** ========================================== 
 * 1群の平均値の検定を行い結果を返す
 * 使用法：res = OneSampleTtest(dat1);
 * 戻り値：検定統計量t, 臨界値, 検定結果t/f, 平均値信頼区間上限, 同下限
 * データベクトル da1 を渡す。
 */
function OneSampleTtest(dat1, mu=0) {

  // データベクトルであることを確認
  if (dat1.length < 1) return NaN;

  // 戻り値
  let result={mean:0, u2:0, n:0, df:0, se_hat:0, t0:0, t_crt:0, p_ast:false, ci_low:0, ci_up:0};
  
  // 統計量を計算する
  result.n = dat1.length;
  result.df = result.n - 1;
  result.mean = calc_mean(dat1);
  result.u2 = calc_variance(dat1, true);
  result.se_hat = Math.sqrt(result.u2 / result.n);
  
  // 検定統計量ｔを計算する
  result.t0 = (result.mean-mu) / result.se_hat;
  // 臨界値を検索する
  result.t_crt = t_value(result.df);
  // 両側検定5％有意かどうかを判定するresult.df
  result.p_ast = (result.t0 >= result.t_crt) ? true : false;
  // 平均値信頼区間を計算する
  result.ci_low = result.mean - result.t_crt * result.se_hat;
  result.ci_up = result.mean + result.t_crt * result.se_hat;

  return result;
}


/** ========================================== 
 * 平均を計算する
 */
function calc_mean(dat) {
  if (dat.length < 1) return NaN;
  let s = 0;
  dat.forEach((value, index) => { s+= value });
  return s / dat.length;
}


/** ========================================== 
 * 平方和を計算する
 */
function calc_SumDev(dat) {
  if (dat.length < 1) return NaN;
  const m = calc_mean(dat);
  let s = 0;
  dat.forEach((value, index) => { s+= (value-m)**2 });
  return s;
}


/** ========================================== 
 * 分散を計算する （不偏分散のときは unbiased=true を指定する）
 */
function calc_variance(dat, unbiased=false) {
  if (dat.length < 1) return NaN;
  const df = dat.length + (unbiased ? -1: 0);
  const m = calc_mean(dat);
  const ss = calc_SumDev(dat);
  return ss / df;
}

/** ========================================== 
 * 共分散を計算する （不偏のときは unbiased=true を指定する）
 */
function calc_covariance(dat1, dat2, unbiased=false) {
  if (dat1.length < 1) return NaN;
  if (dat2.length < 1) return NaN;
  if (dat1.length != dat2.length) return NaN;
  let ss = 0;
  const m1 = calc_mean(dat1);
  const m2 = calc_mean(dat2);
  const df = dat1.length + (unbiased ? -1: 0);
  for (let i=0; i<dat1.length; i++) {
    ss += (dat1[i]-m1) * (dat2[i]-m2);
  }
  return (ss / df);
}
