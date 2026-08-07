export const setSessionStorage = (key: string, value: any): void => {
  sessionStorage.setItem(key, JSON.stringify(value));
};

export const getSessionStorage = (key: string): any | null => {
  const result = sessionStorage.getItem(key);
  if (result !== 'undefined' && result) return JSON.parse(result);
  return null;
};

export const setLocalStorage = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getLocalStorage = (key: string) => {
  const result = localStorage.getItem(key);
  if (result !== 'undefined' && result) {
    return JSON.parse(result);
  }
  return null;
};

export const setLocalStorageWithTime = (key: string, value: any) => {
  const datas = { data: value, time: Date.now() };
  localStorage.setItem(key, JSON.stringify(datas));
};

export const getLocalStorageWithTime = (key: string) => {
  const datas = localStorage.getItem(key);
  if (datas !== 'undefined' && datas) {
    const result = JSON.parse(datas);
    const time = 60 * 60 * 24 * 10 * 1000;
    if (Date.now() - result.time > time) {
      localStorage.removeItem(key);
      return null;
    } else {
      return JSON.parse(datas).data;
    }
  }
  return null;
};

export const resetLocalStorageWithTime = (key: string, value: any) => {
  const datas = localStorage.getItem(key);
  if (!datas || datas === 'undefined') return;
  const newDatas = JSON.parse(datas);
  const result = { data: value, time: newDatas.time };
  localStorage.setItem(key, JSON.stringify(result));
};
