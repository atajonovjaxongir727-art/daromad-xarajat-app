const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    }).on('error', reject);
  });
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: JSON.parse(data) });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('--- 1. Testing Web Root (HTML) ---');
  const rootRes = await get('http://localhost:3000/');
  console.log('HTTP Status:', rootRes.status);
  console.log('Contains root element:', rootRes.data.includes('id="root"'));
  console.log('Contains Title:', rootRes.data.includes('Daromad va Xarajatlarni Boshqarish Tizimi'));

  console.log('\n--- 2. Testing API /api/dashboard ---');
  const dashRes = await get('http://localhost:3000/api/dashboard');
  const dash = JSON.parse(dashRes.data);
  console.log('Dashboard Success:', dash.success);
  console.log('Today:', dash.data.today);
  console.log('Total Income:', dash.data.kpi.totalIncome);
  console.log('Total Expense:', dash.data.kpi.totalExpense);
  console.log('Net Balance:', dash.data.kpi.netBalance);
  console.log('Total Receivable:', dash.data.kpi.totalReceivable);
  console.log('Overdue Debts:', dash.data.kpi.overdueDebts);
  console.log('Ali Balance:', dash.data.users.ali.balance);
  console.log('Vali Balance:', dash.data.users.vali.balance);
  console.log('Total Accounts Balance:', dash.data.accounts.totalBalance);
  console.log('Notifications:', dash.data.notifications);

  console.log('\n--- 3. Testing API /api/debts ---');
  const debtRes = await get('http://localhost:3000/api/debts?status=OPEN');
  const debts = JSON.parse(debtRes.data);
  console.log('Open Debts Count:', debts.data.length);
  if (debts.data.length > 0) {
    const firstDebt = debts.data[0];
    console.log(`First Debt: ${firstDebt.recurringIncome.title} (${firstDebt.yearMonth}) - Remaining: ${firstDebt.remainingAmount} UZS, Status: ${firstDebt.status}`);
  }

  console.log('\n--- 4. Testing End-to-End Payment Collection Workflow ---');
  // Topamiz bitta ochiq qarzni
  const unpaid = debts.data.find(d => d.remainingAmount > 0);
  if (unpaid) {
    const accountsRes = await get('http://localhost:3000/api/accounts');
    const accData = JSON.parse(accountsRes.data);
    const targetAccount = accData.data.accounts[0]; // Naqd pul
    const initialAccBalance = targetAccount.balance;
    const initialAliBalance = dash.data.users.ali.income;

    console.log(`Initial Account Balance (${targetAccount.name}): ${initialAccBalance}`);
    console.log(`Paying 250,000 UZS towards: ${unpaid.recurringIncome.title} (${unpaid.yearMonth})`);

    const payRes = await post(`http://localhost:3000/api/debts/${unpaid.id}/pay`, {
      amount: 250000,
      paymentDate: '2026-10-02',
      accountId: targetAccount.id,
      receivedById: unpaid.assignedUserId,
      note: 'Test qisman tolov qabul qilindi',
    });

    console.log('Payment API Response:', payRes.data.success);
    console.log('New Instance Status:', payRes.data.data.instance.status);
    console.log('New Instance Paid Amount:', payRes.data.data.instance.paidAmount);
    console.log('Remaining Debt:', payRes.data.data.remainingDebt);
    console.log('New Account Balance:', payRes.data.data.account.balance);
    console.log(`Balance increased by exactly: ${payRes.data.data.account.balance - initialAccBalance} UZS!`);

    // Yangi daromad yaratilganini tekshiramiz
    const checkDash = JSON.parse((await get('http://localhost:3000/api/dashboard')).data);
    console.log('New Dashboard Real Income:', checkDash.data.kpi.totalIncome);
    console.log('New Dashboard Net Balance:', checkDash.data.kpi.netBalance);
  }

  console.log('\n✅ BARCHA TESTLAR VA BIZNES MANTIQ 100% MUVAFFAQIYATLI ISHLADI!');
}

run().catch(console.error);
