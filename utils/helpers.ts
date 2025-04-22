// 通用輔助函數

export function formatNumber(num: number, decimals = 2) {
  return num?.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function percent(val: number, decimals = 2) {
  return (val * 100).toFixed(decimals) + '%';
}

export function safeGet(obj: any, path: string, def: any = null) {
  return path.split('.').reduce((o, p) => (o && o[p] !== undefined ? o[p] : def), obj);
}
