// Core settlement engine. Amounts are stored as integer cents to avoid floating-point errors.
function calculateBalances(gathering){
  const balances = Object.fromEntries(gathering.participants.map(id=>[id,0]));
  for(const expense of gathering.expenses){
    const shares = splitExpense(expense);
    balances[expense.payer] += expense.amount;
    for(const [person,share] of Object.entries(shares)) balances[person] -= share;
  }
  return balances;
}
function splitExpense(expense){
  const people=expense.participants; const out=Object.fromEntries(people.map(p=>[p,0]));
  if(!people.length)return out;
  if(expense.method==='percent'){
    let allocated=0; people.forEach((p,i)=>{const v=i===people.length-1?expense.amount-allocated:Math.round(expense.amount*(expense.values[p]||0)/100);out[p]=v;allocated+=v});
  }else if(expense.method==='amount'){
    let allocated=0; people.forEach((p,i)=>{const v=i===people.length-1?expense.amount-allocated:(expense.values[p]||0);out[p]=v;allocated+=v});
  }else{
    const base=Math.floor(expense.amount/people.length); let remainder=expense.amount-base*people.length;
    people.forEach((p,i)=>out[p]=base+(i>=people.length-remainder?1:0));
  }
  return out;
}
function simplifyTransfers(balances){
  const debtors=Object.entries(balances).filter(([,v])=>v<0).map(([id,v])=>({id,amount:-v})).sort((a,b)=>b.amount-a.amount);
  const creditors=Object.entries(balances).filter(([,v])=>v>0).map(([id,v])=>({id,amount:v})).sort((a,b)=>b.amount-a.amount);
  const transfers=[]; let i=0,j=0;
  while(i<debtors.length&&j<creditors.length){const amount=Math.min(debtors[i].amount,creditors[j].amount);if(amount>0)transfers.push({from:debtors[i].id,to:creditors[j].id,amount});debtors[i].amount-=amount;creditors[j].amount-=amount;if(debtors[i].amount===0)i++;if(creditors[j].amount===0)j++}
  return transfers;
}
function formatMoney(cents){return new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Math.round(cents/100)).replace('ARS','').trim()}
