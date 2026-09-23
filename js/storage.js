const STORAGE_KEY = 'rush-split-v1';
const defaultData = { group: { id:'rush', name:'RUSH', people:[] }, gatherings:[] };
function loadData(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(defaultData);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultData), ...parsed, group:{...structuredClone(defaultData.group), ...(parsed.group||{})}, gatherings:Array.isArray(parsed.gatherings)?parsed.gatherings:[] };
  } catch(e){ return structuredClone(defaultData); }
}
function saveData(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function uid(prefix='id'){ return prefix+'_'+Math.random().toString(36).slice(2,10)+'_'+Date.now().toString(36); }
