// ============================================================
// Display formatting + the log-mapped volume slider helpers.
// ============================================================
export const fmtMoney = (n: number): string =>
  n >= 1000 ? '$' + Math.round(n).toLocaleString('en-US')
    : n >= 100 ? '$' + n.toFixed(0)
      : '$' + n.toFixed(2);

export const fmtInt = (n: number): string => Math.round(n).toLocaleString('en-US');

export const fmtGB = (gb: number): string =>
  gb >= 1000 ? (gb / 1000).toFixed(1) + ' TB'
    : gb >= 1 ? gb.toFixed(0) + ' GB'
      : (gb * 1000).toFixed(0) + ' MB';

// Monthly-prompt slider is log-mapped across 100k → 50M
export const VOL_MIN = 100_000;
export const VOL_MAX = 50_000_000;

export const sliderToVolume = (t: number): number => {
  const v = VOL_MIN * Math.pow(VOL_MAX / VOL_MIN, t / 100);
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.round(v / (mag / 2)) * (mag / 2);
};

export const volumeToSlider = (v: number): number =>
  Math.round((Math.log(v / VOL_MIN) / Math.log(VOL_MAX / VOL_MIN)) * 100);
