/** ==========================================
 *  descript_stat.jp
 *  記述統計関数群
 *  ==========================================
 *  関数リスト
    - calc_mean(dat) : 平均値
    - calc_ss_dev(dat) : 偏差平方和 内部でcalc_meanを呼ぶ
    - calc_variance(dat, unbiased=false) : 分散 <-calc_mean, calc_ss_dev
    - calc_sd(dat, unbiased=false) : 標準偏差 <-calc_variance
    - calc_covariance(dat1, dat2, unbiased=false) : 共分散 <-calc_mean
          不偏分散を求める時には、第2引数にtrueを指定する。規定値はfalse。
          calc_sd, calc_covarianceでも同様。
    - calc_correlation(dat1, dat2) : 相関係数 <-calc_covariance, calc_sd
 */

/** ------------------------------------------
 * 平均値を計算する
 */
function calc_mean(dat) {
  if (dat.length < 1) return NaN;
  let s = 0;
  dat.forEach((value, index) => { s+= value; });
  return (s / dat.length);
}

/** ------------------------------------------
 * 平方和を計算する
 */
function calc_ss_dev(dat) {
  if (dat.length < 1) return NaN;
  const m = calc_mean(dat);
  let s = 0;
  dat.forEach((value, index) => { s+= (value-m)**2; });
  return s;
}

/** ------------------------------------------
 * 分散を計算する （不偏分散のときは unbiased=true を指定する）
 */
function calc_variance(dat, unbiased=false) {
  if (dat.length < 1) return NaN;
  const df = dat.length + (unbiased ? -1: 0);
  const m = calc_mean(dat);
  const ss = calc_ss_dev(dat);
  return (ss / df);
}

/** ------------------------------------------
 * 標準偏差を計算する （不偏分散のときは unbiased=true を指定する）
 */
function calc_sd(dat, unbiased=false) {
  return (Math.sqrt(calc_variance(dat, unbiased)));
}

/** ------------------------------------------
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

/** ------------------------------------------
 * 相関係数を計算する
 */
 function calc_correlation(dat1, dat2) {
   const cov = calc_covariance(dat1, dat2);
   const sd1 = calc_sd(dat1);
   const sd2 = calc_sd(dat2);
   return (cov / (sd1 * sd2));
 }

