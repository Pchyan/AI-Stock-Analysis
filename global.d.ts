// 全局類型定義

interface Window {
  updateTradesAfterStockRemoval?: (symbol: string) => void;
}

// 全局變數定義
declare global {
  var __JOURNAL_DATA: any[] | undefined;
}
