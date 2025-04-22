// 技術指標計算函數
// K線資料格式: [{t, o, h, l, c}]

export function calcMA(candles, period) {
  const ma = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      ma.push(null);
    } else {
      const sum = candles.slice(i - period + 1, i + 1).reduce((acc, x) => acc + x.c, 0);
      ma.push(sum / period);
    }
  }
  return ma;
}

export function calcRSI(candles, period = 14) {
  let gains = 0, losses = 0;
  const rsi = Array(candles.length).fill(null);
  for (let i = 1; i < candles.length; i++) {
    const diff = candles[i].c - candles[i - 1].c;
    if (i <= period) {
      if (diff > 0) gains += diff;
      else losses -= diff;
      if (i === period) {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        rsi[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
      }
    } else {
      const prevRSI = rsi[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      gains = (gains * (period - 1) + gain) / period;
      losses = (losses * (period - 1) + loss) / period;
      rsi[i] = losses === 0 ? 100 : 100 - (100 / (1 + gains / losses));
    }
  }
  return rsi;
}

export function calcMACD(candles, fast = 12, slow = 26, signal = 9) {
  const ema = (period) => {
    const k = 2 / (period + 1);
    let emaArr = [];
    let prev;
    for (let i = 0; i < candles.length; i++) {
      if (i === 0) prev = candles[i].c;
      else prev = candles[i].c * k + prev * (1 - k);
      emaArr.push(prev);
    }
    return emaArr;
  };
  const emaFast = ema(fast);
  const emaSlow = ema(slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  // Signal
  let signalArr = [];
  let prev = macdLine[0];
  for (let i = 0; i < macdLine.length; i++) {
    if (i === 0) prev = macdLine[i];
    else prev = macdLine[i] * (2 / (signal + 1)) + prev * (1 - (2 / (signal + 1)));
    signalArr.push(prev);
  }
  const hist = macdLine.map((v, i) => v - signalArr[i]);
  return { macdLine, signal: signalArr, hist };
}

export function calcBollinger(candles, period = 20, k = 2) {
  const ma = calcMA(candles, period);
  const stddev = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) stddev.push(null);
    else {
      const slice = candles.slice(i - period + 1, i + 1).map(x => x.c);
      const mean = ma[i];
      const variance = slice.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / period;
      stddev.push(Math.sqrt(variance));
    }
  }
  return {
    upper: ma.map((m, i) => m !== null ? m + k * stddev[i] : null),
    lower: ma.map((m, i) => m !== null ? m - k * stddev[i] : null),
    middle: ma
  };
}
